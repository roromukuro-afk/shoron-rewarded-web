import pandas as pd
import io
from typing import List
from datetime import date


COLUMN_LABELS = {
    "symbol": "銘柄コード",
    "name": "銘柄名",
    "market": "市場",
    "price": "現在値",
    "currency": "通貨",
    "jpy_price": "円換算価格",
    "price_fetched_at": "価格取得時点",
    "fx_fetched_at": "為替取得時点",
    "price_change_1d": "前日比(%)",
    "volume": "出来高",
    "volume_avg20": "20日平均出来高",
    "volume_ratio": "出来高倍率",
    "turnover": "売買代金",
    "market_cap": "時価総額",
    "ma5": "5MA",
    "ma25": "25MA",
    "ma75": "75MA",
    "ma200": "200MA",
    "ma25_deviation": "25MA乖離率(%)",
    "recent_high_20": "直近高値(20日)",
    "recent_low_20": "直近安値(20日)",
    "support_line": "支持線",
    "resistance_line": "抵抗線",
    "upside_to_resistance": "抵抗線までの上値余地(%)",
    "support_distance": "支持線までの距離(%)",
    "trend_state": "トレンド状態",
    "range_state": "レンジ状態",
    "candle_state": "ローソク足状態",
    "chart_pattern_primary": "チャートパターン",
    "volume_cycle_state": "出来高サイクル",
    "chart_cycle_state": "チャートサイクル",
    "material_status": "材料有無",
    "theme_tags": "テーマタグ",
    "total_score": "急騰予兆スコア",
    "classification": "判定",
    "main_archetype": "主型",
    "sub_archetypes": "補助型",
    "chart_types": "チャート型",
    "warning_types": "注意型",
    "warning_flags": "警告フラグ",
    "exclude_reason": "除外理由",
    "ai_comment": "AIコメント",
    "exchange": "取引所",
    "sector": "業種",
}


def results_to_dataframe(results: List[dict]) -> pd.DataFrame:
    if not results:
        return pd.DataFrame()

    df = pd.DataFrame(results)

    # パーセント変換
    for col in ["price_change_1d", "price_change_5d", "price_change_20d",
                "ma25_deviation", "upside_to_resistance", "support_distance"]:
        if col in df.columns:
            df[col] = (df[col] * 100).round(2)

    # 数値丸め
    for col in ["price", "jpy_price", "ma5", "ma25", "ma75", "ma200",
                "support_line", "resistance_line", "recent_high_20", "recent_low_20"]:
        if col in df.columns:
            df[col] = df[col].round(2)

    for col in ["total_score", "volume_ratio"]:
        if col in df.columns:
            df[col] = df[col].round(1)

    return df


def export_csv(results: List[dict], classification_filter: str = None) -> bytes:
    df = results_to_dataframe(results)
    if classification_filter:
        df = df[df["classification"] == classification_filter] if "classification" in df.columns else df

    rename_map = {k: v for k, v in COLUMN_LABELS.items() if k in df.columns}
    df = df.rename(columns=rename_map)

    output = io.BytesIO()
    df.to_csv(output, index=False, encoding="utf-8-sig")
    return output.getvalue()


def export_excel(results: List[dict]) -> bytes:
    df_all = results_to_dataframe(results)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # 全結果
        _write_sheet(writer, df_all, "All_Results")

        # 分類別
        for cls, sheet_name in [
            ("採用候補", "Adopted"),
            ("条件付き候補", "Conditional"),
            ("監視候補", "Watch"),
            ("除外", "Excluded"),
        ]:
            subset = df_all[df_all.get("classification", pd.Series()) == cls] if "classification" in df_all.columns else pd.DataFrame()
            _write_sheet(writer, subset, sheet_name)

        # AARシート
        aar_df = _make_aar_sheet(results)
        _write_sheet(writer, aar_df, "AAR")

        # バックテストシート
        bt_df = pd.DataFrame(columns=["symbol", "name", "date", "score", "classification",
                                       "result_after_1d", "result_after_3d", "result_after_5d",
                                       "result_after_10d", "result_after_20d", "max_gain", "hit_20_percent"])
        _write_sheet(writer, bt_df, "Backtest")

    return output.getvalue()


