# LINE 予約システム (ポーカーテーブル)

LINE Messaging API を利用して店舗のポーカーテーブル予約を自動化するバックエンドです。Node.js (TypeScript) + Express + Prisma(SQLite) を採用し、管理者向け REST API と LINE Bot の会話フローを提供します。

## 主な機能
- LINE 上での予約受付フロー
  - 日時入力 → 空きテーブルの提示 → 氏名・電話番号を受け取り予約確定
- テーブル毎の予約状況管理と重複チェック
- REST API による運営側の予約確認・更新
- 前日リマインド通知のテンプレート管理と自動送信（cron）

## ディレクトリ構成
```
├── docs/architecture.md      # アーキテクチャ概要
├── prisma/schema.prisma      # Prisma モデル定義
├── src/
│   ├── app.ts                # Express アプリ初期化
│   ├── index.ts              # エントリーポイント
│   ├── routes/               # LINE / 管理者 API ルーター
│   ├── services/             # ドメインロジック
│   ├── scheduler/            # cron ジョブ
│   └── lib/                  # 共通ライブラリ
├── liff-app/                 # LIFF ミニアプリ (React + Vite)
└── README.md
```

## セットアップ
1. 依存ライブラリのインストール
   ```bash
   npm install
   ```
2. 環境変数テンプレートのコピー
   ```bash
   cp .env.example .env
   ```
3. `.env` を編集し、各値を設定
   - Messaging API のチャネル設定（LINE公式アカウント管理画面）から `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN` を取得
   - LINEログイン（LINE Developers コンソール）のチャネルから `LINE_LOGIN_CHANNEL_ID` / `LINE_LOGIN_CHANNEL_SECRET` を取得
   - `JWT_SECRET` は以下のコマンドで生成したランダム文字列を利用
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
   - `ALLOWED_ORIGINS` に LIFF ミニアプリや管理UIの Origin をカンマ区切りで指定
4. 環境変数の検証
   ```bash
   npm run check:env
   ```
5. Prisma の初期化
   ```bash
   npx prisma migrate dev --name init
   ```
6. 開発サーバー起動
   ```bash
   npm run dev
   ```
7. 動作確認  
   `http://localhost:3000/healthz` にアクセスし `ok` が表示されれば起動成功です。

## LIFF ミニアプリのローカル動作
バックエンドを起動した状態で、別ターミナルから以下を実行します。

```bash
cd liff-app
cp .env.sample .env
# .env に VITE_LIFF_ID（LINE Developers で取得した LIFF ID）と VITE_API_BASE（通常は http://localhost:3000）を設定
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開き、LIFF ログイン → 空き枠検索 → 予約 → 「自分の予約」表示まで確認します。  
バックエンド側の `.env` で `ALLOWED_ORIGINS` に `http://localhost:5173` が含まれていることと、LIFF アプリ設定でエンドポイント URL をこのホストに合わせていることを確認してください。  
Messaging API のチャネル（ボット）と LINEログインのチャネルは別管理です。LIFF ID / LINEログインのチャネルID・シークレットは LINE Developers の「LINEログイン」チャネルから取得し、Messaging API のチャネルシークレット／アクセストークンは LINE公式アカウント管理から取得します。

## 主要エンドポイント
- `POST /line/webhook` : LINE Messaging API からの受信
- `POST /api/auth/liff` : LIFF の idToken から JWT を発行
- `GET /api/availability` : 指定日・人数で予約可能なテーブル枠を取得
- `POST /api/book` : JWT 認証済みユーザーが予約を作成
- `GET /api/my/reservations` : JWT 認証済みユーザーの予約一覧
- `GET /api/reservations` : 予約一覧（クエリで期間・テーブル指定可能）
- `POST /api/reservations` : 管理者による予約作成
- `PUT /api/reservations/:id` : 予約変更
- `GET /api/tables` : テーブル一覧
- `GET|PUT /api/templates/reminder` : リマインド通知テンプレート

## 次のステップ
- LINE の Flex Message を用いた UI 改善
- 予約変更／キャンセルの会話フロー追加
- 管理者向け Web UI (React/Next.js) の実装
- 単体テスト & E2E テストの追加（Vitest + supertest など）
