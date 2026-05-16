import yfinance as yf
import pandas as pd
import numpy as np
import os
import requests
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def get_fx_rate(currency: str = "USD") -> tuple[float, datetime]:
    """為替レート取得 (対円)"""
    if currency == "JPY":
        return 1.0, datetime.now()
    try:
        ticker = yf.Ticker(f"{currency}JPY=X")
        hist = ticker.history(period="2d")
        if not hist.empty:
            rate = float(hist["Close"].iloc[-1])
            return rate, datetime.now()
    except Exception as e:
        logger.warning(f"FX rate fetch failed for {currency}: {e}")

    # フォールバック
    fallback_rates = {"USD": 150.0, "EUR": 163.0, "GBP": 190.0, "HKD": 19.2, "CNY": 20.7}
    return fallback_rates.get(currency, 150.0), datetime.now()


def get_stock_data(symbol: str, period: str = "6mo") -> Optional[pd.DataFrame]:
    """株価データ取得"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        if hist.empty or len(hist) < 5:
            return None
        hist = hist.reset_index()
        hist.columns = [c.lower() for c in hist.columns]
        hist = hist.rename(columns={"stock splits": "stock_splits", "capital gains": "capital_gains"})
        return hist
    except Exception as e:
        logger.warning(f"Failed to fetch data for {symbol}: {e}")
        return None


def get_stock_info(symbol: str) -> dict:
    """銘柄情報取得"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "name": info.get("longName") or info.get("shortName") or symbol,
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "currency": info.get("currency", "USD"),
            "country": info.get("country", ""),
            "market_cap": info.get("marketCap", 0),
            "exchange": info.get("exchange", ""),
        }
    except Exception:
        return {
            "name": symbol,
            "sector": "",
            "industry": "",
            "currency": "JPY" if symbol.endswith(".T") else "USD",
            "country": "JP" if symbol.endswith(".T") else "US",
            "market_cap": 0,
            "exchange": "",
        }


def load_jp_universe() -> list[dict]:
    """日本株ユニバース取得"""
    # JPXのCSVを試みる
    sample_path = os.path.join(DATA_DIR, "jp_universe_sample.csv")
    if os.path.exists(sample_path):
        df = pd.read_csv(sample_path, dtype=str)
        result = []
        for _, row in df.iterrows():
            code = str(row.get("code", row.get("コード", ""))).strip()
            if code and code.isdigit():
                result.append({
                    "symbol": f"{code}.T",
                    "name": row.get("name", row.get("銘柄名", code)),
                    "market": "JP",
                    "exchange": row.get("exchange", row.get("市場", "東証")),
                    "sector": row.get("sector", row.get("業種", "")),
                    "is_adr": False,
                })
        return result

    # フォールバック: 主要銘柄サンプル
    return get_jp_sample_universe()


def load_us_universe(include_adr: bool = False) -> list[dict]:
    """米国株ユニバース取得"""
    sample_path = os.path.join(DATA_DIR, "us_universe_sample.csv")
    adr_path = os.path.join(DATA_DIR, "adr_sample.csv")

    result = []

    if os.path.exists(sample_path):
        df = pd.read_csv(sample_path, dtype=str)
        for _, row in df.iterrows():
            symbol = str(row.get("symbol", row.get("Symbol", ""))).strip()
            if symbol:
                result.append({
                    "symbol": symbol,
                    "name": row.get("name", row.get("Name", symbol)),
                    "market": "US",
                    "exchange": row.get("exchange", row.get("Exchange", "NASDAQ")),
                    "sector": row.get("sector", row.get("Sector", "")),
                    "is_adr": False,
                })

    if include_adr and os.path.exists(adr_path):
        df = pd.read_csv(adr_path, dtype=str)
        for _, row in df.iterrows():
            symbol = str(row.get("symbol", row.get("Symbol", ""))).strip()
            if symbol:
                result.append({
                    "symbol": symbol,
                    "name": row.get("name", row.get("Name", symbol)),
                    "market": "ADR",
                    "exchange": row.get("exchange", "NYSE"),
                    "sector": row.get("sector", ""),
                    "is_adr": True,
                })

    if not result:
        result = get_us_sample_universe()
        if include_adr:
            result.extend(get_adr_sample_universe())

    return result


