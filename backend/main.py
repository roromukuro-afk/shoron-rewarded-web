from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional
import json
import io
import asyncio
import logging
from datetime import date, datetime
import re

from database import get_db, init_db
from models import Stock, ScreeningResult, ExclusionList, AARRecord
from data_fetcher import load_jp_universe, load_us_universe, get_stock_data
from screening_engine import screen_single_stock
from export_utils import export_csv, export_excel, generate_aar_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="短期急騰3000円以下AIスクリーナー API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# スクリーニング進捗管理
screening_progress = {
    "running": False,
    "total": 0,
    "done": 0,
    "status": "idle",
    "start_time": None,
    "results": [],
    "errors": [],
}


@app.on_event("startup")
def startup():
    init_db()
    logger.info("Database initialized")


@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    results = db.query(ScreeningResult).filter(ScreeningResult.date == today).all()

    total_stocks = len(results)
    price_pass = sum(1 for r in results if r.price_condition_pass)
    liquidity_pass = sum(1 for r in results if r.liquidity_condition_pass)
    adopted = sum(1 for r in results if r.classification == "採用候補")
    conditional = sum(1 for r in results if r.classification == "条件付き候補")
    watch = sum(1 for r in results if r.classification == "監視候補")
    excluded = sum(1 for r in results if r.exclude_flag)

    # 出来高サイクル別
    vol_cycle_counts = {}
    for r in results:
        k = r.volume_cycle_state or "判定不能"
        vol_cycle_counts[k] = vol_cycle_counts.get(k, 0) + 1

    # チャートサイクル別
    chart_cycle_counts = {}
    for r in results:
        k = r.chart_cycle_state or "判定不能"
        chart_cycle_counts[k] = chart_cycle_counts.get(k, 0) + 1

    # 警告フラグ別
    warning_counts = {}
    for r in results:
        flags = (r.warning_flags or "").split(",")
        for f in flags:
            if f.strip():
                warning_counts[f.strip()] = warning_counts.get(f.strip(), 0) + 1

    # 上位ランキング
    top_candidates = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.date == today)
        .filter(ScreeningResult.classification.in_(["採用候補", "条件付き候補", "監視候補"]))
        .order_by(desc(ScreeningResult.total_score))
        .limit(20)
        .all()
    )

    return {
        "date": today.isoformat(),
        "total_stocks": total_stocks,
        "price_condition_pass": price_pass,
        "liquidity_condition_pass": liquidity_pass,
        "adopted_count": adopted,
        "conditional_count": conditional,
        "watch_count": watch,
        "excluded_count": excluded,
        "vol_cycle_counts": vol_cycle_counts,
        "chart_cycle_counts": chart_cycle_counts,
        "warning_counts": warning_counts,
        "top_candidates": [_result_to_dict(r) for r in top_candidates],
        "screening_running": screening_progress["running"],
        "screening_progress": screening_progress["done"],
        "screening_total": screening_progress["total"],
    }


@app.get("/api/universe")
def get_universe(
    market: str = Query("JP", description="JP, US, ALL"),
    include_adr: bool = False,
):
    stocks = []
    if market in ["JP", "ALL"]:
        stocks.extend(load_jp_universe())
    if market in ["US", "ALL"]:
        stocks.extend(load_us_universe(include_adr=include_adr))
    return {"total": len(stocks), "stocks": stocks[:100]}


class ScreeningConfig(BaseModel):
    market: str = "JP"
    include_adr: bool = False
    price_limit_jpy: float = 3000.0
    min_volume_jp: float = 30000
    min_volume_us: float = 100000
    min_score: float = 65
    apply_exclusion_list: bool = True
    mode: str = "real"
    max_stocks: Optional[int] = None


