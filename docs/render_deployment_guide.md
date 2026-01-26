# Render 無料デプロイガイド

Render.com を利用して、完全に無料で予約システムを公開する手順です。

## 1. データベースの準備 (Neon or Supabase)
Render の無料データベースは 90 日で消去されるため、**Neon** または **Supabase** の利用を推奨します。

1.  [Neon](https://neon.tech/) または [Supabase](https://supabase.com/) に登録。
2.  新しいプロジェクトを作成し、**PostgreSQL 接続文字列（DATABASE_URL）**をコピーします。
    *   例: `postgresql://user:password@hostname/dbname?sslmode=require`

## 2. GitHub へのアップロード
Render は GitHub と連携してデプロイします。
1.  [GitHub](https://github.com/) でプライベートリポジトリを作成。
2.  このプロジェクトのファイルをすべてアップロード（Push）します。

## 3. Render での設定
1.  [Render](https://render.com/) にログイン。
2.  **New +** -> **Blueprint** を選択。
3.  GitHub リポジトリを接続します。
4.  `render.yaml` が自動で読み込まれます。
5.  以下の **Environment Variables (Environment)** を設定画面で入力します：
    *   `DATABASE_URL`: 手順 1 で取得した文字列
    *   `VITE_API_BASE`: `https://アプリ名.onrender.com` (アプリ作成後に確定)
    *   `VITE_LIFF_ID`: LINE Developers で取得した LIFF ID

## 4. 注意点
- **スリープ機能**: 無料プランでは 15 分間アクセスがないとサーバーがスリープします。最初のアクセス時に 30 秒ほど時間がかかりますが、これは仕様です。
- **SSL（HTTPS）**: Render が自動で設定してくれるため、自分で設定する必要はありません。

デプロイが完了したら、管理画面の URL (`.../admin`) にアクセスし、LINE の各キーを設定してください。