def get_jp_sample_universe() -> list[dict]:
    jp_stocks = [
        ("7203", "トヨタ自動車", "輸送用機器"), ("9984", "ソフトバンクグループ", "情報・通信"),
        ("6758", "ソニーグループ", "電気機器"), ("6861", "キーエンス", "電気機器"),
        ("7974", "任天堂", "その他製品"), ("9432", "日本電信電話", "情報・通信"),
        ("4063", "信越化学工業", "化学"), ("6098", "リクルートホールディングス", "サービス"),
        ("8306", "三菱UFJフィナンシャル", "銀行"), ("6367", "ダイキン工業", "機械"),
        ("2914", "日本たばこ産業", "食料品"), ("9433", "KDDI", "情報・通信"),
        ("7267", "本田技研工業", "輸送用機器"), ("6502", "東芝", "電気機器"),
        ("4543", "テルモ", "精密機器"), ("8035", "東京エレクトロン", "電気機器"),
        ("3382", "セブン&アイ", "小売業"), ("4503", "アステラス製薬", "医薬品"),
        ("9020", "東日本旅客鉄道", "陸運"), ("4523", "エーザイ", "医薬品"),
        ("6594", "日本電産", "電気機器"), ("6723", "ルネサスエレクトロニクス", "電気機器"),
        ("9101", "日本郵船", "海運"), ("5401", "日本製鉄", "鉄鋼"),
        ("7011", "三菱重工業", "機械"), ("6301", "コマツ", "機械"),
        ("8002", "丸紅", "卸売"), ("8058", "三菱商事", "卸売"),
        ("3407", "旭化成", "化学"), ("6645", "オムロン", "電気機器"),
        ("2413", "エムスリー", "サービス"), ("4661", "オリエンタルランド", "サービス"),
        ("7733", "オリンパス", "精密機器"), ("9983", "ファーストリテイリング", "小売業"),
        ("6702", "富士通", "電気機器"), ("4307", "野村総合研究所", "情報・通信"),
        ("8801", "三井不動産", "不動産"), ("8031", "三井物産", "卸売"),
        ("4901", "富士フイルムHD", "化学"), ("7741", "HOYAコーポレーション", "精密機器"),
        ("2502", "アサヒグループ", "食料品"), ("4519", "中外製薬", "医薬品"),
        ("6954", "ファナック", "電気機器"), ("7751", "キヤノン", "電気機器"),
        ("8411", "みずほフィナンシャル", "銀行"), ("8316", "三井住友フィナンシャル", "銀行"),
        ("5108", "ブリヂストン", "ゴム"), ("9022", "東海旅客鉄道", "陸運"),
        ("4452", "花王", "化学"), ("6724", "セイコーエプソン", "電気機器"),
        ("3659", "ネクソン", "情報・通信"), ("4689", "ヤフー", "情報・通信"),
        ("2432", "DeNA", "情報・通信"), ("3765", "ガンホー", "情報・通信"),
        ("4755", "楽天グループ", "情報・通信"), ("3092", "ZOZO", "小売業"),
        ("4385", "メルカリ", "情報・通信"), ("4434", "サーバーワークス", "情報・通信"),
        ("3697", "SHIFT", "情報・通信"), ("4478", "フリー", "情報・通信"),
        ("7779", "CYBERDYNE", "機械"), ("2170", "リンクアンドモチベーション", "サービス"),
        ("4011", "ヘッドウォータース", "情報・通信"), ("4259", "エクスプリ", "情報・通信"),
        ("6532", "ベイカレント・コンサルティング", "サービス"), ("4482", "ウィルズ", "情報・通信"),
        ("3918", "PCIホールディングス", "情報・通信"), ("6050", "イー・ガーディアン", "サービス"),
        ("3825", "リミックスポイント", "情報・通信"), ("2341", "アルバイトタイムス", "サービス"),
        ("9684", "スクウェア・エニックス", "情報・通信"), ("3635", "コーエーテクモ", "情報・通信"),
        ("2121", "MIXI", "情報・通信"), ("7832", "バンダイナムコHD", "その他製品"),
        ("3543", "コメダHD", "小売業"), ("3038", "神戸物産", "小売業"),
        ("7425", "南陽", "卸売"), ("1928", "積水ハウス", "建設"),
        ("8591", "オリックス", "その他金融"), ("7201", "日産自動車", "輸送用機器"),
        ("3856", "Abalance", "電気機器"), ("5232", "住友大阪セメント", "窯業"),
        ("6315", "TOWA", "機械"), ("6640", "第一精工", "電気機器"),
        ("6502", "東芝", "電気機器"), ("7762", "シチズン時計", "精密機器"),
        ("4612", "日本ペイント", "化学"), ("2801", "キッコーマン", "食料品"),
        ("9766", "コナミHD", "情報・通信"), ("3436", "SUMCO", "電気機器"),
        ("5332", "TOTO", "窯業"), ("5233", "太平洋セメント", "窯業"),
        ("6967", "新光電気工業", "電気機器"), ("6770", "アルプスアルパイン", "電気機器"),
        ("4021", "日産化学", "化学"), ("4151", "協和キリン", "医薬品"),
        ("4568", "第一三共", "医薬品"), ("4578", "大塚HD", "医薬品"),
    ]
    result = []
    for code, name, sector in jp_stocks:
        result.append({
            "symbol": f"{code}.T",
            "name": name,
            "market": "JP",
            "exchange": "東証",
            "sector": sector,
            "is_adr": False,
        })
    return result


