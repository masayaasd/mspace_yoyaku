# Google Cloud (GCP) 無料デプロイガイド

Google Cloud Platform (GCP) の「承認済み無料枠」を利用して、24時間スリープなし（待ち時間なし）の予約サーバーを構築する手順です。

## 1. GCP インスタンスの作成 (Compute Engine)
GCP の無料枠（Always Free）を適用するために、以下の設定を厳守してください。

1.  **GCP コンソール** ([console.cloud.google.com](https://console.cloud.google.com/)) にログイン。
2.  **Compute Engine** -> **VM インスタンス** -> **インスタンスを作成**。
3.  **名前**: `poker-reserve` (任意)
4.  **リージョン**: 以下のいずれかを必ず選択（無料枠対象）
    *   `us-west1` (Oregon)
    *   `us-central1` (Iowa)
    *   `us-east1` (South Carolina)
5.  **マシンタイプ**: `e2-micro` (2 vCPU, 1 GB メモリ) を選択。
6.  **ブートディスク**: Ubuntu (22.04 LTS または 24.04) を選択。
7.  **ファイアウォール**: 
    *   `HTTP トラフィックを許可する` にチェック
    *   `HTTPS トラフィックを許可する` にチェック
8.  **作成** をクリック。

## 2. サーバーの基本設定
インスタンスができたら、`SSH` ボタンを押してターミナルを開きます。

> [!IMPORTANT]
> **注意**: コマンドをコピーする際、文頭の ` ```bash ` や `# (コメント)` は入力しないでください。
> 以下の行を1行ずつコピーして貼り付け（Enter）してください。

### 手順 A: 基本ソフトのインストール
```bash
sudo apt update && sudo apt upgrade -y
```
(完了まで待ちます)

```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

```bash
source ~/.bashrc
```

```bash
fnm install --lts
```

### 手順 B: プログラムの配置
まだ GitHub にアップロードしていない場合は、まず [GitHub](https://github.com/) でプライベートリポジトリを作成し、あなたのPCからコードを Push する必要があります。

GitHub にアップ済みの場合は、以下を実行してください：
```bash
git clone <あなたのリポジトリURL>
```
(例: `git clone https://github.com/user/line-yoyaku.git`)

```bash
cd LINEyoyaku
```
(フォルダ名はリポジトリ名に合わせてください)

### 手順 C: 依存関係のインストール
```bash
npm install
```

## 3. 環境変数の設定
`.env` ファイルを作成し、Neon で取得したデータベース URL などを設定します。

```bash
nano .env
```
以下の内容を貼り付け（あなたの値に書き換え）
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="適当な長い文字列"
LINE_CHANNEL_SECRET="..."
LINE_CHANNEL_ACCESS_TOKEN="..."
LINE_LOGIN_CHANNEL_ID="..."
LINE_LOGIN_CHANNEL_SECRET="..."
```

## 4. ビルドと起動
```bash
# 全体のビルド（管理画面とLINEアプリも含む）
npm run build:full

# PM2 で 24時間起動
sudo npm install -g pm2
pm2 start npm --name "poker-reserve" -- run start
pm2 save
pm2 startup
```

## 5. Nginx と SSL の設定
外部から `https://...` でアクセスできるようにします。
[vps_deployment_guide.md](./vps_deployment_guide.md) の **「4. Nginxの設定」** 以降の手順と同じです。

---

### メリット
- **24時間稼働**: Render のようにスリープしません。お客様が LINE を開いた瞬間、すぐにマップが表示されます。
- **完全無料**: `e2-micro` と 30GB までのディスクであれば、月額料金はかかりません。

設定でわからないことがあれば、SSH 画面のスクリーンショットなどを添えて教えてください！
