import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Optional
import logging

from indicators import (
    compute_ma, compute_rsi, compute_atr, classify_candle,
    detect_volume_cycle, detect_chart_cycle, detect_trend,
    detect_chart_pattern, compute_support_resistance, compute_archetype
)
from scoring import (
    compute_score, classify_result, compute_warning_flags,
    check_hard_exclusion, generate_ai_comment
)
from data_fetcher import get_stock_data, get_stock_info, get_fx_rate

logger = logging.getLogger(__name__)


def screen_single_stock(
    stock: dict,
    price_limit_jpy: float = 3000.0,
    min_volume_jp: float = 30000,
    min_volume_us: float = 100000,
    exclusion_symbols: set = None,
    mode: str = "real",
) -> dict:
    """1銘柄のスクリーニングを実行する"""
    symbol = stock["symbol"]
    market = stock["market"]
    is_adr = stock.get("is_adr", False)
    exclusion_symbols = exclusion_symbols or set()

    result = {
        "symbol": symbol,
        "name": stock.get("name", symbol),
        "market": market,
        "date": date.today().isoformat(),
        "price": None,
        "jpy_price": None,
        "fx_rate": 1.0,
        "currency": "JPY" if market == "JP" else "USD",
        "market_cap": 0,
        "volume": 0,
        "volume_avg20": 0,
        "volume_ratio": 0,
        "turnover": 0,
        "price_change_1d": 0,
        "price_change_5d": 0,
        "price_change_20d": 0,
        "ma5": None, "ma25": None, "ma75": None, "ma200": None,
        "ma25_deviation": 0,
        "recent_high_20": None, "recent_low_20": None,
        "support_line": None, "resistance_line": None,
        "upside_to_resistance": 0,
        "support_distance": 0,
        "price_condition_pass": False,
        "liquidity_condition_pass": False,
        "trend_state": "判定不能",
        "range_state": "判定不能",
        "candle_state": "判定不能",
        "chart_pattern_primary": "判定不能",
        "chart_pattern_secondary": "",
        "chart_pattern_warning": "",
        "volume_cycle_state": "判定不能",
        "chart_cycle_state": "判定不能",
        "main_archetype": "",
        "sub_archetypes": "",
        "chart_types": "",
        "warning_types": "",
        "warning_flags": "",
        "material_status": "材料不明",
        "theme_tags": "",
        "upside_score": 0, "future_catalyst_score": 0, "chart_score": 0,
        "volume_cycle_score": 0, "material_theme_score": 0,
        "supply_score": 0, "archetype_score": 0, "risk_management_score": 0,
        "total_score": 0,
        "classification": "除外",
        "exclude_flag": True,
        "exclude_reason": "",
        "ai_comment": "",
        "price_fetched_at": datetime.now().isoformat(),
        "fx_fetched_at": datetime.now().isoformat(),
        "exchange": stock.get("exchange", ""),
        "sector": stock.get("sector", ""),
        "is_adr": is_adr,
    }

    try:
        # データ取得
        if mode == "sample":
            df = _generate_sample_data(symbol, market=market)
        else:
            df = get_stock_data(symbol)

        if df is None or len(df) < 5:
            result["exclude_reason"] = "データ取得失敗"
            result["ai_comment"] = f"データ取得失敗。{symbol}のデータを取得できませんでした。"
            return result

        # 為替レート
        currency = result["currency"]
        if market != "JP":
            if mode == "sample":
                fx_rate = 150.0
                fx_time = datetime.now()
            else:
                fx_rate, fx_time = get_fx_rate("USD")
            result["fx_rate"] = fx_rate
            result["fx_fetched_at"] = fx_time.isoformat()
        else:
            result["fx_rate"] = 1.0

        # 価格情報
        latest = df.iloc[-1]
        current_price = float(latest.get("close", 0))
        result["price"] = current_price
        result["price_fetched_at"] = datetime.now().isoformat()

        if current_price <= 0:
            result["exclude_reason"] = "価格不明"
            return result

        jpy_price = current_price * result["fx_rate"]
        result["jpy_price"] = jpy_price

        # 価格条件チェック
        result["price_condition_pass"] = jpy_price <= price_limit_jpy

        # 出来高
        volume = float(latest.get("volume", 0))
        result["volume"] = volume
        vol_avg20 = float(df["volume"].tail(20).mean()) if len(df) >= 20 else volume
        result["volume_avg20"] = vol_avg20
        result["volume_ratio"] = volume / (vol_avg20 + 1e-10)

        # 売買代金
        turnover = current_price * volume
        result["turnover"] = turnover

        # 流動性条件
        min_vol = min_volume_jp if market == "JP" else min_volume_us
        result["liquidity_condition_pass"] = vol_avg20 >= min_vol

        # 価格変化率
        if len(df) >= 2:
            result["price_change_1d"] = (current_price - float(df.iloc[-2]["close"])) / (float(df.iloc[-2]["close"]) + 1e-10)
        if len(df) >= 6:
            result["price_change_5d"] = (current_price - float(df.iloc[-6]["close"])) / (float(df.iloc[-6]["close"]) + 1e-10)
        if len(df) >= 21:
            result["price_change_20d"] = (current_price - float(df.iloc[-21]["close"])) / (float(df.iloc[-21]["close"]) + 1e-10)

        # 移動平均線
        close_series = df["close"].astype(float)
        ma5 = float(compute_ma(close_series, 5).iloc[-1])
        ma25 = float(compute_ma(close_series, 25).iloc[-1]) if len(df) >= 10 else current_price
        ma75 = float(compute_ma(close_series, 75).iloc[-1]) if len(df) >= 30 else current_price
        ma200 = float(compute_ma(close_series, 200).iloc[-1]) if len(df) >= 50 else current_price

        result["ma5"] = ma5
        result["ma25"] = ma25
        result["ma75"] = ma75
        result["ma200"] = ma200

        # 25MA乖離率
        ma25_dev = (current_price - ma25) / (ma25 + 1e-10)
        result["ma25_deviation"] = ma25_dev

        # 直近高値・安値
        result["recent_high_20"] = float(df["high"].tail(20).max()) if "high" in df.columns else current_price * 1.1
        result["recent_low_20"] = float(df["low"].tail(20).min()) if "low" in df.columns else current_price * 0.9

        # 支持線・抵抗線
        support, resistance = compute_support_resistance(df)
        result["support_line"] = support
        result["resistance_line"] = resistance

        upside = (resistance - current_price) / (current_price + 1e-10)
        support_dist = (current_price - support) / (current_price + 1e-10)
        result["upside_to_resistance"] = upside
        result["support_distance"] = support_dist

        # ローソク足
        result["candle_state"] = classify_candle(df.rename(columns={"close": "close", "open": "open", "high": "high", "low": "low"}).iloc[-1])

        # トレンド・レンジ
        trend, range_state = detect_trend(df, ma5, ma25, ma75)
        result["trend_state"] = trend
        result["range_state"] = range_state

        # チャートパターン
        cp_primary, cp_secondary, cp_warning, cp_conf = detect_chart_pattern(df)
        result["chart_pattern_primary"] = cp_primary
        result["chart_pattern_secondary"] = cp_secondary
        result["chart_pattern_warning"] = cp_warning

        # 出来高サイクル
        vol_cycle = detect_volume_cycle(df)
        result["volume_cycle_state"] = vol_cycle

        # チャートサイクル
        chart_cycle = detect_chart_cycle(df, support, resistance, ma25)
        result["chart_cycle_state"] = chart_cycle

        # アーキタイプ
        main_arch, sub_arch, chart_types, warning_types = compute_archetype(
            df, vol_cycle, chart_cycle, trend, ma25_dev
        )
        result["main_archetype"] = main_arch
        result["sub_archetypes"] = ",".join(sub_arch)
        result["chart_types"] = ",".join(chart_types)
        result["warning_types"] = ",".join(warning_types)

        # 市場時価総額
        info = {}
        try:
            if mode != "sample":
                info = get_stock_info(symbol)
                result["market_cap"] = info.get("market_cap", 0)
        except Exception:
            pass

        # 材料・テーマ(MVPでは簡易判定)
        theme_tags = _detect_theme_tags(stock.get("sector", ""), stock.get("name", ""))
        result["theme_tags"] = ",".join(theme_tags)
        result["material_status"] = "テーマのみ" if theme_tags else "材料不明"

        # ハード除外チェック
        exclusion_symbols_check = symbol.replace(".T", "") in exclusion_symbols or symbol in exclusion_symbols
        exclude_flag, exclude_reason = check_hard_exclusion(
            jpy_price=jpy_price,
            price_condition_pass=result["price_condition_pass"],
            volume=volume,
            volume_avg20=vol_avg20,
            min_volume=min_vol,
            price_change_20d=result["price_change_20d"],
            ma25_deviation=ma25_dev,
            upside_pct=upside,
            chart_cycle=chart_cycle,
            in_exclusion_list=exclusion_symbols_check,
            data_available=True,
        )

        result["exclude_flag"] = exclude_flag
        result["exclude_reason"] = exclude_reason

        # 警告フラグ
        warning_flags = compute_warning_flags(
            ma25_deviation=ma25_dev,
            price_change_20d=result["price_change_20d"],
            candle_state=result["candle_state"],
            volume_cycle=vol_cycle,
            upside_pct=upside,
            volume_ratio=result["volume_ratio"],
            chart_cycle=chart_cycle,
            support_distance=support_dist,
        )
        result["warning_flags"] = ",".join(warning_flags)

        # スコア計算
        scores = compute_score(
            upside_pct=upside,
            volume_cycle=vol_cycle,
            chart_cycle=chart_cycle,
            trend=trend,
            ma25_deviation=ma25_dev,
            price_change_20d=result["price_change_20d"],
            volume_ratio=result["volume_ratio"],
            candle_state=result["candle_state"],
            chart_pattern=cp_primary,
            material_status=result["material_status"],
            support_distance=support_dist,
            warning_flags=warning_flags,
            exclude_flags=[exclude_reason] if exclude_flag else [],
        )

        result.update(scores)

        # 分類
        result["classification"] = classify_result(
            total_score=result["total_score"],
            exclude_flag=exclude_flag,
            exclude_reason=exclude_reason,
        )

        # AIコメント生成
        result["ai_comment"] = generate_ai_comment(
            symbol=symbol,
            name=result["name"],
            classification=result["classification"],
            total_score=result["total_score"],
            volume_cycle=vol_cycle,
            chart_cycle=chart_cycle,
            trend=trend,
            upside_pct=upside,
            ma25_deviation=ma25_dev,
            support_distance=support_dist,
            warning_flags=warning_flags,
            main_archetype=main_arch,
            exclude_reason=exclude_reason,
            material_status=result["material_status"],
        )

    except Exception as e:
        logger.error(f"Error screening {symbol}: {e}", exc_info=True)
        result["exclude_reason"] = f"処理エラー: {str(e)[:100]}"
        result["exclude_flag"] = True
        result["ai_comment"] = f"処理エラーが発生しました: {str(e)[:100]}"

    return result