def get_us_sample_universe() -> list[dict]:
    us_stocks = [
        ("AAPL", "Apple Inc", "Technology"), ("MSFT", "Microsoft Corp", "Technology"),
        ("GOOGL", "Alphabet Inc", "Technology"), ("AMZN", "Amazon.com Inc", "Consumer Discretionary"),
        ("NVDA", "NVIDIA Corp", "Technology"), ("META", "Meta Platforms", "Technology"),
        ("TSLA", "Tesla Inc", "Consumer Discretionary"), ("AMD", "Advanced Micro Devices", "Technology"),
        ("INTC", "Intel Corp", "Technology"), ("QCOM", "Qualcomm Inc", "Technology"),
        ("AVGO", "Broadcom Inc", "Technology"), ("MU", "Micron Technology", "Technology"),
        ("AMAT", "Applied Materials", "Technology"), ("LRCX", "Lam Research", "Technology"),
        ("KLAC", "KLA Corp", "Technology"), ("MRVL", "Marvell Technology", "Technology"),
        ("SMCI", "Super Micro Computer", "Technology"), ("ARM", "ARM Holdings", "Technology"),
        ("PLTR", "Palantir Technologies", "Technology"), ("AI", "C3.ai Inc", "Technology"),
        ("SOUN", "SoundHound AI", "Technology"), ("BBAI", "BigBear.ai", "Technology"),
        ("IONQ", "IonQ Inc", "Technology"), ("RGTI", "Rigetti Computing", "Technology"),
        ("QUBT", "Quantum Computing Inc", "Technology"), ("ARQQ", "Arqit Quantum", "Technology"),
        ("RCAT", "Red Cat Holdings", "Technology"), ("JOBY", "Joby Aviation", "Industrials"),
        ("ACHR", "Archer Aviation", "Industrials"), ("LILM", "Lilium NV", "Industrials"),
        ("LUNR", "Intuitive Machines", "Technology"), ("RKLB", "Rocket Lab USA", "Technology"),
        ("ASTR", "Astra Space", "Technology"), ("MNTS", "Momentus Inc", "Technology"),
        ("SPCE", "Virgin Galactic", "Industrials"), ("ASTS", "AST SpaceMobile", "Technology"),
        ("GSAT", "Globalstar Inc", "Technology"), ("VSAT", "ViaSat Inc", "Technology"),
        ("GILT", "Gilat Satellite", "Technology"), ("MAXN", "Maxeon Solar", "Energy"),
        ("NOVA", "Sunnova Energy", "Energy"), ("SPWR", "SunPower Corp", "Energy"),
        ("FCEL", "FuelCell Energy", "Energy"), ("PLUG", "Plug Power", "Energy"),
        ("BLDP", "Ballard Power Systems", "Energy"), ("BE", "Bloom Energy", "Energy"),
        ("CLNE", "Clean Energy Fuels", "Energy"), ("HYZN", "Hyzon Motors", "Consumer Discretionary"),
        ("HYLN", "Hyliion Holdings", "Industrials"), ("NKLA", "Nikola Corp", "Industrials"),
        ("FSR", "Fisker Inc", "Consumer Discretionary"), ("RIVN", "Rivian Automotive", "Consumer Discretionary"),
        ("LCID", "Lucid Group", "Consumer Discretionary"), ("GOEV", "Canoo Inc", "Consumer Discretionary"),
        ("RIDE", "Lordstown Motors", "Consumer Discretionary"), ("WKHS", "Workhorse Group", "Industrials"),
        ("XPEV", "XPeng Inc", "Consumer Discretionary"), ("NIO", "NIO Inc", "Consumer Discretionary"),
        ("LI", "Li Auto Inc", "Consumer Discretionary"), ("NXPI", "NXP Semiconductors", "Technology"),
        ("ON", "ON Semiconductor", "Technology"), ("WOLF", "Wolfspeed Inc", "Technology"),
        ("SWKS", "Skyworks Solutions", "Technology"), ("QRVO", "Qorvo Inc", "Technology"),
        ("MTSI", "MACOM Technology", "Technology"), ("ENTG", "Entegris Inc", "Technology"),
        ("COHU", "Cohu Inc", "Technology"), ("ICHR", "Ichor Holdings", "Technology"),
        ("AXTI", "AXT Inc", "Technology"), ("IIVI", "Coherent Corp", "Technology"),
        ("CEVA", "CEVA Inc", "Technology"), ("SLAB", "Silicon Laboratories", "Technology"),
        ("FORM", "FormFactor Inc", "Technology"), ("ACLS", "Axcelis Technologies", "Technology"),
        ("ONTO", "Onto Innovation", "Technology"), ("BESI", "BE Semiconductor", "Technology"),
        ("AEHR", "Aehr Test Systems", "Technology"), ("UCTT", "Ultra Clean Holdings", "Technology"),
        ("AMKR", "Amkor Technology", "Technology"), ("MKSI", "MKS Instruments", "Technology"),
        ("CAMT", "Camtek Ltd", "Technology"), ("MPWR", "Monolithic Power Systems", "Technology"),
        ("ALGM", "Allegro MicroSystems", "Technology"), ("DIOD", "Diodes Inc", "Technology"),
        ("MCHP", "Microchip Technology", "Technology"), ("TXN", "Texas Instruments", "Technology"),
        ("ADI", "Analog Devices", "Technology"), ("NXPI", "NXP Semiconductors", "Technology"),
        ("MXIM", "Maxim Integrated", "Technology"), ("LSCC", "Lattice Semiconductor", "Technology"),
        ("XLNX", "Xilinx Inc", "Technology"), ("ALTR", "Altera Corp", "Technology"),
        ("BRCM", "Broadcom Corp", "Technology"), ("MCOM", "Microcom Corp", "Technology"),
        ("GME", "GameStop Corp", "Consumer Discretionary"), ("AMC", "AMC Entertainment", "Communication Services"),
        ("KOSS", "Koss Corp", "Consumer Discretionary"), ("BB", "BlackBerry Ltd", "Technology"),
        ("TLRY", "Tilray Brands", "Consumer Staples"), ("SNDL", "SNDL Inc", "Consumer Staples"),
        ("MSOS", "AdvisorShares Pure US Cannabis ETF", "Health Care"), ("ACB", "Aurora Cannabis", "Health Care"),
    ]
    result = []
    for sym, name, sector in us_stocks:
        result.append({
            "symbol": sym,
            "name": name,
            "market": "US",
            "exchange": "NASDAQ",
            "sector": sector,
            "is_adr": False,
        })
    return result


