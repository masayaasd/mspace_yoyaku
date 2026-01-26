# お名前サーバー（VPS）デプロイガイド

このガイドでは、作成した予約システムをお名前サーバー（VPS）などのLinuxサーバーで公開する手順を説明します。

## 前提条件
- お名前サーバーのVPS（UbuntuなどのLinux OS）を契約済みであること。
- ドメインを取得済み、またはサーバーのIPアドレスでアクセス可能であること。

---

## 1. サーバーの初期セットアップ
サーバーにSSHでログインし、必要なソフトをインストールします。

```bash
# パッケージリストの更新
sudo apt update

# Node.js (Voltaやnvmを使って最新のLTSを入れることを推奨)
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install --lts

# PM2 (プログラムをバックグラウンドで動かし続けるために必要)
npm install -g pm2

# Nginx (Webサーバー兼リバースプロキシ)
sudo apt install -y nginx
```

## 2. プログラムの配置とビルド
GitまたはSFTPでファイルをサーバーにアップロードした後、以下の操作を行います。

```bash
# プロジェクトのディレクトリに移動
cd LINEyoyaku

# 1. バックエンドの準備
npm install
npx prisma migrate deploy

# 2. フロントエンド（管理画面 & LINEアプリ）のビルド
# サーバーのメモリが少ない(1GB以下)場合は、ローカルでビルドして `dist` フォルダをアップする方が安全です。
cd admin-app && npm install && npm run build && cd ..
cd liff-app && npm install && npm run build && cd ..
```

## 3. アプリケーションの起動（PM2）
```bash
# バックエンドサーバーの起動
pm2 start npm --name "line-yoyaku" -- run start

# 自動起動設定（サーバー再起動時にも立ち上がるようにする）
pm2 save
pm2 startup
```

## 4. Nginxの設定（重要：SSL/HTTPS化）
LINE連携にはHTTPSが必須です。Nginxを使い、外部からのアクセス（ポート80/443）を内部のプログラム（ポート3000）に転送します。

### 設定ファイルの作成
`/etc/nginx/sites-available/yoyaku` などの名前でファイルを作成し、以下を記述します。

```nginx
server {
    listen 80;
    server_name 予約.your-domain.com; # 取得したドメイン名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 反映とSSL化（Certbot）
```bash
sudo ln -s /etc/nginx/sites-available/yoyaku /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL証明書の無料発行 (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 予約.your-domain.com
```

---

## 5. 公開後の動作確認
ブラウザで設定したドメインにアクセスします。

- **ユーザー用予約画面**: `https://予約.your-domain.com/`
- **スタッフ管理画面**: `https://予約.your-domain.com/admin`
- **Webhook設定用**: `https://予約.your-domain.com/api/line/webhook`

LINE Developersコンソールの **Webhook URL** と **LIFF Endpoint URL** を上記に合わせて更新すれば、本番環境での運用開始です。
