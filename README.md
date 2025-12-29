# Cloudger - Modern Cloud Accounting SaaS

**Cloudger** 是一個專為個人與小型團隊設計的現代化雲端記帳軟體。它超越了傳統的流水帳工具，採用專業的**複式簿記 (Double-Entry Bookkeeping)** 核心邏輯，提供精準的資產管理體驗，同時保持了 Apple/Linear 風格的極簡與直覺介面。

## 🎯 核心特色

*   **複式簿記系統**：遵循會計恆等式 `(資產 = 負債 + 權益)`，確保每一筆資金流向都有跡可循。
*   **多層級帳戶管理**：支援無限層級的資產（現金、銀行、投資）與負債（信用卡、貸款）帳戶，自動彙總餘額。
*   **SaaS 多租戶架構**：完整的資料隔離，支援多使用者註冊與登入。
*   **高效能資料庫分片 (Sharding)**：採用 Lookup-based Sharding 架構，將資料水平拆分至多個資料庫實例，確保擴展性。
*   **即時財務報表**：提供現金流量表、淨值成長圖與資產配置分析。
*   **安全優先**：強制 HTTPS 連線，API 層級的權限驗證，敏感資料加密儲存。

## 🛠 技術堆疊

*   **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS, shadcn/ui
*   **Backend**: Next.js Server Actions & API Routes
*   **Database**: PostgreSQL (via Neon / Docker), Prisma ORM (Multi-Schema & Sharding support)
*   **Auth**: NextAuth.js v5
*   **Email**: Resend API
*   **Deployment**: Vercel + Neon Serverless Postgres

---

## 🚀 本地開發指南 (Local Development)

請依照以下步驟在您的本地環境中設定開發測試環境。

### 1. 先決條件 (Prerequisites)

*   **Node.js**: v20 或以上版本
*   **Docker & Docker Compose**: 用於運行本地 PostgreSQL 資料庫叢集

### 2. 下載與安裝 (Setup)

複製專案並安裝相依套件：

```bash
git clone <repository-url>
cd Cloudger
npm install
```

### 3. 環境變數設定 (Environment Variables)

請建立 `.env` 檔案（可參考 `.env.example` 如有），並設定以下關鍵變數：

```env
# Database URLs (Docker Localhost)
# Auth DB (User & Routing info)
DATABASE_URL_AUTH="postgresql://postgres:postgres@localhost:5432/cloudger_auth?schema=public"

# App Shards (Transaction Data)
DATABASE_URL_SHARD_0="postgresql://postgres:postgres@localhost:5433/cloudger_app_0?schema=public"
DATABASE_URL_SHARD_1="postgresql://postgres:postgres@localhost:5434/cloudger_app_1?schema=public"
DATABASE_URL_SHARD_2="postgresql://postgres:postgres@localhost:5435/cloudger_app_2?schema=public"

# NextAuth
AUTH_SECRET="your-super-secret-key" # Generate with: openssl rand -base64 32
NEXTAUTH_URL="https://localhost:3000"

# Resend API (Optional for dev, required for email features)
RESEND_API_KEY="re_123456789"
```

### 4. 啟動資料庫服務 (Start Databases)

使用 Docker Compose 啟動包含 Auth DB 與 3 個 App DB Shards 的資料庫叢集：

```bash
docker-compose up -d
```

### 5. 初始化資料庫 Schema (Database Initialization)

由於專案使用了多個 Prisma Schema 與分片架構，請使用以下指令一次同步所有資料庫結構：

```bash
# 生成 Prisma Client
npm run postinstall

# 推送 Schema 到所有資料庫實例 (Auth DB + 3 Shards)
npm run push:all
```

> **注意**: 如果您需要執行正式的遷移 (Migrations)，請使用 `npm run migrate:all`。但在開發初期，`push:all` 更為快速方便。

### 6. 啟動開發伺服器 (Start Development Server)

為了模擬生產環境的安全限制（如 Secure Cookies），我們使用本地 HTTPS 模式：

```bash
npm run dev:https
```

伺服器將啟動於: `https://localhost:3000`

---

## 📦 常用指令 (Scripts)

| 指令 | 說明 |
| :--- | :--- |
| `npm run dev:https` | 啟動本地開發伺服器 (HTTPS 模式，推薦) |
| `npm run dev` | 啟動本地開發伺服器 (HTTP 模式) |
| `npm run build` | 建置生產版本 |
| `npm run push:all` | 同步 Schema 到所有資料庫 (Auth + Shards) |
| `npm run migrate:all` | 執行所有資料庫的 Migration |
| `npm run studio:auth` | 開啟 Prisma Studio 查看 **Auth DB** (使用者資料) |
| `npm run studio:shard0` | 開啟 Prisma Studio 查看 **Shard 0** (應用資料) |
| `npm test` | 執行測試 (如有) |

## 🧪 測試帳號

如果您使用了預設的 Seed 資料，可以使用以下帳號登入（如果有執行 Seed）：
*   Email: `test@example.com`
*   Password: `password123`