def get_adr_sample_universe() -> list[dict]:
    adr_stocks = [
        ("BABA", "Alibaba Group ADR", "Consumer Discretionary"),
        ("JD", "JD.com ADR", "Consumer Discretionary"),
        ("PDD", "PDD Holdings ADR", "Consumer Discretionary"),
        ("BIDU", "Baidu ADR", "Technology"),
        ("TSM", "Taiwan Semiconductor ADR", "Technology"),
        ("ASML", "ASML Holding ADR", "Technology"),
        ("SAP", "SAP SE ADR", "Technology"),
        ("SONY", "Sony Group ADR", "Consumer Discretionary"),
        ("TM", "Toyota Motor ADR", "Consumer Discretionary"),
        ("HMC", "Honda Motor ADR", "Consumer Discretionary"),
        ("NTT", "NTT ADR", "Communication Services"),
        ("MUFG", "Mitsubishi UFJ ADR", "Financials"),
        ("KB", "KB Financial ADR", "Financials"),
        ("VALE", "Vale SA ADR", "Materials"),
        ("ITUB", "Itaú Unibanco ADR", "Financials"),
        ("BBD", "Banco Bradesco ADR", "Financials"),
        ("PBR", "Petrobras ADR", "Energy"),
        ("GOLD", "Barrick Gold", "Materials"),
        ("RIO", "Rio Tinto ADR", "Materials"),
        ("BHP", "BHP Group ADR", "Materials"),
    ]
    result = []
    for sym, name, sector in adr_stocks:
        result.append({
            "symbol": sym,
            "name": name,
            "market": "ADR",
            "exchange": "NYSE",
            "sector": sector,
            "is_adr": True,
        })
    return result