@app.post("/api/screening/run")
async def run_screening(config: ScreeningConfig, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if screening_progress["running"]:
        return {"message": "スクリーニング実行中です", "status": "running"}

    background_tasks.add_task(_run_screening_task, config, db)
    return {"message": "スクリーニングを開始しました", "status": "started"}


async def _run_screening_task(config: ScreeningConfig, db: Session):
    global screening_progress
    screening_progress["running"] = True
    screening_progress["status"] = "銘柄ユニバース取得中..."
    screening_progress["done"] = 0
    screening_progress["errors"] = []
    screening_progress["results"] = []
    screening_progress["start_time"] = datetime.now().isoformat()

    try:
        # ユニバース取得
        stocks = []
        if config.market in ["JP", "ALL"]:
            stocks.extend(load_jp_universe())
        if config.market in ["US", "ALL"]:
            stocks.extend(load_us_universe(include_adr=config.include_adr))

        if config.max_stocks:
            stocks = stocks[:config.max_stocks]

        screening_progress["total"] = len(stocks)
        screening_progress["status"] = f"{len(stocks)}銘柄のスクリーニングを開始..."

        # 除外リスト取得
        exclusion_symbols = set()
        try:
            excl = db.query(ExclusionList.symbol).all()
            exclusion_symbols = {e.symbol for e in excl}
        except Exception:
            pass

        today = date.today()
        results = []

        for i, stock in enumerate(stocks):
            screening_progress["done"] = i + 1
            screening_progress["status"] = f"スクリーニング中... {i+1}/{len(stocks)} ({stock['symbol']})"

            try:
                result = screen_single_stock(
                    stock=stock,
                    price_limit_jpy=config.price_limit_jpy,
                    min_volume_jp=config.min_volume_jp,
                    min_volume_us=config.min_volume_us,
                    exclusion_symbols=exclusion_symbols,
                    mode=config.mode,
                )
                results.append(result)

                # DB保存
                _save_screening_result(db, result)

            except Exception as e:
                logger.error(f"Error processing {stock['symbol']}: {e}")
                screening_progress["errors"].append(f"{stock['symbol']}: {str(e)[:100]}")

            # APIレート制限対策
            if i % 10 == 0 and config.mode == "real":
                await asyncio.sleep(0.5)

        screening_progress["results"] = results
        screening_progress["status"] = f"完了: {len(results)}銘柄処理済み"

    except Exception as e:
        logger.error(f"Screening task error: {e}", exc_info=True)
        screening_progress["status"] = f"エラー: {str(e)[:200]}"
    finally:
        screening_progress["running"] = False


def _save_screening_result(db: Session, result: dict):
    today = date.today()
    try:
        existing = db.query(ScreeningResult).filter(
            ScreeningResult.symbol == result["symbol"],
            ScreeningResult.date == today,
        ).first()

        data = {k: v for k, v in result.items() if k not in ["date", "price_fetched_at", "fx_fetched_at", "exchange", "sector", "is_adr"]}
        data["date"] = today

        # 数値型変換
        for field in ["price", "jpy_price", "fx_rate", "market_cap", "volume", "volume_avg20",
                      "volume_ratio", "turnover", "price_change_1d", "price_change_5d",
                      "price_change_20d", "ma5", "ma25", "ma75", "ma200", "ma25_deviation",
                      "recent_high_20", "recent_low_20", "support_line", "resistance_line",
                      "upside_to_resistance", "support_distance", "total_score",
                      "upside_score", "future_catalyst_score", "chart_score",
                      "volume_cycle_score", "material_theme_score", "supply_score",
                      "archetype_score", "risk_management_score"]:
            if field in data and data[field] is not None:
                try:
                    import math
                    v = float(data[field])
                    data[field] = None if math.isnan(v) or math.isinf(v) else v
                except (TypeError, ValueError):
                    data[field] = None

        if existing:
            for k, v in data.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
        else:
            obj = ScreeningResult(**{k: v for k, v in data.items() if hasattr(ScreeningResult, k)})
            db.add(obj)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"DB save error for {result.get('symbol')}: {e}")


@app.get("/api/screening/progress")
def get_progress():
    return {
        "running": screening_progress["running"],
        "total": screening_progress["total"],
        "done": screening_progress["done"],
        "status": screening_progress["status"],
        "errors_count": len(screening_progress["errors"]),
        "pct": round(screening_progress["done"] / max(screening_progress["total"], 1) * 100, 1),
    }