def _detect_theme_tags(sector: str, name: str) -> list:
    tags = []
    text = f"{sector} {name}".lower()

    theme_map = {
        "AI": ["ai", "人工知能", "機械学習", "deep learning", "chatgpt"],
        "半導体": ["semiconductor", "chip", "半導体", "ウェハ", "wafer"],
        "データセンター": ["data center", "データセンター", "cloud", "クラウド"],
        "電力設備": ["electric", "電力", "power", "エネルギー"],
        "防衛": ["defense", "軍事", "防衛", "weapon", "aerospace"],
        "宇宙": ["space", "宇宙", "satellite", "衛星", "rocket"],
        "バイオ": ["bio", "biotech", "製薬", "pharma", "医薬"],
        "暗号資産": ["crypto", "bitcoin", "blockchain", "暗号"],
        "サイバーセキュリティ": ["security", "cyber", "セキュリティ"],
        "資源": ["resource", "mining", "鉱業", "資源"],
        "石油": ["oil", "energy", "石油", "petrochemical"],
        "原子力": ["nuclear", "原子力", "uranium"],
        "GX": ["green", "環境", "esg", "carbon"],
        "量子": ["quantum", "量子"],
        "ロボット": ["robot", "automation", "ロボット", "自動化"],
        "インバウンド": ["hotel", "tourism", "インバウンド", "観光", "旅行"],
        "EV": ["electric vehicle", "ev", "電気自動車"],
    }

    for tag, keywords in theme_map.items():
        for kw in keywords:
            if kw in text:
                tags.append(tag)
                break

    return tags[:5]


