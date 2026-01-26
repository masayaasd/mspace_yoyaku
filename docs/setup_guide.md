# LINE予約システム 起動・テストガイド

このドキュメントでは、本プロジェクトをローカル環境で起動し、テストを実施する手順を解説します。

## 1. バックエンドの起動手順

バックエンドは Node.js (Express) と Prisma (SQLite) で構成されています。

### 依存関係のインストール
```bash
npm install
```

### 環境設定
1. `.env.example` を `.env` にコピーします。
   ```bash
   cp .env.example .env
   ```
2. `.env` 内の各項目を設定します（テスト起動であればデフォルトまたは指示通りでOK）。

### データベースの準備
Prismaを使用してSQLiteデータベースを初期化します。
```bash
npx prisma migrate dev --name init
```

### 開発サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで `http://localhost:3000/healthz` にアクセスし、`ok` と表示されれば正常です。

---

## 2. LIFFアプリ（フロントエンド）の起動手順

フロントエンドは `liff-app` ディレクトリ内に Vite + React で構成されています。

### ディレクトリ移動とインストール
```bash
cd liff-app
npm install
```

### 環境設定
1. `cp .env.sample .env` を実行し、必要に応じて設定を編集します。

### 開発サーバーの起動
```bash
npm run dev
```
デフォルトでは `http://localhost:5173` で起動します。

---

## 3. スタッフ管理画面の起動手順

スタッフ向けの管理画面は `admin-app` ディレクトリにあります。

### 開発サーバーの起動
```bash
# プロジェクトルートから
npm run admin:dev
```
デフォルトでは `http://localhost:5174` で起動します。
初期ログイン情報は以下の通りです：
- **ユーザー名**: `admin`
- **パスワード**: `admin123`

この画面から、LINE のシークレットキーやアクセストークンの設定、予約の管理、テーブルの管理がすべて行えます。

---

## 4. テストの実行方法

本プロジェクトでは Vitest を使用しています。

### 単体・統合テストの実行
```bash
npm test
```

---

## 主なコマンドまとめ

| 目的 | コマンド |
| :--- | :--- |
| **全体インストール** | `npm install` |
| **DB初期化** | `npx prisma migrate dev` |
| **バックエンド起動** | `npm run dev` |
| **フロントエンド起動** | `cd liff-app && npm run dev` |
| **テスト実行** | `npm test` |
