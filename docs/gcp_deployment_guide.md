# Google Cloud Run デプロイガイド

Google Cloud Run (GCR) を利用して、低コストかつ高速な予約システムを公開する手順です。
Render よりも最初の読み込み（コールドスタート）が速く、無料枠も非常に強力です。

## 1. 準備するもの
- **Google Cloud アカウント** (クレジットカード登録が必要ですが、無料枠内で収まります)
- **GitHub リポジトリ** (ソースコードをアップロード済み)
- **外部データベース (DATABASE_URL)** (Neon や Supabase で作成したもの)

## 2. Google Cloud の初期設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス。
2. 新しいプロジェクトを作成 (例: `poker-reserve-project`)。
3. **Cloud Run API** を有効にします。

## 3. デプロイ手順（もっとも簡単な方法）
サーバー上でコマンドを打つ必要はありません。Google Cloud の画面から設定できます。

1.  **Cloud Run** 画面で「サービスを作成」をクリック。
2.  「ソースリポジトリから継続的にデプロイする」を選択し、GitHub 連携を設定。
3.  作成した GitHub リポジトリを選択。
4.  **ビルド構成**:
    *   ビルドタイプ: Docker
    *   Dockerfile のパス: `Dockerfile` (プロジェクトルートにあるもの)
5.  **環境変数 (変数とシークレット)** を設定：
    *   `DATABASE_URL`: 作成したデータベースの接続文字列
    *   `JWT_SECRET`: 適当な長い文字列
    *   `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN`: LINE のキー
    *   `LINE_LOGIN_CHANNEL_ID` / `LINE_LOGIN_CHANNEL_SECRET`: LINEログインのキー
    *   `LINE_LOGIN_CHANNEL_ID` / `LINE_LOGIN_CHANNEL_SECRET`: LINEログインのキー
    *   `VITE_API_BASE`: (任意) そのまま空欄でOKです。自動的に `/api` が使われます。
6.  **認証**: 「未認証の呼び出しを許可」にチェック（誰でも予約画面にアクセスできるようにするため）。

## (推奨) セキュリティの強化: Secret Manager の利用
環境変数をそのまま設定するのではなく、より安全な **Secret Manager** を利用することをお勧めします。

1.  Cloud Console で **Secret Manager** を検索・開く。
2.  「シークレットを作成」で以下の機密情報を登録:
    - `DATABASE_URL`
    - `JWT_SECRET`
    - `LINE_CHANNEL_SECRET`
    - `LINE_LOGIN_CHANNEL_SECRET`
3.  Cloud Run の「編集」画面で「変数とシークレット」タブを開く。
4.  「シークレットを参照」ボタンから、登録したシークレットを環境変数として読み込む設定を行う（環境変数名は同じにする）。
    - 例: 環境変数 `DATABASE_URL` の値として、Secret Manager の `DATABASE_URL` 最新バージョンを指定。

## 4. デプロイ後の必須設定 (LINE連携)
デプロイが完了して URL (例: `https://mspace-xxxxx.a.run.app`) が発行されたら、以下の設定を行ってください。

1.  **LINE Developers 設定**:
    - [LINE Developers コンソール](https://developers.line.biz/) にアクセス。
    - **Messaging API設定** タブの **Webhook URL** に `https://[あなたのURL]/line/webhook` を入力して更新。
    - **Webhookの利用** を **オン** にする。
    - 「検証」ボタンを押して成功することを確認。
    - **LINEログイン設定** タブの **コールバックURL** に `https://[あなたのURL]/api/auth/callback` を入力。

    - **LINEログイン設定** タブの **コールバックURL** に `https://[あなたのURL]/api/auth/callback` を入力。

## 5. 運用とコスト
- **無料枠**: Cloud Run は毎月、一定のアクセス量まで無料です。個人の店舗レベルであれば、月額 0円〜数十円で収まる可能性が高いです。
- **高速な起動**: Render Free のように 30秒待たされることはありません。1〜2秒で起動します。

---

この構成により、お客様を待たせることなく、プロフェッショナルな予約体験を提供できます。設定で詰まったら、画面のスクリーンショットなどを共有してください！
