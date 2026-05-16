import numpy as np
import pandas as pd
from typing import Optional


def compute_ma(series: pd.Series, period: int) -> pd.Series:
    return series.rolling(window=period, min_periods=1).mean()


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    rs = avg_gain / (avg_loss + 1e-10)
    return 100 - (100 / (1 + rs))


def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()


def classify_candle(row: pd.Series) -> str:
    o, h, l, c = row["open"], row["high"], row["low"], row["close"]
    body = abs(c - o)
    upper_wick = h - max(o, c)
    lower_wick = min(o, c) - l
    total_range = h - l + 1e-10

    if total_range < 0.001:
        return "判定不能"

    body_ratio = body / total_range
    upper_ratio = upper_wick / total_range
    lower_ratio = lower_wick / total_range

    if body_ratio < 0.1:
        if upper_ratio > 0.4 and lower_ratio > 0.4:
            return "十字線"
        elif upper_ratio > 0.6:
            return "トンカチ"
        elif lower_ratio > 0.6:
            return "逆トンカチ"
        return "コマ"

    is_bullish = c > o

    if body_ratio > 0.6:
        if is_bullish:
            return "大陽線"
        return "大陰線"

    if lower_ratio > 0.5 and is_bullish:
        return "下ヒゲ反転"
    if upper_ratio > 0.5 and not is_bullish:
        return "上ヒゲ失速"
    if upper_ratio > 0.4 and body_ratio > 0.3:
        return "大商い上ヒゲ" if not is_bullish else "上ヒゲ"

    return "陽線" if is_bullish else "陰線"


def detect_volume_cycle(df: pd.DataFrame) -> str:
    if len(df) < 5:
        return "判定不能"

    vol = df["volume"]
    close = df["close"]
    avg20 = vol.rolling(20, min_periods=5).mean()

    latest_vol = vol.iloc[-1]
    latest_avg = avg20.iloc[-1]
    prev_avg = avg20.iloc[-5:-1].mean()

    if latest_avg == 0:
        return "出来高不足"

    vol_ratio = latest_vol / (latest_avg + 1e-10)
    price_change_5d = (close.iloc[-1] - close.iloc[-6]) / (close.iloc[-6] + 1e-10) if len(close) >= 6 else 0
    price_change_20d = (close.iloc[-1] - close.iloc[-21]) / (close.iloc[-21] + 1e-10) if len(close) >= 21 else 0

    recent_vol_trend = vol.iloc[-5:].mean() / (vol.iloc[-10:-5].mean() + 1e-10) if len(vol) >= 10 else 1.0

    # 天井大商い警戒: 高値圏 + 大量出来高 + 上ヒゲor陰線
    last_candle = classify_candle(df.iloc[-1])
    is_high_price_zone = close.iloc[-1] >= close.rolling(20, min_periods=5).max().iloc[-1] * 0.95

    if vol_ratio > 2.5 and is_high_price_zone and ("上ヒゲ" in last_candle or "陰線" in last_candle or "大陰線" in last_candle):
        return "天井大商い警戒"

    # 先行大商い: 出来高急増、価格が崩れていない
    if vol_ratio > 2.5 and price_change_5d > -0.05:
        return "先行大商い"

    # 売り枯れ: 出来高激減
    if vol_ratio < 0.5 and price_change_5d > -0.1:
        return "売り枯れ"

    # 再点火開始: 売り枯れ後に出来高増加
    avg_prev = vol.iloc[-10:-1].mean() if len(vol) >= 10 else latest_avg
    if recent_vol_trend > 1.3 and vol_ratio < 1.5 and price_change_5d > 0:
        return "再点火開始"

    # 再点火待ち: 出来高が回復し始め
    if recent_vol_trend > 1.1 and vol_ratio < 1.2:
        return "再点火待ち"

    # 価格維持: 出来高減少中でも価格が下がらない
    if vol_ratio < 0.8 and price_change_5d > -0.03:
        return "価格維持"

    # 出来高不足
    if latest_vol < 10000:
        return "出来高不足"

    # 人気離散
    if vol_ratio < 0.3 and price_change_20d < -0.2:
        return "人気離散"

    return "判定不能"


