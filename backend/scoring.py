from typing import Optional


def compute_score(
    upside_pct: float,
    volume_cycle: str,
    chart_cycle: str,
    trend: str,
    ma25_deviation: float,
    price_change_20d: float,
    volume_ratio: float,
    candle_state: str,
    chart_pattern: str,
    material_status: str,
    support_distance: float,
    warning_flags: list,
    exclude_flags: list,
) -> dict:
    scores = {}

    # 1. +20%以上の上値余地 (15点)
    if upside_pct >= 0.4:
        scores["upside_score"] = 15
    elif upside_pct >= 0.3:
        scores["upside_score"] = 12
    elif upside_pct >= 0.2:
        scores["upside_score"] = 8
    else:
        scores["upside_score"] = 0

    # 2. 未来急騰予兆 (15点) - 出来高サイクルが良い位置
    vol_score_map = {
        "再点火開始": 15,
        "再点火待ち": 13,
        "価格維持": 10,
        "売り枯れ": 8,
        "先行大商い": 7,
        "出来高不足": 2,
        "人気離散": 0,
        "天井大商い警戒": 0,
        "判定不能": 5,
    }
    scores["future_catalyst_score"] = vol_score_map.get(volume_cycle, 5)

    # 3. チャート構造 (15点) - チャートサイクル
    chart_score_map = {
        "ブレイク直前": 15,
        "値幅収縮": 13,
        "再点火待ち": 12,
        "安値切り上げ": 11,
        "初動後押し目": 10,
        "底固め": 9,
        "支持線維持": 7,
        "ブレイク済み": 6,
        "上がり切り": 1,
        "支持線割れ": 0,
        "判定不能": 5,
    }
    scores["chart_score"] = chart_score_map.get(chart_cycle, 5)

    # 4. 出来高サイクル (15点)
    vol_cycle_score_map = {
        "再点火開始": 15,
        "再点火待ち": 13,
        "価格維持": 11,
        "売り枯れ": 9,
        "先行大商い": 7,
        "出来高不足": 2,
        "人気離散": 1,
        "天井大商い警戒": 0,
        "判定不能": 6,
    }
    scores["volume_cycle_score"] = vol_cycle_score_map.get(volume_cycle, 6)

    # 5. 材料・テーマの芯 (10点)
    material_score_map = {
        "材料あり": 10,
        "テーマのみ": 7,
        "続報期待": 8,
        "決算接近": 5,
        "材料不明": 3,
        "材料なし": 2,
    }
    scores["material_theme_score"] = material_score_map.get(material_status, 3)

    # 6. 需給の軽さ (10点)
    supply_score = 10
    if ma25_deviation > 0.5:
        supply_score -= 5
    elif ma25_deviation > 0.3:
        supply_score -= 3
    if price_change_20d > 0.5:
        supply_score -= 4
    elif price_change_20d > 0.3:
        supply_score -= 2
    if volume_ratio > 5:
        supply_score -= 2
    scores["supply_score"] = max(0, supply_score)

    # 7. アーキタイプの重なり (10点)
    arch_score = 5
    if trend in ["上昇トレンド", "上昇トレンド継続"]:
        arch_score += 2
    if chart_cycle in ["再点火待ち", "ブレイク直前", "値幅収縮"]:
        arch_score += 2
    if "大陽線" in candle_state or "下ヒゲ反転" in candle_state:
        arch_score += 1
    scores["archetype_score"] = min(10, arch_score)

    # 8. リスク管理のしやすさ (10点)
    risk_score = 10
    if support_distance > 0.2:
        risk_score -= 4
    elif support_distance > 0.1:
        risk_score -= 2
    if "支持線割れ" in warning_flags:
        risk_score -= 5
    if "材料不明警戒" in warning_flags:
        risk_score -= 1
    scores["risk_management_score"] = max(0, risk_score)

    total = sum(scores.values())

    # ハード除外
    for flag in exclude_flags:
        total = 0
        break

    return {
        **scores,
        "total_score": min(100, total),
    }


