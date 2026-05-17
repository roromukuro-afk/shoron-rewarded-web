"""短期急騰3000円以下AIスクリーナー - Backend API (FastAPI)
本番公開対応: PostgreSQL / SQLite両対応・CORS環境変数対応"""
import os
import io
import json
import re
import logging
import asyncio
from datetime import date, datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from database import get_db, init_db, get_db_info, DATABASE_URL
from models import (
    Stock, ScreeningResult, ExclusionList, AARRecord,
    AppSetting, ScreeningJob,
)
from data_fetcher import load_jp_universe, load_us_universe, get_stock_data
from screening_engine import screen_single_stock
from export_utils import export_csv, export_excel, generate_aar_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ====== 環境変数 ======
ENVIRONMENT = os.environ.get("ENVIRONMENT", "local")  # local / production
ALLOWED_ORIGINS_RAW = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_RAW.split(",") if o.strip()]
# ワイルドカードが指定された場合の許容
ALLOW_ORIGIN_REGEX = os.environ.get("ALLOW_ORIGIN_REGEX")

YFINANCE_ENABLED = os.environ.get("YFINANCE_ENABLED", "true").lower() == "true"
DEFAULT_SAMPLE_MODE = os.environ.get("SAMPLE_MODE", "false").lower() == "true"
DEFAULT_USDJPY = float(os.environ.get("DEFAULT_USDJPY", "155"))

app = FastAPI(
    title="短期急騰3000円以下AIスクリーナー API",
    version="1.1.0",
    description="本番公開対応の全銘柄スクリーニングAPI",
)