def detect_chart_cycle(df: pd.DataFrame, support: float, resistance: float, ma25: float) -> str:
    if len(df) < 10:
        return "判定不能"

    close = df["close"]
    current = close.iloc[-1]
    recent_lows = close.rolling(5, min_periods=3).min()

    # 支持線割れ
    if support > 0 and current < support * 0.97:
        return "支持線割れ"

    # ブレイク済み
    if resistance > 0 and current > resistance * 1.02:
        return "ブレイク済み"

    # 上がり切り
    if ma25 > 0:
        deviation = (current - ma25) / (ma25 + 1e-10)
        if deviation > 0.5:
            return "上がり切り"

    # 値幅収縮判定
    recent_range = df["high"].iloc[-5:].max() - df["low"].iloc[-5:].min()
    prev_range = df["high"].iloc[-20:-5].max() - df["low"].iloc[-20:-5].min() if len(df) >= 20 else recent_range
    range_ratio = recent_range / (prev_range + 1e-10)

    if range_ratio < 0.5 and resistance > 0 and (resistance - current) / (current + 1e-10) < 0.1:
        return "ブレイク直前"

    if range_ratio < 0.6:
        return "値幅収縮"

    # 安値切り上げ
    if len(recent_lows) >= 5:
        lows_5d = close.iloc[-5:].min()
        lows_prev = close.iloc[-10:-5].min() if len(close) >= 10 else lows_5d
        if lows_5d > lows_prev * 0.99:
            if support > 0 and current > support * 0.98:
                return "安値切り上げ"

    # 底固め
    std_recent = close.iloc[-10:].std() if len(close) >= 10 else 0
    std_prev = close.iloc[-20:-10].std() if len(close) >= 20 else std_recent + 1
    if std_recent < std_prev * 0.7 and support > 0 and current > support * 0.97:
        return "底固め"

    # 初動後押し目
    high_20 = close.rolling(20, min_periods=5).max().iloc[-1]
    if current < high_20 * 0.9 and current > ma25 * 0.95 if ma25 > 0 else True:
        return "初動後押し目"

    # 再点火待ち
    if resistance > 0 and (resistance - current) / (current + 1e-10) < 0.15:
        return "再点火待ち"

    # 支持線維持
    if support > 0 and current > support * 0.98:
        return "支持線維持"

    return "判定不能"


def detect_trend(df: pd.DataFrame, ma5: float, ma25: float, ma75: float) -> tuple[str, str]:
    if len(df) < 10:
        return "判定不能", "判定不能"

    close = df["close"]
    current = close.iloc[-1]

    highs = df["high"]
    lows = df["low"]

    recent_highs_up = highs.iloc[-5:].max() > highs.iloc[-10:-5].max() if len(highs) >= 10 else False
    recent_lows_up = lows.iloc[-5:].min() > lows.iloc[-10:-5].min() if len(lows) >= 10 else False
    recent_highs_down = highs.iloc[-5:].max() < highs.iloc[-10:-5].max() if len(highs) >= 10 else False
    recent_lows_down = lows.iloc[-5:].min() < lows.iloc[-10:-5].min() if len(lows) >= 10 else False

    # トレンド判定
    above_ma25 = current > ma25 if ma25 > 0 else False
    above_ma75 = current > ma75 if ma75 > 0 else False
    ma25_above_ma75 = ma25 > ma75 if (ma25 > 0 and ma75 > 0) else False

    if above_ma25 and above_ma75 and ma25_above_ma75 and recent_highs_up and recent_lows_up:
        trend = "上昇トレンド継続"
    elif above_ma25 and recent_highs_up:
        trend = "上昇トレンド"
    elif not above_ma25 and not above_ma75 and recent_lows_down:
        trend = "下降トレンド継続"
    elif not above_ma25 and recent_lows_down:
        trend = "下降トレンド"
    elif recent_highs_up and not recent_lows_up:
        trend = "トレンド転換初動"
    elif not recent_highs_up and recent_lows_up:
        trend = "トレンド崩れ"
    else:
        trend = "横ばいレンジ"

    # レンジ判定
    high_20 = df["high"].rolling(20, min_periods=5).max().iloc[-1]
    low_20 = df["low"].rolling(20, min_periods=5).min().iloc[-1]
    range_size = high_20 - low_20

    if range_size > 0:
        pos_in_range = (current - low_20) / range_size
        if pos_in_range > 0.85:
            range_state = "レンジ上限接近"
        elif pos_in_range < 0.15:
            range_state = "レンジ下限反発"
        elif 0.4 <= pos_in_range <= 0.6:
            range_state = "レンジ中間"
        else:
            range_state = "ボックス"

        if current > high_20 * 1.01:
            range_state = "ボックス上放れ前"
        elif current < low_20 * 0.99:
            range_state = "ボックス下放れ警戒"
    else:
        range_state = "判定不能"

    return trend, range_state


