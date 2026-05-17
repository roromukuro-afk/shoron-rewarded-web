# 短期急騰3000円以下 AIスクリーナー

日本株・米国株・ADRを対象に、3000円以下で短期（数日〜4週間）+20%以上の急騰余地を持つ可能性がある銘柄を自動抽出・分類・可視化するWebツールです。

> **⚠ 免責事項**: これは投資助言ではありません。分析・学習目的のツールです。売買推奨ではなく、最終判断はご自身でお願いします。AIは「買い推奨」「今買うべき」「必ず上がる」などの断定表現を使いません。

---

## 機能

- **全銘柄スクリーニング**: 対象市場の全銘柄を一括スクリーニング
- **スコアリング**: 8項目100点満点の急騰予兆スコア算出
- **チャート分析**: 支持線・抵抗線・移動平均・チャートパターン自動判定
- **出来高サイクル**: 売り枯れ→再点火パターンを自動検出
- **アーキタイプ分類**: 急騰パターンの類型分類
- **AARメモ出力**: NotebookLM対応テキスト生成
- **バックテスト**: 1日後〜20日後の価格追跡
- **CSV/Excel出力**: 全分類をシート別でエクスポート

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド | Next.js 16 + TypeScript + Tailwind CSS v4 |
| バックエンド | FastAPI + Python 3.11 |
| DB | SQLite (ローカル) / PostgreSQL (本番) |
| チャート | Recharts |
| 株価データ | yfinance (Yahoo Finance) |

---

## ローカル起動

### 1. バックエンドセットアップ

```bash
pip install -r backend/requirements.txt
cd backend
python -c "from database import init_db; init_db()"
```

`.env` を作成:

```bash
cp backend/.env.example backend/.env
```

### 2. フロントエンドセットアップ

```bash
npm install
cp .env.local.example .env.local
```

### 3. 起動

バックエンド:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

フロントエンド:
```bash
npm run dev
```

### 4. アクセス

- フロントエンド: http://localhost:3000/screener
- バックエンドAPI: http://localhost:8000
- APIドキュメント: http://localhost:8000/docs

---

## ページ構成

| ページ | URL | 説明 |
|--------|-----|------|
| ダッシュボード | /screener | 本日の統計・上位候補 |
| スクリーニング | /screener/screening | スクリーニング実行・結果 |
| 候補ランキング | /screener/ranking | 採用/条件付き/監視候補 |
| 除外銘柄 | /screener/excluded | 除外銘柄と理由 |
| 除外リスト管理 | /screener/exclusion-list | 除外リスト登録 |
| AAR出力 | /screener/aar | AARメモ生成 |
| バックテスト | /screener/backtest | 株価推移追跡 |
| 銘柄詳細 | /screener/stocks/[symbol] | 個別銘柄分析 |
| 設定 | /screener/settings | スクリーニング設定 |
| 稼働状況 | /screener/deploy-status | バックエンド状態確認 |

---

## スコア計算

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
- **85点以上**: 採用候補
- **75〜84点**: 条件付き候補
- **65〜74点**: 監視候補
- **64点以下**: 非表示
- **除外条件**: 除外

---

## クラウドデプロイ

詳細は [DEPLOY.md](./DEPLOY.md) を参照してください。

---

## 銘柄ユニバース

| 市場 | ファイル | デフォルト件数 |
|------|---------|--------------|
| 日本株 | data/jp_universe_sample.csv | 42銘柄 |
| 米国株 | data/us_universe_sample.csv | 40銘柄 |
| ADR | data/adr_sample.csv | 20銘柄 |

JPX公式CSVを `data/jp_universe.csv` に配置すると自動的に使用されます。
