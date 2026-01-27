# Vercel デプロイガイド (フロントエンド分離構成)

このガイドでは、**管理画面 (Admin App)** と **お客様用予約画面 (LIFF App)** を Vercel にデプロイし、真っ白な画面になる問題を解決する手順を説明します。

## 前提条件
- [Vercel](https://vercel.com/) のアカウント (無料の Hobby プランで十分です)
- GitHub と Vercel が連携されていること

## 1. 管理画面 (Admin App) のデプロイ

1.  Vercel のダッシュボードで **Add New Project** をクリックします。
2.  GitHub リポジトリ (`mspace_yoyaku`) の **Import** ボタンを押します。
3.  **Project Name**: `mspace-admin` (または好みの名前)
4.  **Framework Preset**: **Vite** が選択されていることを確認します（自動でなるはずです）。
5.  **Root Directory**: **Edit** をクリックし、`admin-app` を選択してチェックを入れます。 **(ここが最重要です！)**
6.  **Environment Variables** (環境変数) を展開し、以下を追加します:
    - `VITE_API_BASE`: あなたの Cloud Run のURL (例: `https://mspace-xxxxx.a.run.app`) ※末尾の `/` は無し
7.  **Deploy** をクリックします。

## 2. 予約画面 (LIFF App) のデプロイ

1.  ダッシュボードに戻り、もう一度 **Add New Project** をクリックします。
2.  **同じ** GitHub リポジトリ (`mspace_yoyaku`) を Import します。
3.  **Project Name**: `mspace-liff` (または好みの名前)
4.  **Framework Preset**: **Vite** を確認。
5.  **Root Directory**: **Edit** をクリックし、`liff-app` を選択します。 **(ここを変えるのを忘れずに！)**
6.  **Environment Variables** に以下を追加します:
    - `VITE_API_BASE`: Cloud Run のURL (Adminと同じ)
    - `VITE_LIFF_ID`: あなたの LIFF ID (例: `2008272520-xxxxxx`)
7.  **Deploy** をクリックします。

## 3. デプロイ後の設定変更

### LINE Developers (LIFFの設定)
1.  [LINE Developers](https://developers.line.biz/) にログインします。
2.  LIFFタブを開き、**Endpoint URL** を変更します。
    - 変更前: `https://mspace-xxxxx.a.run.app`
    - 変更後: `https://mspace-liff.vercel.app` (手順2で発行されたURL)

### 管理画面の設定 (Admin App)
1.  デプロイされた Admin App (`https://mspace-admin.vercel.app`) にアクセスします。
2.  ログイン後、サイドメニューの「設定 (Settings)」を開きます。
3.  **Webhook URL** は変更しなくてOKです (バックエンドの Cloud Run のURLのままが正解です)。
4.  **LINE設定 (重要)**:
    - **Messaging API**: Channel Secret と Access Token を入力。
    - **LINE Login**: **Channel ID** に、LIFF IDのハイフンより前の数字 (例: `2008272520`) を必ず入力してください。 **(ここが間違っていると LIFF で 401エラー になります)**
    - 保存を押します。
    - ※ バックエンドの改修により、ここで保存した設定が即座に反映されるようになっています。

## トラブルシューティング
- **リロードすると 404 エラーになる**:
  - Vercel は通常、自動的に SPA (シングルページアプリ) のルーティングを処理してくれます。もしエラーが出る場合は、ルートディレクトリに `vercel.json` が必要になる場合がありますが、基本的にはデフォルト設定で動作します。
- **CORS エラー (Network Error) が出る**:
  - バックエンド (Cloud Run) 側で、Vercel からのアクセスを許可設定にする必要があります。
  - すでにコード修正済み (`src/lib/cors.ts` で `.vercel.app` を許可) なので、バックエンドも最新であることを確認してください。