def detect_chart_pattern(df: pd.DataFrame) -> tuple[str, str, str, float]:
    if len(df) < 20:
        return "判定不能", "", "", 0.3

    close = df["close"]
    high = df["high"]
    low = df["low"]
    vol = df["volume"]

    current = close.iloc[-1]

    # 簡易パターン検出
    primary = "判定不能"
    secondary = ""
    warning = ""
    confidence = 0.4

    # 直近の高値・安値のパターン
    highs_20 = high.iloc[-20:]
    lows_20 = low.iloc[-20:]
    close_20 = close.iloc[-20:]

    max_high = highs_20.max()
    min_low = lows_20.min()
    mid_price = (max_high + min_low) / 2

    # ダブルボトム検出
    local_lows = []
    for i in range(2, len(lows_20) - 2):
        if lows_20.iloc[i] <= lows_20.iloc[i-1] and lows_20.iloc[i] <= lows_20.iloc[i+1]:
            local_lows.append((i, lows_20.iloc[i]))

    if len(local_lows) >= 2:
        last_two_lows = local_lows[-2:]
        low_diff = abs(last_two_lows[0][1] - last_two_lows[1][1]) / (last_two_lows[0][1] + 1e-10)
        if low_diff < 0.05 and current > mid_price:
            primary = "ダブルボトム"
            confidence = 0.65

    # ダブルトップ検出
    local_highs = []
    for i in range(2, len(highs_20) - 2):
        if highs_20.iloc[i] >= highs_20.iloc[i-1] and highs_20.iloc[i] >= highs_20.iloc[i+1]:
            local_highs.append((i, highs_20.iloc[i]))

    if len(local_highs) >= 2:
        last_two_highs = local_highs[-2:]
        high_diff = abs(last_two_highs[0][1] - last_two_highs[1][1]) / (last_two_highs[0][1] + 1e-10)
        if high_diff < 0.05 and current < mid_price:
            warning = "ダブルトップ"

    # ボックス / 三角保ち合い
    if len(df) >= 20:
        recent_highs = high.iloc[-10:]
        recent_lows = low.iloc[-10:]
        high_std = recent_highs.std() / (recent_highs.mean() + 1e-10)
        low_std = recent_lows.std() / (recent_lows.mean() + 1e-10)

        if high_std < 0.03 and low_std < 0.03:
            if primary == "判定不能":
                primary = "ボックス"
                confidence = 0.55
        elif high_std < 0.05 and low_std > 0.03:
            secondary = "三角保ち合い収束型"

    # カップウィズハンドル
    if len(df) >= 40:
        cup_section = close.iloc[-40:-10]
        handle_section = close.iloc[-10:]
        cup_min = cup_section.min()
        cup_start = cup_section.iloc[0]
        cup_end = cup_section.iloc[-1]
        handle_min = handle_section.min()

        if (cup_start > cup_min * 1.05 and cup_end > cup_min * 1.05 and
                handle_min > cup_min * 0.95 and current > cup_start * 0.95):
            if primary == "判定不能":
                primary = "カップウィズハンドル"
                confidence = 0.6

    # フラッグパターン
    if len(df) >= 15:
        prior_trend = (close.iloc[-15] - close.iloc[-25]) / (close.iloc[-25] + 1e-10) if len(close) >= 25 else 0
        recent_range = high.iloc[-5:].max() - low.iloc[-5:].min()
        prior_range = high.iloc[-15:-5].max() - low.iloc[-15:-5].min()

        if prior_trend > 0.1 and recent_range < prior_range * 0.5:
            if primary == "判定不能":
                primary = "フラッグ"
                confidence = 0.55

    # 初動後押し目
    high_20 = high.iloc[-20:].max()
    high_10 = high.iloc[-20:-10].max()
    if high_10 > high.iloc[-10:].max() and current > close.iloc[-20] * 1.05:
        if primary == "判定不能":
            primary = "初動後押し目型"
            confidence = 0.5

    if primary == "判定不能":
        primary = "判定中"

    return primary, secondary, warning, confidence