def _write_sheet(writer, df: pd.DataFrame, sheet_name: str):
    if df.empty:
        pd.DataFrame({"info": ["データなし"]}).to_excel(writer, sheet_name=sheet_name, index=False)
        return
    rename_map = {k: v for k, v in COLUMN_LABELS.items() if k in df.columns}
    df = df.rename(columns=rename_map)
    df.to_excel(writer, sheet_name=sheet_name, index=False)


def _make_aar_sheet(results: List[dict]) -> pd.DataFrame:
    candidates = [r for r in results if r.get("classification") in ["採用候補", "条件付き候補", "監視候補"]]
    rows = []
    for r in candidates:
        rows.append({
            "symbol": r.get("symbol"),
            "name": r.get("name"),
            "date": r.get("date"),
            "classification": r.get("classification"),
            "total_score": r.get("total_score"),
            "main_archetype": r.get("main_archetype"),
            "chart_types": r.get("chart_types"),
            "volume_cycle_state": r.get("volume_cycle_state"),
            "chart_cycle_state": r.get("chart_cycle_state"),
            "material_status": r.get("material_status"),
            "upside_to_resistance": r.get("upside_to_resistance"),
            "support_distance": r.get("support_distance"),
            "ma25_deviation": r.get("ma25_deviation"),
            "trend_state": r.get("trend_state"),
            "warning_flags": r.get("warning_flags"),
            "ai_comment": r.get("ai_comment"),
        })
    return pd.DataFrame(rows)


def generate_aar_text(result: dict) -> str:
    """AAR形式テキスト生成"""
    sym = result.get("symbol", "")
    name = result.get("name", "")
    upside_pct = result.get("upside_to_resistance", 0) * 100 if result.get("upside_to_resistance") else 0
    support_dist_pct = result.get("support_distance", 0) * 100 if result.get("support_distance") else 0
    ma25_dev_pct = result.get("ma25_deviation", 0) * 100 if result.get("ma25_deviation") else 0

    return f"""【短期急騰AAR候補メモ】

銘柄：{name} ({sym})
日付：{result.get("date", "不明")}
市場：{result.get("market", "不明")}
判定：{result.get("classification", "不明")}
急騰予兆スコア：{result.get("total_score", 0):.0f}/100
主型：{result.get("main_archetype", "不明")}
補助型：{result.get("sub_archetypes", "-")}
チャート型：{result.get("chart_types", "-")}
注意型：{result.get("warning_types", "-")}

【材料】
・材料状況: {result.get("material_status", "不明")}
・テーマ: {result.get("theme_tags", "なし")}

【未来急騰予兆】
・出来高サイクル: {result.get("volume_cycle_state", "不明")}
・チャートサイクル: {result.get("chart_cycle_state", "不明")}

【出来高サイクル】
・先行大商い: {_check_cycle(result.get("volume_cycle_state", ""), "先行大商い")}
・売り枯れ: {_check_cycle(result.get("volume_cycle_state", ""), "売り枯れ")}
・価格維持: {_check_cycle(result.get("volume_cycle_state", ""), "価格維持")}
・再点火: {_check_cycle(result.get("volume_cycle_state", ""), "再点火")}

【チャート位置】
・支持線：{result.get("support_line", "不明")}
・抵抗線：{result.get("resistance_line", "不明")}
・25MA乖離：{ma25_dev_pct:.1f}%
・上値余地：{upside_pct:.1f}%
・支持線距離：{support_dist_pct:.1f}%
・トレンド状態：{result.get("trend_state", "不明")}
・レンジ状態：{result.get("range_state", "不明")}

【ローソク足】
・{result.get("candle_state", "不明")}

【チャートパターン】
・{result.get("chart_pattern_primary", "不明")}
・{result.get("chart_pattern_secondary", "")}

【T-3サイン】
・(要確認)

【T-2サイン】
・(要確認)

【T-1サイン】
・(要確認)

【T-1で入る余地】
条件付き

【エントリー条件】
・(ユーザーが個別に設定)

【損切り条件】
・支持線割れ ({result.get("support_line", "不明")})

【見送り条件】
・{result.get("warning_flags", "なし")}

【結果論リスク】
・材料不明の場合は高リスク
・支持線が遠い場合は損切りラインが置きにくい

【今後検証すべき点】
・実際に+20%以上達成したか
・出来高サイクルの判定精度

※これは投資助言ではなく、短期急騰パターンの分析・学習用メモ。
最終的な売買判断はユーザー自身が行う前提です。
"""


def _check_cycle(current: str, target: str) -> str:
    return "✓ 現在" if target in current else "○ 該当なし"