@app.get("/api/screening/results")
def get_results(
    db: Session = Depends(get_db),
    classification: Optional[str] = None,
    market: Optional[str] = None,
    min_score: float = 0,
    exclude_flag: Optional[bool] = None,
    page: int = 1,
    per_page: int = 100,
    target_date: Optional[str] = None,
):
    query = db.query(ScreeningResult)

    if target_date:
        try:
            d = date.fromisoformat(target_date)
            query = query.filter(ScreeningResult.date == d)
        except ValueError:
            query = query.filter(ScreeningResult.date == date.today())
    else:
        query = query.filter(ScreeningResult.date == date.today())

    if classification:
        query = query.filter(ScreeningResult.classification == classification)
    if market:
        query = query.filter(ScreeningResult.market == market)
    if min_score > 0:
        query = query.filter(ScreeningResult.total_score >= min_score)
    if exclude_flag is not None:
        query = query.filter(ScreeningResult.exclude_flag == exclude_flag)

    total = query.count()
    results = query.order_by(desc(ScreeningResult.total_score)).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "results": [_result_to_dict(r) for r in results],
    }


@app.get("/api/stocks/{symbol}")
def get_stock(symbol: str, db: Session = Depends(get_db)):
    result = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.symbol == symbol)
        .order_by(desc(ScreeningResult.date))
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="銘柄が見つかりません")
    return _result_to_dict(result)


@app.get("/api/stocks/{symbol}/chart")
def get_stock_chart(symbol: str, period: str = "3mo"):
    df = get_stock_data(symbol, period=period)
    if df is None or df.empty:
        # サンプルデータを返す
        from screening_engine import _generate_sample_data
        df = _generate_sample_data(symbol)

    records = []
    for _, row in df.tail(120).iterrows():
        records.append({
            "date": str(row.get("date", ""))[:10] if "date" in row else "",
            "open": round(float(row.get("open", 0)), 2),
            "high": round(float(row.get("high", 0)), 2),
            "low": round(float(row.get("low", 0)), 2),
            "close": round(float(row.get("close", 0)), 2),
            "volume": int(row.get("volume", 0)),
        })
    return {"symbol": symbol, "data": records}


@app.get("/api/stocks/{symbol}/aar")
def get_stock_aar(symbol: str, db: Session = Depends(get_db)):
    result = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.symbol == symbol)
        .order_by(desc(ScreeningResult.date))
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="銘柄が見つかりません")

    d = _result_to_dict(result)
    aar_text = generate_aar_text(d)
    return {"symbol": symbol, "aar_text": aar_text, "data": d}