def compute_support_resistance(df: pd.DataFrame) -> tuple[float, float]:
    if len(df) < 5:
        return 0.0, 0.0

    close = df["close"]
    high = df["high"]
    low = df["low"]

    current = close.iloc[-1]

    # 支持線: 直近安値
    support_candidates = []
    if len(low) >= 20:
        support_candidates.append(low.iloc[-20:].min())
    if len(low) >= 60:
        support_candidates.append(low.iloc[-60:].min())
    # 5日安値
    if len(low) >= 5:
        support_candidates.append(low.iloc[-5:].min())

    # 直近の局所安値(反発点)
    for i in range(2, min(len(low) - 2, 30)):
        if low.iloc[-i] <= low.iloc[-i-1] and low.iloc[-i] <= low.iloc[-i+1]:
            if low.iloc[-i] < current:
                support_candidates.append(float(low.iloc[-i]))

    # 抵抗線候補
    resistance_candidates = []
    # 20日・60日高値
    if len(high) >= 20:
        resistance_candidates.append(high.iloc[-20:].max())
    if len(high) >= 60:
        resistance_candidates.append(high.iloc[-60:].max())

    # 局所高値
    for i in range(2, min(len(high) - 2, 30)):
        if high.iloc[-i] >= high.iloc[-i-1] and high.iloc[-i] >= high.iloc[-i+1]:
            if high.iloc[-i] > current:
                resistance_candidates.append(float(high.iloc[-i]))

    # 抵抗線が近すぎる場合は+20%以上の水準を使う
    # 支持線: 現在値より下で最も近い水準
    supports_below = [s for s in support_candidates if s < current * 0.98]
    support = max(supports_below) if supports_below else (current * 0.88)

    # 抵抗線: 現在値+5%以上の水準
    resistances_above = [r for r in resistance_candidates if r > current * 1.05]
    if resistances_above:
        resistance = min(resistances_above)
    else:
        # 抵抗線が見つからない場合は合理的な目標値を設定
        high_60 = high.iloc[-60:].max() if len(high) >= 60 else high.max()
        if high_60 > current * 1.05:
            resistance = high_60
        else:
            # 直近ボラティリティから推定
            atr_20 = (high.iloc[-20:] - low.iloc[-20:]).mean() if len(high) >= 20 else (high.iloc[-1] - low.iloc[-1])
            resistance = current + atr_20 * 5  # 5ATR上

    return support, resistance


def compute_archetype(df: pd.DataFrame, volume_cycle: str, chart_cycle: str,
                       trend: str, ma25_dev: float) -> tuple[str, list, list, list]:
    main = "売り枯れ / Selling Exhaustion型"
    sub = []
    chart_types = []
    warning_types = []

    # 主型判定
    if volume_cycle in ["売り枯れ", "価格維持", "再点火待ち"]:
        main = "売り枯れ / Selling Exhaustion型"
    elif volume_cycle in ["再点火開始", "先行大商い"]:
        main = "先行資金流入 / Pre-Night型"
    elif trend in ["上昇トレンド", "上昇トレンド継続"]:
        main = "事業ピボット・テーマ転換型"
    elif chart_cycle == "ブレイク直前":
        main = "低浮動株 / Low Float Multiplier型"

    # チャート型
    if chart_cycle == "安値切り上げ":
        chart_types.append("支持線反発型")
    if chart_cycle in ["値幅収縮", "ブレイク直前"]:
        chart_types.append("三角保ち合い収束型")
    if chart_cycle == "初動後押し目":
        chart_types.append("初動後押し目型")
    if chart_cycle == "再点火待ち":
        chart_types.append("再点火待ち型")
    if chart_cycle == "底固め":
        chart_types.append("ダブルボトム型")
    if chart_cycle == "ブレイク済み":
        chart_types.append("ボックス上放れ型")

    # 警告型
    if chart_cycle == "上がり切り":
        warning_types.append("上がり切り警戒")
    if volume_cycle == "天井大商い警戒":
        warning_types.append("天井大商い警戒")
    if ma25_dev > 0.5:
        warning_types.append("高値掴み警戒")
    if chart_cycle == "支持線割れ":
        warning_types.append("支持線割れ警戒")

    return main, sub, chart_types[:2], warning_types[:2]