cors_kwargs = dict(
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if ALLOW_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = ALLOW_ORIGIN_REGEX
app.add_middleware(CORSMiddleware, **cors_kwargs)

# スクリーニング進捗 (インメモリ + DBにも反映)
screening_progress = {
    "running": False,
    "total": 0,
    "done": 0,
    "status": "idle",
    "start_time": None,
    "results": [],
    "errors": [],
    "job_id": None,
}

# 最終エラーログ (deploy-status用)
_last_error = {"message": None, "at": None}


@app.on_event("startup")
def startup():
    init_db()
    logger.info(f"Database initialized: {DATABASE_URL[:40]}...")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
    logger.info(f"Environment: {ENVIRONMENT}")


@app.get("/api/health")
def health():
    db_info = get_db_info()
    return {
        "status": "ok" if db_info["connected"] else "degraded",
        "environment": ENVIRONMENT,
        "database": "connected" if db_info["connected"] else "disconnected",
        "database_backend": db_info["backend"],
        "sample_mode": DEFAULT_SAMPLE_MODE,
        "yfinance_enabled": YFINANCE_ENABLED,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/status")
def status(db: Session = Depends(get_db)):
    """deploy-status用の詳細ステータス"""
    db_info = get_db_info()

    # 最終スクリーニング
    last_job = db.query(ScreeningJob).order_by(desc(ScreeningJob.id)).first()
    last_job_info = None
    if last_job:
        last_job_info = {
            "id": last_job.id,
            "status": last_job.status,
            "market_scope": last_job.market_scope,
            "mode": last_job.mode,
            "total_count": last_job.total_count,
            "processed_count": last_job.processed_count,
            "started_at": last_job.started_at.isoformat() if last_job.started_at else None,
            "finished_at": last_job.finished_at.isoformat() if last_job.finished_at else None,
            "error_message": last_job.error_message,
        }

    return {
        "environment": ENVIRONMENT,
        "database": db_info,
        "allowed_origins": ALLOWED_ORIGINS,
        "yfinance_enabled": YFINANCE_ENABLED,
        "default_sample_mode": DEFAULT_SAMPLE_MODE,
        "default_usdjpy": DEFAULT_USDJPY,
        "last_job": last_job_info,
        "last_error": _last_error,
        "screening_running": screening_progress["running"],
        "version": "1.1.0",
    }


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

    vol_cycle_counts: dict = {}
    chart_cycle_counts: dict = {}
    warning_counts: dict = {}

    for r in results:
        k = r.volume_cycle_state or "判定不能"
        vol_cycle_counts[k] = vol_cycle_counts.get(k, 0) + 1
        k = r.chart_cycle_state or "判定不能"
        chart_cycle_counts[k] = chart_cycle_counts.get(k, 0) + 1
        flags = (r.warning_flags or "").split(",")
        for f in flags:
            if f.strip():
                warning_counts[f.strip()] = warning_counts.get(f.strip(), 0) + 1

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
        "environment": ENVIRONMENT,
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
    return {"total": len(stocks), "stocks": stocks[:200]}


class ScreeningConfig(BaseModel):
    market: str = "JP"
    include_adr: bool = False
    price_limit_jpy: float = 3000.0
    min_volume_jp: float = 30000
    min_volume_us: float = 100000
    min_score: float = 65
    apply_exclusion_list: bool = True
    mode: str = "sample"  # sample / real
    max_stocks: Optional[int] = None


@app.post("/api/screening/run")
async def run_screening(config: ScreeningConfig, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if screening_progress["running"]:
        return JSONResponse(
            status_code=409,
            content={"message": "スクリーニング実行中です", "status": "running"}
        )

    # 実モード時、yfinance無効ならエラー
    if config.mode == "real" and not YFINANCE_ENABLED:
        raise HTTPException(status_code=400, detail="実データモードは無効化されています (YFINANCE_ENABLED=false)")

    # Job作成
    job = ScreeningJob(
        status="queued",
        market_scope=config.market,
        mode=config.mode,
        total_count=0,
        processed_count=0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(_run_screening_task, config, job.id)
    return {"message": "スクリーニングを開始しました", "status": "started", "job_id": job.id}


async def _run_screening_task(config: ScreeningConfig, job_id: int):
    from database import SessionLocal
    global screening_progress, _last_error

    screening_progress["running"] = True
    screening_progress["status"] = "銘柄ユニバース取得中..."
    screening_progress["done"] = 0
    screening_progress["errors"] = []
    screening_progress["results"] = []
    screening_progress["start_time"] = datetime.now().isoformat()
    screening_progress["job_id"] = job_id

    db = SessionLocal()
    try:
        job = db.query(ScreeningJob).filter(ScreeningJob.id == job_id).first()
        if job:
            job.status = "running"
            db.commit()

        # ユニバース
        stocks = []
        if config.market in ["JP", "ALL"]:
            stocks.extend(load_jp_universe())
        if config.market in ["US", "ALL"]:
            stocks.extend(load_us_universe(include_adr=config.include_adr))

        if config.max_stocks:
            stocks = stocks[:config.max_stocks]

        screening_progress["total"] = len(stocks)
        if job:
            job.total_count = len(stocks)
            db.commit()

        screening_progress["status"] = f"{len(stocks)}銘柄のスクリーニング開始..."

        exclusion_symbols = set()
        if config.apply_exclusion_list:
            try:
                excl = db.query(ExclusionList.symbol).all()
                exclusion_symbols = {e[0] for e in excl}
            except Exception:
                pass

        today = date.today()
        adopted = conditional = watch = excluded = 0

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

                cls = result.get("classification", "")
                if cls == "採用候補":
                    adopted += 1
                elif cls == "条件付き候補":
                    conditional += 1
                elif cls == "監視候補":
                    watch += 1
                if result.get("exclude_flag"):
                    excluded += 1

                _save_screening_result(db, result)

            except Exception as e:
                logger.error(f"Error processing {stock['symbol']}: {e}")
                screening_progress["errors"].append(f"{stock['symbol']}: {str(e)[:100]}")

            # 進捗をジョブに反映 (10銘柄ごと)
            if i % 10 == 0 and job:
                job.processed_count = i + 1
                job.adopted_count = adopted
                job.conditional_count = conditional
                job.watch_count = watch
                job.excluded_count = excluded
                db.commit()

            # APIレート制限対策
            if config.mode == "real" and i % 5 == 0:
                await asyncio.sleep(0.3)

        if job:
            job.status = "completed"
            job.processed_count = len(stocks)
            job.adopted_count = adopted
            job.conditional_count = conditional
            job.watch_count = watch
            job.excluded_count = excluded
            job.finished_at = datetime.now()
            db.commit()

        screening_progress["status"] = f"完了: 採用{adopted}/条件付き{conditional}/監視{watch}/除外{excluded}"

    except Exception as e:
        logger.error(f"Screening task error: {e}", exc_info=True)
        screening_progress["status"] = f"エラー: {str(e)[:200]}"
        _last_error = {"message": str(e)[:500], "at": datetime.now().isoformat()}
        if job_id:
            job = db.query(ScreeningJob).filter(ScreeningJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = str(e)[:500]
                job.finished_at = datetime.now()
                db.commit()
    finally:
        screening_progress["running"] = False
        db.close()


def _save_screening_result(db: Session, result: dict):
    today = date.today()
    try:
        existing = db.query(ScreeningResult).filter(
            ScreeningResult.symbol == result["symbol"],
            ScreeningResult.date == today,
        ).first()

        data = {k: v for k, v in result.items()
                if k not in ["date", "price_fetched_at", "fx_fetched_at", "exchange", "sector", "is_adr"]}
        data["date"] = today

        import math
        for field in [
            "price", "jpy_price", "fx_rate", "market_cap", "volume", "volume_avg20",
            "volume_ratio", "turnover", "price_change_1d", "price_change_5d",
            "price_change_20d", "ma5", "ma25", "ma75", "ma200", "ma25_deviation",
            "recent_high_20", "recent_low_20", "support_line", "resistance_line",
            "upside_to_resistance", "support_distance", "total_score",
            "upside_score", "future_catalyst_score", "chart_score",
            "volume_cycle_score", "material_theme_score", "supply_score",
            "archetype_score", "risk_management_score",
        ]:
            if field in data and data[field] is not None:
                try:
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
        "job_id": screening_progress["job_id"],
        "errors": screening_progress["errors"][:50],
    }


@app.get("/api/screening/jobs")
def get_screening_jobs(db: Session = Depends(get_db), limit: int = 20):
    jobs = db.query(ScreeningJob).order_by(desc(ScreeningJob.id)).limit(limit).all()
    return {
        "jobs": [
            {
                "id": j.id,
                "status": j.status,
                "market_scope": j.market_scope,
                "mode": j.mode,
                "total_count": j.total_count,
                "processed_count": j.processed_count,
                "adopted_count": j.adopted_count,
                "conditional_count": j.conditional_count,
                "watch_count": j.watch_count,
                "excluded_count": j.excluded_count,
                "error_message": j.error_message,
                "started_at": j.started_at.isoformat() if j.started_at else None,
                "finished_at": j.finished_at.isoformat() if j.finished_at else None,
            }
            for j in jobs
        ]
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
    results = (
        query.order_by(desc(ScreeningResult.total_score))
        .offset((page - 1) * per_page).limit(per_page).all()
    )

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
    df = None
    try:
        if YFINANCE_ENABLED:
            df = get_stock_data(symbol, period=period)
    except Exception as e:
        logger.warning(f"Chart fetch failed for {symbol}: {e}")

    if df is None or df.empty:
        from screening_engine import _generate_sample_data
        market = "JP" if symbol.endswith(".T") else "US"
        df = _generate_sample_data(symbol, market=market)

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
    try:
        if ext == "csv":
            import pandas as pd
            df = pd.read_csv(io.BytesIO(content), dtype=str, encoding="utf-8")
            for col in ["symbol", "Symbol", "コード", "銘柄コード", "code", "Code"]:
                if col in df.columns:
                    symbols.extend([str(v).strip() for v in df[col].dropna() if str(v).strip()])
        elif ext in ["xlsx", "xls"]:
            import pandas as pd
            df = pd.read_excel(io.BytesIO(content), dtype=str)
            for col in ["symbol", "Symbol", "コード", "銘柄コード"]:
                if col in df.columns:
                    symbols.extend([str(v).strip() for v in df[col].dropna() if str(v).strip()])
        else:
            text = content.decode("utf-8", errors="ignore")
            lines = re.split(r"[\n\r,\t ]", text)
            for line in lines:
                line = line.strip()
                if re.match(r"^\d{4,5}(\.[TS])?$", line):
                    symbols.append(line)
                elif re.match(r"^[A-Z]{1,5}$", line):
                    symbols.append(line)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ファイル解析エラー: {str(e)}")

    symbols = list(dict.fromkeys(symbols))[:500]

    return {
        "filename": filename,
        "extracted_symbols": symbols,
        "extracted_count": len(symbols),
        "preview": symbols[:50],
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
        symbol=item.symbol, name=item.name, market=item.market,
        reason=item.reason, source_file=item.source_file,
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
                symbol=item.symbol, name=item.name, market=item.market,
                reason=item.reason, source_file=item.source_file,
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
                "id": e.id, "symbol": e.symbol, "name": e.name,
                "market": e.market, "reason": e.reason,
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
    csv_bytes = export_csv(data)

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
        df = None
        try:
            if YFINANCE_ENABLED:
                df = get_stock_data(symbol, period="3mo")
        except Exception:
            pass
        if df is None or df.empty:
            from screening_engine import _generate_sample_data
            market = "JP" if symbol.endswith(".T") else "US"
            df = _generate_sample_data(symbol, market=market)

        close = df["close"].astype(float)
        n = len(close)
        if n < 2:
            continue

        entry_price = float(close.iloc[-1])
        future_prices = {}
        for days, label in [(1, "1d"), (3, "3d"), (5, "5d"), (10, "10d"), (20, "20d")]:
            idx = -(days + 1) if n > days + 1 else 0
            future_prices[label] = round(
                (float(close.iloc[-1]) - float(close.iloc[idx])) / (float(close.iloc[idx]) + 1e-10) * 100, 2
            )

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
                "id": r.id, "symbol": r.symbol, "name": r.name,
                "date": r.date.isoformat() if r.date else "",
                "classification": r.classification,
                "score": r.score_before_move,
                "result_1d": r.result_after_1d, "result_3d": r.result_after_3d,
                "result_5d": r.result_after_5d, "result_10d": r.result_after_10d,
                "result_20d": r.result_after_20d,
                "max_gain": r.max_gain, "hit_20_percent": r.hit_20_percent,
            }
            for r in records
        ],
    }


# ====== Settings ======
DEFAULT_SETTINGS = {
    "price_limit_jpy": 3000.0,
    "min_volume_jp": 30000.0,
    "min_volume_us": 100000.0,
    "min_turnover_jp_yen": 30000000.0,
    "min_turnover_us_usd": 300000.0,
    "min_score": 65.0,
    "include_adr": False,
    "default_market": "JP",
    "default_mode": "sample" if DEFAULT_SAMPLE_MODE else "real",
    "apply_exclusion_list": True,
    "default_usdjpy": DEFAULT_USDJPY,
}


@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = {}
    rows = db.query(AppSetting).all()
    for row in rows:
        try:
            settings[row.key] = json.loads(row.value)
        except Exception:
            settings[row.key] = row.value
    # Merge with defaults
    for k, v in DEFAULT_SETTINGS.items():
        if k not in settings:
            settings[k] = v
    return {
        "settings": settings,
        "environment": ENVIRONMENT,
        "yfinance_enabled": YFINANCE_ENABLED,
    }


class SettingsUpdate(BaseModel):
    settings: dict


@app.post("/api/settings")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    for key, value in payload.settings.items():
        existing = db.query(AppSetting).filter(AppSetting.key == key).first()
        val_str = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
        if existing:
            existing.value = val_str
        else:
            db.add(AppSetting(key=key, value=val_str))
    db.commit()
    return {"message": "設定を保存しました", "settings": payload.settings}


def _result_to_dict(r: ScreeningResult) -> dict:
    import math

    def safe(v):
        if v is None:
            return None
        try:
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return None
        except Exception:
            pass
        return v

    return {
        "symbol": safe(r.symbol), "name": safe(r.name), "market": safe(r.market),
        "date": r.date.isoformat() if r.date else "",
        "price": safe(r.price), "jpy_price": safe(r.jpy_price),
        "fx_rate": safe(r.fx_rate), "currency": safe(r.currency),
        "market_cap": safe(r.market_cap),
        "volume": safe(r.volume), "volume_avg20": safe(r.volume_avg20),
        "volume_ratio": safe(r.volume_ratio), "turnover": safe(r.turnover),
        "price_change_1d": safe(r.price_change_1d), "price_change_5d": safe(r.price_change_5d),
        "price_change_20d": safe(r.price_change_20d),
        "ma5": safe(r.ma5), "ma25": safe(r.ma25), "ma75": safe(r.ma75), "ma200": safe(r.ma200),
        "ma25_deviation": safe(r.ma25_deviation),
        "recent_high_20": safe(r.recent_high_20), "recent_low_20": safe(r.recent_low_20),
        "support_line": safe(r.support_line), "resistance_line": safe(r.resistance_line),
        "upside_to_resistance": safe(r.upside_to_resistance),
        "support_distance": safe(r.support_distance),
        "price_condition_pass": safe(r.price_condition_pass),
        "liquidity_condition_pass": safe(r.liquidity_condition_pass),
        "trend_state": safe(r.trend_state), "range_state": safe(r.range_state),
        "candle_state": safe(r.candle_state),
        "chart_pattern_primary": safe(r.chart_pattern_primary),
        "chart_pattern_secondary": safe(r.chart_pattern_secondary),
        "chart_pattern_warning": safe(r.chart_pattern_warning),
        "volume_cycle_state": safe(r.volume_cycle_state),
        "chart_cycle_state": safe(r.chart_cycle_state),
        "main_archetype": safe(r.main_archetype),
        "sub_archetypes": safe(r.sub_archetypes),
        "chart_types": safe(r.chart_types), "warning_types": safe(r.warning_types),
        "warning_flags": safe(r.warning_flags),
        "material_status": safe(r.material_status), "theme_tags": safe(r.theme_tags),
        "upside_score": safe(r.upside_score),
        "future_catalyst_score": safe(r.future_catalyst_score),
        "chart_score": safe(r.chart_score),
        "volume_cycle_score": safe(r.volume_cycle_score),
        "material_theme_score": safe(r.material_theme_score),
        "supply_score": safe(r.supply_score), "archetype_score": safe(r.archetype_score),
        "risk_management_score": safe(r.risk_management_score),
        "total_score": safe(r.total_score), "classification": safe(r.classification),
        "exclude_flag": safe(r.exclude_flag), "exclude_reason": safe(r.exclude_reason),
        "ai_comment": safe(r.ai_comment),
    }