def _generate_sample_data(symbol: str, market: str = "JP") -> pd.DataFrame:
    """サンプルデータ生成 - リアルな価格パターン"""
    import numpy as np
    np.random.seed(hash(symbol) % 10000)

    n = 120

    # 市場に応じた価格帯 (JPY換算で3000円以内になるよう設定)
    if market in ["US", "ADR"]:
        base_price = np.random.uniform(3, 18)  # USD: 3-18ドル → 450-2700円 (×150)
    else:
        base_price = np.random.uniform(300, 2500)  # JPY: 300-2500円

    # リアルなパターン: 先行急騰 → 売り枯れ → 価格維持 → 再点火前
    pattern_type = hash(symbol + "pattern") % 4

    if pattern_type == 0:
        # 先行大商い → 売り枯れ → 価格維持パターン
        # 前半上昇
        phase1 = int(n * 0.4)
        phase2 = int(n * 0.7)
        r1 = np.concatenate([
            np.random.normal(0.005, 0.02, phase1),  # 上昇
            np.random.normal(-0.001, 0.01, phase2 - phase1),  # 横ばい
            np.random.normal(0.002, 0.01, n - phase2),  # 徐々に回復
        ])
        vol_multipliers = np.concatenate([
            np.random.uniform(2, 5, phase1),  # 高出来高
            np.random.uniform(0.2, 0.5, phase2 - phase1),  # 売り枯れ
            np.random.uniform(0.5, 1.5, n - phase2),  # 回復
        ])
    elif pattern_type == 1:
        # 底値圏 → 反発パターン
        phase1 = int(n * 0.5)
        r1 = np.concatenate([
            np.random.normal(-0.003, 0.02, phase1),  # 下降
            np.random.normal(0.004, 0.015, n - phase1),  # 反発
        ])
        vol_multipliers = np.concatenate([
            np.random.uniform(0.5, 1.5, phase1),
            np.random.uniform(1.5, 3, n - phase1),
        ])
    elif pattern_type == 2:
        # ボックス圏 → 上放れ前パターン
        r1 = np.random.normal(0, 0.015, n)
        r1[-10:] = np.random.normal(0.003, 0.01, 10)  # 最近少し上昇
        vol_multipliers = np.concatenate([
            np.random.uniform(0.3, 0.8, n - 10),
            np.random.uniform(0.8, 1.5, 10),
        ])
    else:
        # 初動後押し目パターン
        phase1 = int(n * 0.6)
        phase2 = int(n * 0.8)
        r1 = np.concatenate([
            np.random.normal(0.008, 0.02, phase1),  # 急騰
            np.random.normal(-0.003, 0.015, phase2 - phase1),  # 押し目
            np.random.normal(0.001, 0.01, n - phase2),  # 維持
        ])
        vol_multipliers = np.concatenate([
            np.random.uniform(3, 8, phase1),
            np.random.uniform(0.3, 0.7, phase2 - phase1),
            np.random.uniform(0.4, 0.9, n - phase2),
        ])

    prices = base_price * np.exp(np.cumsum(r1))
    prices = np.maximum(prices, base_price * 0.3)  # 最低値保護

    base_volume = np.random.uniform(50000, 300000)
    volumes = base_volume * vol_multipliers

    dates = pd.date_range(end=date.today(), periods=n, freq="B")
    noise_h = np.random.uniform(1.005, 1.04, n)
    noise_l = np.random.uniform(0.96, 0.995, n)
    noise_o = np.random.uniform(0.99, 1.01, n)

    df = pd.DataFrame({
        "date": dates,
        "open": prices * noise_o,
        "high": prices * noise_h,
        "low": prices * noise_l,
        "close": prices,
        "volume": volumes,
    })
    return df
