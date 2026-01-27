# Vercel Deployment Guide (Frontend Separation)

This guide explains how to deploy the **Admin App** and **LIFF App** to Vercel, completing the "Split Architecture" migration.

## Prerequisites
- A [Vercel](https://vercel.com/) account (Free Hobby plan is sufficient).
- GitHub repository connected to Vercel.

## 1. Deploy Admin App

1.  **Add New Project** in Vercel.
2.  Select your GitHub repository (`mspace_yoyaku`).
3.  **Project Name**: `mspace-admin` (or similar).
4.  **Framework Preset**: Select **Vite**.
5.  **Root Directory**: Click "Edit" and select `admin-app`. **(Important!)**
6.  **Environment Variables**:
    - `VITE_API_BASE`: `https://mspace-xxxxx.a.run.app` (Your Cloud Run URL without trailing slash)
7.  Click **Deploy**.

## 2. Deploy LIFF App

1.  **Add New Project** in Vercel (Repeat the process).
2.  Select the **same** GitHub repository (`mspace_yoyaku`).
3.  **Project Name**: `mspace-liff` (or similar).
4.  **Framework Preset**: Select **Vite**.
5.  **Root Directory**: Click "Edit" and select `liff-app`. **(Important!)**
6.  **Environment Variables**:
    - `VITE_API_BASE`: `https://mspace-xxxxx.a.run.app`
    - `VITE_LIFF_ID`: Your LIFF ID (e.g. `2008272520-xxxxxx`)
7.  Click **Deploy**.

## 3. Post-Deployment Setup

1.  **Update LIFF Settings (LINE Developers)**:
    - Change the **Endpoint URL** to the new Vercel URL for the LIFF App (e.g. `https://mspace-liff.vercel.app`).
2.  **Update Admin Line Settings**:
    - In the Admin App `Settings` page, the Webhook URL will still point to Cloud Run (`.../api/line/webhook`). This is correct.
    - Confirm you can save settings without error.

## Troubleshooting
- **404 on Refresh**: Vercel handles SPA routing automatically for Vite apps. If you see 404s, ensure `vercel.json` is not conflicting (we are not using one, relying on defaults).
- **CORS Error**: Cloud Run backend needs to allow the Vercel origins.
  - If you see CORS errors, we may need to update `src/lib/cors.ts` in the backend to allow `*.vercel.app`.