def classify_result(total_score: float, exclude_flag: bool, exclude_reason: str) -> str:
    if exclude_flag:
        return "除外"
    if total_score >= 85:
        return "採用候補"
    elif total_score >= 75:
        return "条件付き候補"
    elif total_score >= 65:
        return "監視候補"
    else:
        return "非表示"


def compute_warning_flags(
    ma25_deviation: float,
    price_change_20d: float,
    candle_state: str,
    volume_cycle: str,
    upside_pct: float,
    volume_ratio: float,
    chart_cycle: str,
    support_distance: float,
) -> list:
    flags = []

    if ma25_deviation > 0.5:
        flags.append("25MA乖離過大")
    if price_change_20d > 0.5:
        flags.append("短期急騰済み")
    if "上ヒゲ" in candle_state and volume_ratio > 2:
        flags.append("大商い上ヒゲ警戒")
    if "大陰線" in candle_state and volume_ratio > 2:
        flags.append("大商い大陰線警戒")
    if volume_cycle == "天井大商い警戒":
        flags.append("天井大商い警戒")
    if upside_pct < 0.2:
        flags.append("上値余地不足")
    if chart_cycle == "支持線割れ":
        flags.append("支持線割れ警戒")
    if support_distance > 0.2:
        flags.append("支持線が遠すぎる")

    return flags


def check_hard_exclusion(
    jpy_price: float,
    price_condition_pass: bool,
    volume: float,
    volume_avg20: float,
    min_volume: float,
    price_change_20d: float,
    ma25_deviation: float,
    upside_pct: float,
    chart_cycle: str,
    in_exclusion_list: bool,
    data_available: bool,
) -> tuple[bool, str]:
    if not data_available:
        return True, "データ取得失敗"
    if not price_condition_pass or jpy_price > 3000:
        return True, "価格条件外"
    if jpy_price <= 0:
        return True, "価格不明"
    if volume_avg20 < min_volume:
        return True, "出来高不足"
    if price_change_20d > 1.0:
        return True, "直近20日で2倍以上"
    if ma25_deviation > 0.8:
        return True, "25MA乖離過大(+80%以上)"
    if upside_pct < 0.2:
        return True, "上値余地不足"
    if chart_cycle == "支持線割れ":
        return True, "支持線割れ"
    if in_exclusion_list:
        return True, "除外リスト登録済み"

    return False, ""


def generate_ai_comment(
    symbol: str,
    name: str,
    classification: str,
    total_score: float,
    volume_cycle: str,
    chart_cycle: str,
    trend: str,
    upside_pct: float,
    ma25_deviation: float,
    support_distance: float,
    warning_flags: list,
    main_archetype: str,
    exclude_reason: str,
    material_status: str,
) -> str:
    if classification == "除外":
        return f"【除外】{exclude_reason}のため候補から除外。スコア: {total_score:.0f}/100。※この分析は投資助言ではありません。"

    comment_parts = []

    # 基本評価
    if classification == "採用候補":
        comment_parts.append(f"スコア{total_score:.0f}/100の採用候補銘柄。")
    elif classification == "条件付き候補":
        comment_parts.append(f"スコア{total_score:.0f}/100の条件付き候補。条件確認後に精査推奨。")
    elif classification == "監視候補":
        comment_parts.append(f"スコア{total_score:.0f}/100の監視候補。状況変化を確認。")
    else:
        comment_parts.append(f"スコア{total_score:.0f}/100。条件未達のため通常非表示。")

    # 出来高サイクル
    comment_parts.append(f"出来高サイクル: {volume_cycle}。")

    # チャートサイクル
    comment_parts.append(f"チャートサイクル: {chart_cycle}。")

    # 上値余地
    comment_parts.append(f"抵抗線までの上値余地: {upside_pct*100:.1f}%。")

    # 材料
    comment_parts.append(f"材料状況: {material_status}。")

    # 警告フラグ
    if warning_flags:
        comment_parts.append(f"注意: {', '.join(warning_flags[:3])}。")

    comment_parts.append("※この分析は投資助言ではなく、短期急騰パターンの分析・学習目的です。最終判断はご自身でお願いします。")

    return " ".join(comment_parts)
