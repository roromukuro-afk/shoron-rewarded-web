# デプロイガイド

このアプリは以下の構成でクラウドデプロイできます。

- **フロントエンド**: Vercel (推奨) または任意のNext.js対応ホスティング
- **バックエンド**: Render.com (推奨) またはFly.io / Railway
- **DB**: PostgreSQL (Render managed DB, Supabase, Neon等)

---

## 推奨: Vercel + Render構成

### バックエンド (Render.com)

1. GitHubリポジトリをRenderに接続

2. 新しいWebサービスを作成:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

3. 環境変数を設定:
   ```
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://your-app.vercel.app
   DATABASE_URL=<RenderのPostgreSQL接続文字列>
   YFINANCE_ENABLED=true
   ```

4. PostgreSQLデータベースをRender上に作成し、`DATABASE_URL`に接続文字列を設定

5. デプロイ後、`https://your-backend.onrender.com/api/health` でヘルスチェック

### フロントエンド (Vercel)

1. GitHubリポジトリをVercelに接続

2. 環境変数を設定:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
   ```

3. デプロイ → `https://your-app.vercel.app/screener` でアクセス

---

## Docker Composeでの起動

ローカルでPostgreSQL込みの完全構成を起動する場合:

```bash
docker-compose up --build
```

- フロントエンド: http://localhost:3000/screener
- バックエンド: http://localhost:8000
- PostgreSQL: localhost:5432

---

## Fly.io / Railwayデプロイ

### バックエンドをFly.ioにデプロイ

```bash
cd backend
fly launch
fly secrets set ENVIRONMENT=production
fly secrets set ALLOWED_ORIGINS=https://your-app.vercel.app
fly secrets set DATABASE_URL=<PostgreSQL接続文字列>
fly deploy
```

---

## 環境変数一覧

### フロントエンド

| 変数 | 説明 | 例 |
|------|------|-----|
| `NEXT_PUBLIC_API_BASE_URL` | バックエンドAPIのURL | `https://your-backend.onrender.com` |

### バックエンド

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `ENVIRONMENT` | 環境識別子 | `local` |
| `ALLOWED_ORIGINS` | CORS許可オリジン(カンマ区切り) | `http://localhost:3000` |
| `ALLOW_ORIGIN_REGEX` | CORS許可オリジン正規表現(オプション) | - |
| `DATABASE_URL` | DB接続文字列 | `sqlite:///./screener.db` |
| `YFINANCE_ENABLED` | yfinanceを使用するか | `true` |

---

## DBマイグレーション

新しいDBに初期テーブルを作成:

```bash
cd backend
python -c "from database import init_db; init_db()"
```

---

## ヘルスチェック

デプロイ後の確認:

```bash
# バックエンドの状態確認
curl https://your-backend.onrender.com/api/health

# ステータス詳細
curl https://your-backend.onrender.com/api/status
```

正常時のレスポンス例:
```json
{
  "status": "ok",
  "environment": "production",
  "database": "postgresql",
  "database_backend": "postgresql",
  "sample_mode": false,
  "yfinance_enabled": true
}
```

---

## トラブルシューティング

### CORSエラーが出る

`ALLOWED_ORIGINS` にフロントエンドのURLが含まれているか確認:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

### DBに接続できない

`DATABASE_URL` の形式を確認:
- PostgreSQL: `postgresql://user:password@host:5432/dbname`
- `postgres://` は自動的に `postgresql://` に変換されます (Render等対応)

### yfinanceがタイムアウトする

Render等の無料プランはIPブロックされる場合があります。サンプルモードで動作確認してください。