@app.post("/api/exclusions/upload")
async def upload_exclusions(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    symbols = []
    names = []

    try:
        if ext == "csv":
            import pandas as pd
            import io
            df = pd.read_csv(io.BytesIO(content), dtype=str, encoding="utf-8")
            for col in ["symbol", "Symbol", "コード", "銘柄コード", "code", "Code"]:
                if col in df.columns:
                    symbols.extend([str(v).strip() for v in df[col].dropna() if str(v).strip()])
            for col in ["name", "Name", "銘柄名"]:
                if col in df.columns:
                    names.extend([str(v).strip() for v in df[col].dropna() if str(v).strip()])
        elif ext in ["xlsx", "xls"]:
            import pandas as pd
            import io
            df = pd.read_excel(io.BytesIO(content), dtype=str)
            for col in ["symbol", "Symbol", "コード", "銘柄コード"]:
                if col in df.columns:
                    symbols.extend([str(v).strip() for v in df[col].dropna() if str(v).strip()])
        else:
            text = content.decode("utf-8", errors="ignore")
            lines = re.split(r"[\n\r,\t]", text)
            for line in lines:
                line = line.strip()
                if re.match(r"^\d{4,5}$", line):
                    symbols.append(line)
                elif re.match(r"^[A-Z]{1,5}$", line):
                    symbols.append(line)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ファイル解析エラー: {str(e)}")

    # 重複除去
    symbols = list(dict.fromkeys(symbols))[:500]

    return {
        "filename": filename,
        "extracted_symbols": symbols,
        "extracted_count": len(symbols),
        "preview": symbols[:20],
    }


class ExclusionItem(BaseModel):
    symbol: str
    name: Optional[str] = ""
    market: Optional[str] = ""
    reason: Optional[str] = ""
    source_file: Optional[str] = ""


@app.post("/api/exclusions")
def add_exclusion(item: ExclusionItem, db: Session = Depends(get_db)):
    existing = db.query(ExclusionList).filter(ExclusionList.symbol == item.symbol).first()
    if existing:
        return {"message": f"{item.symbol} はすでに除外リストに登録されています", "symbol": item.symbol}

    excl = ExclusionList(
        symbol=item.symbol,
        name=item.name,
        market=item.market,
        reason=item.reason,
        source_file=item.source_file,
    )
    db.add(excl)
    db.commit()
    return {"message": f"{item.symbol} を除外リストに追加しました", "symbol": item.symbol}


@app.post("/api/exclusions/bulk")
def add_exclusions_bulk(items: List[ExclusionItem], db: Session = Depends(get_db)):
    added = 0
    for item in items:
        existing = db.query(ExclusionList).filter(ExclusionList.symbol == item.symbol).first()
        if not existing:
            excl = ExclusionList(
                symbol=item.symbol,
                name=item.name,
                market=item.market,
                reason=item.reason,
                source_file=item.source_file,
            )
            db.add(excl)
            added += 1
    db.commit()
    return {"message": f"{added}件の銘柄を除外リストに追加しました", "added": added}


@app.get("/api/exclusions")
def get_exclusions(db: Session = Depends(get_db)):
    exclusions = db.query(ExclusionList).order_by(desc(ExclusionList.created_at)).all()
    return {
        "total": len(exclusions),
        "exclusions": [
            {
                "id": e.id,
                "symbol": e.symbol,
                "name": e.name,
                "market": e.market,
                "reason": e.reason,
                "source_file": e.source_file,
                "created_at": e.created_at.isoformat() if e.created_at else "",
            }
            for e in exclusions
        ],
    }


@app.delete("/api/exclusions/{symbol}")
def delete_exclusion(symbol: str, db: Session = Depends(get_db)):
    excl = db.query(ExclusionList).filter(ExclusionList.symbol == symbol).first()
    if not excl:
        raise HTTPException(status_code=404, detail="除外リストに見つかりません")
    db.delete(excl)
    db.commit()
    return {"message": f"{symbol} を除外リストから削除しました"}


@app.get("/api/export/csv")
def export_csv_endpoint(
    db: Session = Depends(get_db),
    classification: Optional[str] = None,
    target_date: Optional[str] = None,
):
    query = db.query(ScreeningResult)
    if target_date:
        try:
            d = date.fromisoformat(target_date)
            query = query.filter(ScreeningResult.date == d)
        except ValueError:
            query = query.filter(ScreeningResult.date == date.today())
    else:
        query = query.filter(ScreeningResult.date == date.today())

    if classification:
        query = query.filter(ScreeningResult.classification == classification)

    results = query.order_by(desc(ScreeningResult.total_score)).all()
    data = [_result_to_dict(r) for r in results]
    csv_bytes = export_csv(data, classification_filter=None)

    fname = f"screener_{target_date or date.today().isoformat()}"
    if classification:
        fname += f"_{classification}"
    fname += ".csv"

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@app.get("/api/export/excel")
def export_excel_endpoint(
    db: Session = Depends(get_db),
    target_date: Optional[str] = None,
):
    query = db.query(ScreeningResult)
    if target_date:
        try:
            d = date.fromisoformat(target_date)
            query = query.filter(ScreeningResult.date == d)
        except ValueError:
            query = query.filter(ScreeningResult.date == date.today())
    else:
        query = query.filter(ScreeningResult.date == date.today())

    results = query.order_by(desc(ScreeningResult.total_score)).all()
    data = [_result_to_dict(r) for r in results]
    excel_bytes = export_excel(data)

    fname = f"screener_{target_date or date.today().isoformat()}.xlsx"

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


class BacktestRequest(BaseModel):
    symbols: List[str]
    start_date: Optional[str] = None


@app.post("/api/backtest/run")
def run_backtest(req: BacktestRequest, db: Session = Depends(get_db)):
    results = []
    for symbol in req.symbols[:50]:
        df = get_stock_data(symbol, period="3mo")
        if df is None or df.empty:
            continue

        close = df["close"].astype(float)
        n = len(close)
        if n < 2:
            continue

        entry_price = float(close.iloc[-1])
        future_prices = {}
        for days, label in [(1, "1d"), (3, "3d"), (5, "5d"), (10, "10d"), (20, "20d")]:
            idx = -(days + 1) if n > days + 1 else 0
            future_prices[label] = round((float(close.iloc[-1]) - float(close.iloc[idx])) / (float(close.iloc[idx]) + 1e-10) * 100, 2)

        results.append({
            "symbol": symbol,
            "entry_price": round(entry_price, 2),
            "result_1d": future_prices["1d"],
            "result_3d": future_prices["3d"],
            "result_5d": future_prices["5d"],
            "result_10d": future_prices["10d"],
            "result_20d": future_prices["20d"],
            "max_gain": max(future_prices.values()),
            "max_drawdown": min(future_prices.values()),
            "hit_20_percent": max(future_prices.values()) >= 20,
        })

    return {"results": results, "count": len(results)}


@app.get("/api/backtest/results")
def get_backtest_results(db: Session = Depends(get_db)):
    records = db.query(AARRecord).order_by(desc(AARRecord.created_at)).limit(100).all()
    return {
        "total": len(records),
        "records": [
            {
                "id": r.id,
                "symbol": r.symbol,
                "name": r.name,
                "date": r.date.isoformat() if r.date else "",
                "classification": r.classification,
                "score": r.score_before_move,
                "result_1d": r.result_after_1d,
                "result_3d": r.result_after_3d,
                "result_5d": r.result_after_5d,
                "result_10d": r.result_after_10d,
                "result_20d": r.result_after_20d,
                "max_gain": r.max_gain,
                "hit_20_percent": r.hit_20_percent,
            }
            for r in records
        ],
    }


def _result_to_dict(r: ScreeningResult) -> dict:
    def safe(v):
        if v is None:
            return None
        try:
            import math
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return None
        except Exception:
            pass
        return v

    return {
        "symbol": safe(r.symbol),
        "name": safe(r.name),
        "market": safe(r.market),
        "date": r.date.isoformat() if r.date else "",
        "price": safe(r.price),
        "jpy_price": safe(r.jpy_price),
        "fx_rate": safe(r.fx_rate),
        "currency": safe(r.currency),
        "market_cap": safe(r.market_cap),
        "volume": safe(r.volume),
        "volume_avg20": safe(r.volume_avg20),
        "volume_ratio": safe(r.volume_ratio),
        "turnover": safe(r.turnover),
        "price_change_1d": safe(r.price_change_1d),
        "price_change_5d": safe(r.price_change_5d),
        "price_change_20d": safe(r.price_change_20d),
        "ma5": safe(r.ma5),
        "ma25": safe(r.ma25),
        "ma75": safe(r.ma75),
        "ma200": safe(r.ma200),
        "ma25_deviation": safe(r.ma25_deviation),
        "recent_high_20": safe(r.recent_high_20),
        "recent_low_20": safe(r.recent_low_20),
        "support_line": safe(r.support_line),
        "resistance_line": safe(r.resistance_line),
        "upside_to_resistance": safe(r.upside_to_resistance),
        "support_distance": safe(r.support_distance),
        "price_condition_pass": safe(r.price_condition_pass),
        "liquidity_condition_pass": safe(r.liquidity_condition_pass),
        "trend_state": safe(r.trend_state),
        "range_state": safe(r.range_state),
        "candle_state": safe(r.candle_state),
        "chart_pattern_primary": safe(r.chart_pattern_primary),
        "chart_pattern_secondary": safe(r.chart_pattern_secondary),
        "chart_pattern_warning": safe(r.chart_pattern_warning),
        "volume_cycle_state": safe(r.volume_cycle_state),
        "chart_cycle_state": safe(r.chart_cycle_state),
        "main_archetype": safe(r.main_archetype),
        "sub_archetypes": safe(r.sub_archetypes),
        "chart_types": safe(r.chart_types),
        "warning_types": safe(r.warning_types),
        "warning_flags": safe(r.warning_flags),
        "material_status": safe(r.material_status),
        "theme_tags": safe(r.theme_tags),
        "upside_score": safe(r.upside_score),
        "future_catalyst_score": safe(r.future_catalyst_score),
        "chart_score": safe(r.chart_score),
        "volume_cycle_score": safe(r.volume_cycle_score),
        "material_theme_score": safe(r.material_theme_score),
        "supply_score": safe(r.supply_score),
        "archetype_score": safe(r.archetype_score),
        "risk_management_score": safe(r.risk_management_score),
        "total_score": safe(r.total_score),
        "classification": safe(r.classification),
        "exclude_flag": safe(r.exclude_flag),
        "exclude_reason": safe(r.exclude_reason),
        "ai_comment": safe(r.ai_comment),
    }
