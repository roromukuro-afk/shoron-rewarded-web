# 短期急騰3000円以下AIスクリーナー

## ⚠ 重要：免責事項

**これは投資助言ではありません。**
- 売買推奨ではありません
- 最終判断はユーザーご自身が行ってください
- AIは「買い推奨」「今買うべき」「必ず上がる」などの断定表現を使いません
- 掲載情報の正確性・完全性は保証されません
- 株式投資にはリスクが伴います

---

## 概要

日本株・米国株・ADRを含む対象市場の全銘柄をスクリーニングし、3000円以下で短期（数日〜4週間）に+20%以上の上昇余地を持つ可能性がある銘柄を抽出・分類・可視化するWebツールです。

**分析・学習・検証目的のツールです。**

---

## 環境構築

### 必要条件

- Python 3.10+
- Node.js 18+
- npm 8+

### バックエンドセットアップ

```bash
pip install -r backend/requirements.txt
cd backend
python3 -c "from database import init_db; init_db()"
```

### フロントエンドセットアップ

```bash
npm install
```

---

## 起動方法

### バックエンド (FastAPI)

```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### フロントエンド (Next.js)

```bash
npm run dev
```

### アクセス

- フロントエンド: http://localhost:3000/screener
- バックエンドAPI: http://localhost:8000
- APIドキュメント: http://localhost:8000/docs

---

## ページ構成

| ページ | URL | 説明 |
|--------|-----|------|
| ダッシュボード | /screener | 本日の統計・上位候補 |
| 全銘柄スクリーニング | /screener/screening | スクリーニング実行・結果表示 |
| 候補ランキング | /screener/rankings | 採用/条件付き/監視候補 |
| 除外銘柄 | /screener/excluded | 除外銘柄と理由 |
| 除外リスト管理 | /screener/exclusion-list | 除外リスト登録・管理 |
| AAR出力 | /screener/aar | AARメモ生成 |
| バックテスト | /screener/backtest | 株価推移追跡 |
| 銘柄詳細 | /screener/stock/[symbol] | 個別銘柄分析 |

---

## 銘柄ユニバース

### 日本株

`data/jp_universe_sample.csv` にサンプルが入っています。
JPXの公式CSVを `data/jp_universe.csv` に配置すると自動的に使用されます。

形式：
```csv
code,name,exchange,sector
7203,トヨタ自動車,東証プライム,輸送用機器
```

### 米国株

`data/us_universe_sample.csv` にサンプルが入っています。

形式：
```csv
symbol,name,exchange,sector
NVDA,NVIDIA Corp,NASDAQ,Technology
```

### ADR

`data/adr_sample.csv` に主要ADRのサンプルが入っています。
スクリーニング設定で「ADRを含める」をONにすると対象になります。

---

## 全銘柄スクリーニング実行方法

1. http://localhost:3000/screener/screening にアクセス
2. 対象市場を選択（日本株/米国株/全市場）
3. データモードを選択：
   - **サンプルモード**: インターネット不要・高速（テスト用）
   - **実データモード**: yfinanceで実際の株価を取得（通信必要）
4. 価格上限・出来高条件を設定
5. 「全銘柄スクリーニング実行」ボタンをクリック
6. 進捗バーで処理状況を確認
7. 完了後に結果テーブルが更新される

---

## 除外銘柄リスト登録方法

1. http://localhost:3000/screener/exclusion-list にアクセス
2. CSV/Excel/テキストファイルをアップロード、または手動入力
3. 抽出された銘柄コードを確認（PDFは誤認識があるため必ず確認）
4. 除外理由を入力して「除外リストに登録」をクリック
5. 登録後はスクリーニング実行時に自動的に除外される

---

## 候補ランキング確認方法

1. http://localhost:3000/screener/rankings にアクセス
2. タブで採用候補/条件付き候補/監視候補を切り替え
3. カード表示/テーブル表示を切り替え
4. 銘柄カードをクリックして詳細ページへ

---

## 個別銘柄分析方法

1. ランキングや検索結果から銘柄をクリック
2. 価格チャート・出来高チャートが表示される
3. 移動平均線（5MA/25MA/75MA/200MA）が重ねて表示
4. 支持線・抵抗線がラインで表示
5. スコア内訳・AI分析コメントを確認
6. 「AARメモを生成する」でAAR出力

---

## AAR出力方法

1. http://localhost:3000/screener/aar にアクセス
2. 候補一覧から銘柄をクリック、またはスクリーニング詳細から「AARメモを生成する」
3. AAR形式テキストが生成される
4. 「コピー」でクリップボードへ（NotebookLMに貼り付け可）
5. 「テキスト保存」でtxtファイルとしてダウンロード

---

## CSV / Excel出力方法

### スクリーニングページから
- 「CSV出力」ボタン: 表示中の結果をCSVダウンロード
- 「Excel出力」ボタン: 全分類をシート別Excel出力

### 直接URLで取得
```
全結果CSV: http://localhost:8000/api/export/csv
採用候補CSV: http://localhost:8000/api/export/csv?classification=採用候補
Excel: http://localhost:8000/api/export/excel
```

Excel出力シート構成:
- All_Results: 全結果
- Adopted: 採用候補
- Conditional: 条件付き候補
- Watch: 監視候補
- Excluded: 除外銘柄
- AAR: AARメモ
- Backtest: バックテスト結果

---

## バックテスト追跡方法

1. http://localhost:3000/screener/backtest にアクセス
2. 追跡したい銘柄にチェックを入れる
3. 「追跡実行」ボタンをクリック
4. 翌日・3日後・5日後・10日後・20日後の価格変化を確認
5. +20%達成状況を確認

---

## 実データモードとサンプルモードの違い

| 項目 | サンプルモード | 実データモード |
|------|--------------|--------------|
| データ | ランダム生成 | yfinance (Yahoo Finance) |
| 通信 | 不要 | 必要 |
| 速度 | 高速 | 遅い（API制限あり） |
| 用途 | テスト・デモ | 実際のスクリーニング |
| 精度 | 低い（ランダム） | 高い（実際の株価） |

---

## スコア計算ロジック

| 項目 | 最大点 |
|------|--------|
| +20%以上の上値余地 | 15 |
| 未来急騰予兆 | 15 |
| チャート構造 | 15 |
| 出来高サイクル | 15 |
| 材料・テーマ | 10 |
| 需給の軽さ | 10 |
| アーキタイプ重なり | 10 |
| リスク管理 | 10 |
| **合計** | **100** |

判定基準:
- 85点以上: 採用候補
- 75〜84点: 条件付き候補
- 65〜74点: 監視候補
- 64点以下: 通常非表示
- 除外条件該当: 除外

---

## API一覧

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| /api/health | GET | ヘルスチェック |
| /api/dashboard | GET | ダッシュボードデータ |
| /api/universe | GET | 銘柄ユニバース取得 |
| /api/screening/run | POST | スクリーニング実行 |
| /api/screening/results | GET | スクリーニング結果取得 |
| /api/screening/progress | GET | 進捗確認 |
| /api/stocks/{symbol} | GET | 銘柄詳細 |
| /api/stocks/{symbol}/chart | GET | チャートデータ |
| /api/stocks/{symbol}/aar | GET | AARメモ生成 |
| /api/exclusions/upload | POST | 除外リストファイルアップロード |
| /api/exclusions | GET/POST | 除外リスト取得・追加 |
| /api/exclusions/bulk | POST | 除外リスト一括追加 |
| /api/export/csv | GET | CSV出力 |
| /api/export/excel | GET | Excel出力 |
| /api/backtest/run | POST | バックテスト実行 |
| /api/backtest/results | GET | バックテスト結果 |

---

## エラー時の対処

### バックエンドが起動しない
```bash
# ポート確認
lsof -i :8000
# 再起動
pkill -f uvicorn
cd backend && python3 -m uvicorn main:app --reload --port 8000
```

### フロントエンドAPIエラー
- バックエンドが起動しているか確認: http://localhost:8000/api/health
- ブラウザコンソールのエラーを確認
- CORS設定: backend/main.pyのallow_originsを確認

### yfinanceデータ取得エラー
- インターネット接続を確認
- サンプルモードに切り替えてテスト
- yfinanceは一部銘柄で取得制限がある場合があります

### データが表示されない
- スクリーニングを実行してください（/screener/screening）
- スクリーニング実行後にダッシュボードを更新

---

## 現時点の制限

1. **材料・テーマ分析**: MVPでは業種名・銘柄名からの簡易推定のみ（IRデータ未取得）
2. **リアルタイム**: 日足データのみ（分足・VWAP未対応）
3. **GU判定**: 日足ベースの近似値（分足が必要）
4. **日本株ユニバース**: サンプル42銘柄（JPX CSVを配置すれば全件対応）
5. **米国株ユニバース**: サンプル40銘柄（NASDAQ全件取得は別途対応）
6. **バックテスト**: 過去データを使った疑似バックテスト（正確なシミュレーションは別途）

---

## 今後の拡張案

- JPX上場銘柄全件CSV自動取得
- NASDAQ/NYSE全銘柄CSV取得
- IRBankやIRデータスクレイピング
- 分足・VWAP対応
- メール/Slack通知
- ポートフォリオ管理機能
- 機械学習スコアモデル
- Streamlit版（軽量代替）
