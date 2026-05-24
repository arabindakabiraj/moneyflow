# 💰 MoneyFlow V.2 — Premium AI-Powered Financial Tracking Ecosystem

<div align="center">

  [![React](https://img.shields.io/badge/React-18.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.43-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.5_Flash-9E5CF2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
  [![Capacitor Mobile](https://img.shields.io/badge/Capacitor-8.1-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![GSAP](https://img.shields.io/badge/GSAP-3.14-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
  [![Recharts](https://img.shields.io/badge/Recharts-3.7-22c55e?style=for-the-badge&logo=recharts&logoColor=white)](https://recharts.org/)

  <p align="center">
    <strong>A high-fidelity, mobile-first personal finance cockpit.</strong><br />
    Designed for students and modern users, combining premium liquid glass visuals, intelligent AI diagnostics, offline-first reliability, collaborative ledger linking, and corporate-grade reporting.
  </p>

  <h4>
    <a href="#-premium-ux--design-philosophy">UX Design</a> •
    <a href="#-core-architectural-features">Core Features</a> •
    <a href="#-security--cryptographic-design">Security Specs</a> •
    <a href="#-database-schema--rls-policies">Database Schema</a> •
    <a href="#-project-architecture">Architecture</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Installation</a> •
    <a href="#-supabase-local-cli-setup">Supabase Local Setup</a> •
    <a href="#-fastapi-otp-service-setup">OTP Backend</a> •
    <a href="#-capacitor-native-mobile-setup">Mobile Build</a>
  </h4>
</div>

---

## 💎 Premium UX & Design Philosophy

MoneyFlow V.2 delivers an organic, interactive dashboard designed to redefine personal finance interfaces:

*   **Liquid Glassmorphism**: High-depth visual containers featuring custom backdrop filters, translucent surface overlays, and color-coded shadows that adjust dynamically to light and dark configurations.
*   **GSAP-Powered Motion Choreography**: Smooth startup animation sequences and physics-informed splash screen transitions that provide fluid entry into the application dashboard.
*   **Diamond Quick Action HUD**: A distinctive, center-docked, 45-degree rotated diamond action trigger (`+`) enabling quick manually logged transactions on mobile screen configurations.
*   **Active Micro-Animations**: Spring-like UI feedback on inputs, tags, account selections, and navigation tabs.
*   **HSL Multi-Theme Customizer**: Real-time manipulation of CSS variables at the root element level, supporting 6 distinct theme configurations:
    1.  🌿 **Default Green**: Clean organic highlights with deep forest gradients.
    2.  🌙 **Midnight Blue**: Calm indigo backgrounds matching dark dashboard mockups.
    3.  🌹 **Rose Gold**: Premium copper-rose accent tones.
    4.  🌊 **Ocean Teal**: Vibrant maritime blue-green styling.
    5.  💜 **Purple Night**: Rich neon violet micro-accents.
    6.  🖤 **AMOLED Black**: True-black layouts optimized for OLED phone screens.

---

## 🚀 Core Architectural Features

### 🤖 AI Financial Intelligence (Gemini AI + OpenRouter)
*   **Context-Injected AI Advisor**: A chat interface ([AIChat.jsx](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/components/AIChat.jsx)) leveraging `google/gemini-2.5-flash` to act as an active assistant. The LLM receives contextual snapshots, including:
    *   Unified balance & individual account distributions (Cash, Bank, UPI).
    *   Category breakdown metrics and current budget configurations.
    *   Budget alarms (warning user if category utilization is $\ge 80\%$).
    *   Detected transaction anomalies or sudden spikes in spending.
    *   Last 6 months of historical income/expense trends.
    *   Last 20 transaction records and active debt ledgers.
*   **Multilingual Processing**: The assistant automatically detects and matches user language preferences (English, Bengali, Hindi, or mixed code-switching) to deliver actionable savings advice.
*   **Smart Add (Natural Language Parser)**: An inline entry panel ([SmartAdd.jsx](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/components/SmartAdd.jsx)) allowing users to speak or type transactions in natural phrases (e.g., *"yesterday spent 150 on pizza via UPI"*). The AI extracts:
    *   Transaction Type (`credit` vs. `debit`).
    *   Numerical value.
    *   Normalized description (translated to English).
    *   ISO Date formatting.
    *   Matched category selection.
    *   Account destination (`Cash`, `Bank`, or `UPI`).
*   **Word-Frequency Auto-Categorization**: An automatic tag classification engine ([autoCategory.js](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/utils/autoCategory.js)) that analyzes new transaction descriptions. It maps keywords based on user transaction histories or defaults to dictionary keyword arrays.

### 📶 Offline-First Synchronization & Caching
*   **Seamless Offline Persistence**: Leverages Supabase Client-side memory states integrated with responsive UI fallbacks. Read and write operations resolve immediately in memory and local storage, ensuring zero network latency.
*   **Connection State Hooks**: Tracks internet availability through a custom hook ([useNetwork.js](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/hooks/useNetwork.js)), showing system-wide connection toasts and automatically syncing actions upon reconnecting.

### 📊 Cash Flow, Heatmaps & Predictive Analytics
*   **GitHub-Style Expense Heatmap**: A visual calendar matrix ([ExpenseHeatmap.jsx](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/components/ExpenseHeatmap.jsx)) plotting daily spending volume. Levels are HSL color-graded relative to maximum daily expenditure:
    *   ⬜ *Gray*: No spending.
    *   🟢 *Light Green*: Low spending ($<15\%$).
    *   🟢 *Medium Green*: Moderate spending ($<35\%$).
    *   🟡 *Amber*: High spending ($<55\%$).
    *   🟠 *Orange*: Very high spending ($<75\%$).
    *   🔴 *Rose/Red*: Maximum spending ($\ge 75\%$).
*   **Recharts Analytics Dashboard**: Includes vector-based data visualizations:
    *   Weekly/Monthly bar comparisons of inflows and outflows.
    *   Cash Flow area charts mapping wealth accumulation over time.
    *   Day-of-Week bar charts showing spending patterns across the week.
    *   Category pie charts and vertical forecast summaries.
*   **Weighted Spending Forecasts**: A forecasting tool ([spendingPredictor.js](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/utils/spendingPredictor.js)) using weighted moving averages of the last 6 months (weighting recent months more heavily) to predict future spending.
*   **Daily Budget Allowance**: Computes real-time allowances based on current calendar days remaining and available budgets.

### 👥 Collaborative Bookkeeping
*   **Family Mode (Shared Finances)**: Links two user accounts via secure 6-character alphanumeric invite codes (`family_links` table). Links are verified in real time, unlocking:
    *   A shared family dashboard.
    *   Live queries of partner transactions.
    *   Single-pass combined income/expense summaries.
    *   Self-healing link termination if a partner unlinks.
*   **Split Bill Engine & Greedy Settlement Optimizer**: A bill-splitting module ([GroupExpenses.jsx](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/components/GroupExpenses.jsx)) for managing group transactions. It calculates optimal payments using a greedy debt minimization algorithm:
    1.  Computes net debt or credit positions for each group member.
    2.  Sorts members into debtors and creditors.
    3.  Iteratively settles largest outstanding debts, minimizing transactions.

### 💼 Ledger & Statement Generation
*   **Double-Entry Ledger Grid**: Displays a running balance history initialized from an Opening Balance and As-Of date setup configuration.
*   **Indian SMS Ingestion Parser**: Automatically extracts transactions from pasted bank notification strings (supports SBI, HDFC, ICICI, Axis, Kotak, GPay, Paytm, and PhonePe).
*   **Corporate-Grade PDF Statements**: Uses `jsPDF` and `jspdf-autotable` to compile records into PDF statements containing:
    *   Elegantly designed layout headers and metadata.
    *   Colored transaction type highlights.
    *   Summary cards for total inflows, outflows, and net balances.

---

## 🔒 Security & Cryptographic Design

*   **Zero-Trust Authentication**: Leverages custom client-side hashing ([authUtils.js](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/authUtils.js)) powered by PBKDF2/SHA-256 to hash password strings before Supabase authentication, ensuring plain passwords never transit the database.
*   **Security Lock Screen & Lockout**: A PIN entry system ([AppLock.jsx](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/components/AppLock.jsx)) storing SHA-256 hashes locally. Features include:
    *   Lockout timer: 30-second keypad lockout after 5 failed attempts.
    *   Idle auto-lock: Custom inactive timeouts monitored via mouse and scroll listeners.
*   **WebAuthn Biometrics**: Integrates Face ID / Touch ID using platform authenticator challenges, offering secure biometrics.
*   **MFA OtpGuard Verification**: Protects sensitive actions (e.g., base account adjustments, profile updates, deletions) behind a secondary validation step ([OtpGuardModal.jsx](file:///Users/arabindakabiraj/Documents/allProject%20/MoneyFlow/MoneyFlow%20V.2/src/components/OtpGuardModal.jsx)) powered by a FastAPI OTP engine.
*   **Account Life-Cycle Controls**: Supports:
    *   *Account Deactivation*: Hides personal profiles without deleting transactions.
    *   *Scheduled Deletion*: Configures a 30-day grace period, allowing users to cancel deletion on subsequent logins.
    *   *Permanent Purge*: Deletes authentication records, index mapping, and database collections via security definer PostgreSQL RPCs.

---

## 🗄️ Database Schema & RLS Policies

MoneyFlow V.2 is backed by Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables. 

### 1. Database Schema Diagram (Logical Structure)
```mermaid
erDiagram
    users ||--o| profiles : "has profile"
    users ||--o| settings : "configures"
    users ||--o{ transactions : "logs"
    users ||--o{ debts : "has debts"
    users ||--o{ goals : "sets goals"
    users ||--o{ bills : "receives bills"
    users ||--o{ recurring : "schedules recurring"
    users ||--o{ groups : "creates groups"
    users ||--o| phone_index : "indexes phone"
    users ||--o| family_links : "defines invite code"

    profiles {
        uuid id PK "auth.users(id) - Cascade"
        text username
        text email
        text phone
        text photo_url
        boolean deactivated
        timestamptz deactivated_at
        boolean deletion_scheduled
        timestamptz scheduled_deletion_at
        timestamptz created_at
        timestamptz updated_at
    }

    phone_index {
        text phone PK
        uuid uid FK "auth.users(id) - Cascade"
        text email
        timestamptz created_at
    }

    settings {
        uuid user_id PK "auth.users(id) - Cascade"
        jsonb budgets
        jsonb accounts
        jsonb finance
        jsonb family
        timestamptz created_at
        timestamptz updated_at
    }

    transactions {
        uuid id PK
        uuid user_id FK "auth.users(id) - Cascade"
        numeric amount
        text category
        text description
        text date "YYYY-MM-DD"
        text type "'credit' or 'debit'"
        text account "'Cash', 'Bank', or 'UPI'"
        boolean is_want
        timestamptz created_at
    }

    debts {
        uuid id PK
        uuid user_id FK "auth.users(id) - Cascade"
        text name
        numeric amount
        text type "'borrowed' or 'lent'"
        boolean repaid
        text date
        timestamptz created_at
    }

    goals {
        uuid id PK
        uuid user_id FK "auth.users(id) - Cascade"
        text name
        numeric target
        numeric current
        timestamptz created_at
    }

    bills {
        uuid id PK
        uuid user_id FK "auth.users(id) - Cascade"
        text due_date
        numeric amount
        boolean paid
        text description
        timestamptz created_at
    }

    recurring {
        uuid id PK
        uuid user_id FK "auth.users(id) - Cascade"
        numeric amount
        text description
        text category
        timestamptz created_at
    }

    groups {
        uuid id PK
        uuid user_id FK "auth.users(id) - Cascade"
        text name
        jsonb members
        jsonb expenses
        timestamptz created_at
    }

    family_links {
        text code PK "Alphanumeric Invite Code"
        uuid uid FK "auth.users(id) - Cascade"
        text name
        uuid linked_uid FK "auth.users(id) - Set Null"
        text linked_name
        timestamptz created_at
    }
```

### 2. Row Level Security (RLS) Policy Implementations
The PostgreSQL database enforces isolation using the following policies:

| Table | Policy Type | SQL Expression / Condition | Description |
| :--- | :--- | :--- | :--- |
| **`profiles`** | `SELECT` | `auth.uid() = id OR id = ((SELECT family->>'linkedUid' FROM settings WHERE user_id = auth.uid())::uuid)` | View own profile or linked family partner's profile. |
| | `UPDATE` | `auth.uid() = id` | Only own account owner can modify their profile data. |
| **`phone_index`**| `SELECT` | `true` | Public lookup allowing resolving phone number to email on sign-in. |
| | `ALL` | `auth.uid() = uid` | Full control for the phone owner. |
| **`settings`** | `SELECT` / `UPDATE` | `auth.uid() = user_id` | Restricts reading and writing settings only to the owner. |
| **`transactions`**| `SELECT` | `auth.uid() = user_id OR user_id = ((SELECT family->>'linkedUid' FROM settings WHERE user_id = auth.uid())::uuid)` | Read own transactions or linked family partner's transactions. |
| | `ALL` | `auth.uid() = user_id` | Only user can insert, delete, or update their transactions. |
| **`debts`** | `ALL` | `auth.uid() = user_id` | Restricted to account owner. |
| **`goals`** | `ALL` | `auth.uid() = user_id` | Restricted to account owner. |
| **`bills`** | `ALL` | `auth.uid() = user_id` | Restricted to account owner. |
| **`recurring`** | `ALL` | `auth.uid() = user_id` | Restricted to account owner. |
| **`groups`** | `ALL` | `auth.uid() = user_id` | Restricted to account owner. |
| **`family_links`**| `SELECT` / `UPDATE` | `true` | Allows handshake validation matching code between users. |
| | `ALL` | `auth.uid() = uid` | Full administration permissions restricted to invite initiator. |

### 3. Database Triggers & Functions
*   **User Provisioning Trigger (`on_auth_user_created`)**: Triggers `handle_new_user()` when a new user signs up via Supabase Auth. It inserts initial parameters into `profiles` and `settings`, and adds to `phone_index` if phone details are supplied.
*   **Phone Index Synchronization (`on_profile_phone_updated`)**: Triggers `handle_profile_phone_update()` to ensure changes in phone profile properties are immediately reflected in the sign-in routing index.
*   **Secure Permanent Purge (`delete_user()`)**: A Postgres security definer function allowing logged-in clients to delete their authentication accounts from `auth.users`, automatically clean-deleting all CASCADE data entries.

---

## 📂 Project Architecture

```
MoneyFlow V.2/
├── supabase/                   # Supabase Database configurations
│   ├── config.toml             # Local dev ports and auth configurations
│   └── migrations/             # Database DDL schemas and triggers
│       └── 20260524000000_schema.sql
├── public/                     # Static assets, SVG/PNG icons, webapp manifest
├── tailwind.config.js          # Custom glassmorphic color presets and variables
├── vite.config.js              # React bundle compilation pipeline with chunking
├── package.json                # Project dependencies and script runner commands
├── pnpm-workspace.yaml         # PNPM workspace package config
├── src/
│   ├── main.jsx                # Application mounting point
│   ├── App.jsx                 # Routing, active lock pads, and layout structure
│   ├── supabase.js             # Supabase Client connection and configuration setup
│   ├── authUtils.js            # Secure hashing operations (PBKDF2/SHA-256) and session storage
│   ├── constants.js            # Standard categories, icons, and HSL style variables
│   │
│   ├── context/
│   │   ├── AppContext.jsx      # Core state provider (CRUD, Supabase sync, AI prompts, and hooks)
│   │   └── ThemeContext.jsx    # Root HSL color style variable provider
│   │
│   ├── hooks/
│   │   ├── useNetwork.js       # Live online/offline browser state listener
│   │   ├── useNotifications.js # App-wide local notification manager
│   │   └── useInstallPrompt.js # PWA browser install prompt handler
│   │
│   ├── utils/
│   │   ├── smsParser.js        # Decodes bank transaction SMS copy-paste blocks
│   │   ├── autoCategory.js     # Transaction description auto-categorizer
│   │   ├── spendingPredictor.js# Calculates future spending forecasts and daily allowances
│   │   ├── pdfExport.js        # Generates structured PDF financial statements
│   │   └── csvExport.js        # Formats transactions into downloadable CSV strings
│   │
│   └── components/
│       ├── Header.jsx          # Top-bar showing user profile actions
│       ├── BottomNav.jsx       # Mobile tab selector layout
│       ├── DesktopSidebar.jsx  # Desktop sidebar navigation
│       ├── SplashScreen.jsx    # GSAP physics-informed intro animation panel
│       ├── AuthScreen.jsx      # Login, registration, and account recovery panel
│       ├── AppLock.jsx         # PIN pad interface with biometrics support
│       ├── OnboardingModal.jsx # New user wizard and product spotlight tour
│       ├── OtpGuardModal.jsx   # FastAPI MFA OTP entry overlay
│       ├── Dashboard.jsx       # Overview panel with charts and snapshot statistics
│       ├── Accounts.jsx        # Wallet balance manager
│       ├── AddTransaction.jsx  # Transaction editor with automated suggestions
│       ├── SmartAdd.jsx        # Natural language input panel with voice dictation
│       ├── Ledger.jsx          # Double-entry ledger list view
│       ├── Charts.jsx          # Full Recharts reporting dashboard
│       ├── ExpenseHeatmap.jsx  # GitHub-style grid and Day-of-Week breakdown
│       ├── GroupExpenses.jsx   # Greedy bill-splitting split calculator
│       ├── DebtTracker.jsx     # Borrowed and lent log
│       ├── SavingsGoals.jsx    # Long-term goals tracking
│       ├── BillReminders.jsx   # Upcoming bill reminders
│       ├── RecurringTransactions.jsx # Automatically generated transactions configuration
│       ├── SMSImport.jsx       # Interface for bulk SMS parsing
│       ├── FamilyMode.jsx      # Multi-account linking panel
│       ├── Settings.jsx        # App configuration, profiles, and security locks
│       └── ui/
│           ├── ActionButton.jsx # Rotated diamond HUD selector button
│           ├── Card.jsx         # Core layout component
│           ├── InsightCard.jsx  # Custom stat container
│           └── SkeletonLoader.jsx # Dashboard skeleton loader
```

---

## 🛠️ Tech Stack

### Frontend Core
*   **Runtime Library**: React 18.2 (Functional component architecture + React Hooks)
*   **Build Pipeline**: Vite 7.3 (Hot Module Replacement with rollup asset tree optimization)
*   **Styling Engine**: Tailwind CSS 3.3 + PostCSS (Modular system utilizing custom HSL properties)
*   **Animations**: GreenSock Animation Platform (GSAP 3.14) for splash animations

### Core Infrastructure
*   **Database & Auth**: Supabase 2.43 (PostgreSQL, Row Level Security, pg_transport)
*   **AI Gateway**: OpenRouter Endpoint integration targeting `google/gemini-2.5-flash`
*   **Visualizations**: Recharts 3.7 (Dynamic responsive charts)
*   **Native Wrapper**: Capacitor 8.1 (Platform compilation bridge for iOS/Android distribution)
*   **Document Generation**: jsPDF 4.2 + jsPDF-AutoTable 5.0 (Pixel-precise PDF reporting)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js (v18 or higher)](https://nodejs.org/) and the [pnpm package manager](https://pnpm.io/) installed.

### 2. Installation
Clone the repository and install dependencies using `pnpm`:
```bash
# Clone the repository
git clone https://github.com/arabindakabiraj/moneyflow-xyz.vercel.app.git

# Navigate into the project folder
cd "MoneyFlow V.2"

# Install node modules using pnpm
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Populate `.env` with your local or cloud Supabase credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_supabase_anon_key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# OpenRouter API Key (For Gemini AI financial diagnostics)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 4. Running the Development Server
Start the local development server:
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Compilation
Compile optimized production assets:
```bash
pnpm build
```

---

## 🐳 Supabase Local CLI Setup

To run the entire database environment locally using the Supabase CLI:

### 1. Initialize and Start Supabase
Ensure Docker is running on your machine, then run:
```bash
# Start local supabase services
npx supabase start
```
This launches Docker containers for the Postgres Database, Supabase Auth, Studio GUI, API gateway, and Realtime sync services.

*Local Service Access Info:*
*   **Supabase Studio GUI**: [http://localhost:54323](http://localhost:54323)
*   **API Gateway URL**: `http://localhost:54321`
*   **Database Port**: `54322`
*   **Local Email Testing (Inbucket)**: [http://localhost:54324](http://localhost:54324)

### 2. Run Database Migrations
Apply the schemas, triggers, and functions to your database:
```bash
# Apply schema migrations
npx supabase migration up
```

### 3. Seed Mock Data (Optional)
To load initial testing fixtures:
```bash
npx supabase db reset
```

---

## 🔒 FastAPI OTP Service Setup

MoneyFlow V.2 features a Multi-Factor Authentication (MFA) shield. To run this feature locally, you must launch the OTP verification backend:

### 1. Prerequisites
Ensure you have Python 3.10+ installed.

### 2. Start the FastAPI OTP Backend
Configure a local backend running at `http://localhost:8001/api/v1` that exposes the following endpoints:
*   `POST /api/v1/auth/register`: Auto-registers a user in the database.
*   `POST /api/v1/otp/send`: Generates and sends a 6-digit verification code.
*   `POST /api/v1/otp/verify`: Verifies the entered OTP code.
*   `GET /api/v1/otp/dev-latest?identifier={email}`: Returns the last generated code for local testing and autofill validation.

*Note: The frontend automatically detects development hostnames and enables an **Autofill Code** notification toast to streamline local testing.*

---

## 📱 Capacitor Native Mobile Setup

To build and compile native Android or iOS application wrappers:

### 1. Add Platform Containers
Initialize Capacitor mobile packages in your project:
```bash
# Install Capacitor packages
pnpm add @capacitor/core @capacitor/cli

# Add native project folders
pnpm cap add android
pnpm cap add ios
```

### 2. Synchronize Assets
Sync compiled web assets to native container folders after each build:
```bash
# Build Vite production bundles
pnpm build

# Sync assets to Capacitor platform directories
pnpm cap sync
```

### 3. Open Native IDE Containers
Open the projects in Android Studio or Xcode to compile and deploy to devices:
```bash
# Open project in Android Studio
pnpm cap open android

# Open project in Xcode
pnpm cap open ios
```

---

<div align="center">
  <sub>Designed and developed with ❤️ by <b>Arabinda Kabiraj</b></sub>
</div>
