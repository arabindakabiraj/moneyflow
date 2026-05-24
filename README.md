# 💰 MoneyFlow V.2 — Premium AI-Powered Financial Tracking Ecosystem

<div align="center">

  [![React](https://img.shields.io/badge/React-18.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.9-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
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
    <a href="#-architectural-features">Core Features</a> •
    <a href="#-security--encryption">Security Specs</a> •
    <a href="#-project-architecture">Architecture</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Installation</a> •
    <a href="#-fastapi-otp-service-setup">OTP Backend</a> •
    <a href="#-capacitor-native-mobile-setup">Mobile Build</a>
  </h4>
</div>

---

## 💎 Premium UX & Design Philosophy

MoneyFlow V.2 moves away from standard spreadsheet interfaces, delivering an organic, interactive dashboard inspired by modern financial apps:

*   **Liquid Glassmorphism**: High-depth visual containers featuring custom backdrop filters, translucent surface overlays, and color-coded shadows that adjust dynamically to light and dark configurations.
*   **GSAP-Powered Motion Choreography**: Smooth startup animation sequences and physics-informed splash screen transitions that provide fluid entry into the application dashboard.
*   **Diamond Quick Action HUD**: A distinctive, center-docked, 45-degree rotated diamond action trigger (`+`) enabling quick manually logged transactions on mobile screen orientations.
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
*   **Context-Injected AI Advisor**: A chat interface (`AIChat.jsx`) leveraging `google/gemini-2.5-flash` to act as an active assistant. The LLM receives contextual snapshots, including:
    *   Unified balance & individual account distributions.
    *   Category breakdown metrics.
    *   Budget alarms (threshold utilization $\ge$ 80%).
    *   Detected transaction anomalies.
    *   Last 6 months of historical income/expense trends.
    *   Last 20 transaction records and active debt ledgers.
*   **Multilingual Processing**: The assistant automatically detects and matches user language preferences (English, Bengali, Hindi, or mixed code-switching) to deliver actionable savings advice.
*   **Smart Add (Natural Language Parser)**: An inline entry panel (`SmartAdd.jsx`) allowing users to speak or type transactions in natural phrases (e.g., *"yesterday spent 150 on pizza via UPI"*). The AI extracts:
    *   Transaction Type (`credit` vs. `debit`).
    *   Numerical value.
    *   Normalized description (translated to English).
    *   ISO Date formatting.
    *   Matched category selection.
    *   Account destination (`Cash`, `Bank`, or `UPI`).
*   **Word-Frequency Auto-Categorization**: An automatic tag classification engine (`autoCategory.js`) that analyzes new transaction descriptions. It maps keywords based on user transaction histories or defaults to dictionary keyword arrays.

### 📶 Offline-First Synchronization (IndexedDB Cache)
*   **Zero-Network Latency**: Uses Firestore's `persistentLocalCache` and `persistentMultipleTabManager` to store all data in local IndexedDB directories. Reads/writes resolve immediately without network roundtrips.
*   **Auto-Conflict Resolution**: Queued operations apply locally and sync to the cloud database automatically when connection states toggle.
*   **Connectivity Hooks**: Tracks internet availability through a custom hook (`useNetwork.js`), showing system-wide connection toasts.

### 📊 Cash Flow, Heatmaps & Predictive Analytics
*   **GitHub-Style Expense Heatmap**: A visual calendar matrix (`ExpenseHeatmap.jsx`) plotting daily spending volume. Levels are HSL color-graded relative to maximum daily expenditure:
    *   ⬜ *Gray*: No spending.
    *   🟢 *Light Green*: Low spending ($<15\%$).
    *   🟢 *Medium Green*: Moderate spending ($<35\%$).
    *   🟡 *Amber*: High spending ($<55\%$).
    *   🟠 *Orange*: Very high spending ($<75\%$).
    *   🔴 *Rose/Red*: Maximum spending ($ge 75\%$).
*   **Recharts Analytics Dashboard**: Includes vector-based data visualizations:
    *   Weekly/Monthly bar comparisons of inflows and outflows.
    *   Cash Flow area charts mapping wealth accumulation over time.
    *   Day-of-Week bar charts showing spending patterns across the week.
    *   Category pie charts and vertical forecast summaries.
*   **Weighted Spending Forecasts**: A forecasting tool (`spendingPredictor.js`) using weighted moving averages of the last 6 months (weighting recent months more heavily) to predict future spending.
*   **Daily Budget Allowance**: Computes real-time allowances based on current calendar days remaining and available budgets.

### 👥 Collaborative Bookkeeping
*   **Family Mode (Shared Finances)**: Links two user accounts via secure 6-character alphanumeric invite codes (`familyLinks` collection). Links are verified in real time, unlocking:
    *   A shared family dashboard.
    *   Live queries of partner transactions.
    *   Single-pass $O(N)$ combined income/expense summaries.
    *   Self-healing link termination if a partner unlinks.
*   **Split Bill Engine & Greedy Settlement Optimizer**: A bill-splitting module (`GroupExpenses.jsx`) for managing group transactions. It calculates optimal payments using a greedy debt minimization algorithm:
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

*   **Zero-Trust Authentication**: Leverages custom client hashing (`authUtils.js`) powered by PBKDF2/SHA-256 to hash password strings before Firebase authentication, ensuring plain passwords never transit the database.
*   **Security Lock Screen & Lockout**: A PIN entry system (`AppLock.jsx`) storing SHA-256 hashes locally. Features include:
    *   Lockout timer: 30-second keypad lockout after 5 failed attempts.
    *   Idle auto-lock: Custom inactive timeouts monitored via mouse and scroll listeners.
*   **WebAuthn Biometrics**: Integrates Face ID / Touch ID using platform authenticator challenges, offering secure biometrics.
*   **MFA OtpGuard Verification**: Protects sensitive actions (e.g., base account adjustments, account deactivations, deletions) behind a secondary validation step (`OtpGuardModal.jsx`) powered by a FastAPI OTP engine.
*   **Account Life-Cycle Controls**: Supports:
    *   *Account Deactivation*: Hides personal profiles without deleting transactions.
    *   *Scheduled Deletion*: Configures a 30-day grace period, allowing users to cancel deletion on subsequent logins.
    *   *Permanent Purge*: Deletes authentication records, index mapping, and Firestore collections.

---

## 📂 Project Architecture

```
MoneyFlow V.2/
├── public/                     # Static assets, SVG/PNG icons, webapp manifest
├── firestore.rules             # Granular user collection verification rules
├── firebase.json               # Firebase SDK deployment configuration
├── tailwind.config.js          # Custom glassmorphic color presets
├── vite.config.js              # React bundle compilation pipeline configuration
├── package.json                # Project dependencies and script runner commands
├── src/
│   ├── main.jsx                # Application mounting point
│   ├── App.jsx                 # Routing logic, active app-locks, and layout structure
│   ├── firebase.js             # Firestore initialization & offline persistence setup
│   ├── authUtils.js            # Authentication logic and SHA-256 PIN hashing helpers
│   ├── constants.js            # Standard category listings and system configurations
│   │
│   ├── context/
│   │   ├── AppContext.jsx      # Core state provider (CRUD utilities, AI prompts, and hooks)
│   │   └── ThemeContext.jsx    # Real-time multi-theme customizer
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
│           └── SkeletonLoader.jsx# Dashboard skeleton loader
```

---

## 🛠️ Tech Stack

### Frontend Core
*   **Runtime Library**: React 18.2 (Functional component architecture + React Hooks)
*   **Build Pipeline**: Vite 7.3 (Hot Module Replacement with rollup asset tree optimization)
*   **Styling Engine**: Tailwind CSS 3.3 + PostCSS (Modular system utilizing custom HSL properties)
*   **Animations**: GreenSock Animation Platform (GSAP 3.14) for splash animations

### Core Infrastructure
*   **Database & Auth**: Firebase 12.9 (Cloud Firestore with IndexedDB cache + Firebase Client Authentication)
*   **AI Gateway**: OpenRouter Endpoint integration targeting `google/gemini-2.5-flash`
*   **Visualizations**: Recharts 3.7 (Dynamic responsive charts)
*   **Native Wrapper**: Capacitor 8.1 (Platform compilation bridge for iOS/Android distribution)
*   **Document Generation**: jsPDF 4.2 + jsPDF-AutoTable 5.0 (Pixel-precise PDF reporting)

---

## 🚀 Getting Started

### 1. Prerequisites
Verify that [Node.js (v18 or higher)](https://nodejs.org/) is installed on your local development machine.

### 2. Installation
Clone the repository and install the project dependencies:
```bash
# Clone the repository
git clone https://github.com/arabindakabiraj/moneyflow-xyz.vercel.app.git

# Navigate into the project folder
cd "MoneyFlow V.2"

# Install node modules
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory using the `.env.example` template:
```bash
cp .env.example .env
```

Populate the `.env` file with your credentials:
```env
# OpenRouter API Integration Configuration
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Firebase Web Application Client Configurations
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Running the Development Server
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Compilation
Compile optimized production assets:
```bash
npm run build
```

---

## 🔒 FastAPI OTP Service Setup

MoneyFlow V.2 features a Multi-Factor Authentication (MFA) shield. To run this feature locally, you must run the OTP verification backend:

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
npm install @capacitor/core @capacitor/cli

# Add native project folders
npx cap add android
npx cap add ios
```

### 2. Synchronize Assets
Sync compiled web assets to native container folders after each build:
```bash
# Build Vite production bundles
npm run build

# Sync assets to Capacitor platform directories
npx cap sync
```

### 3. Open Native IDE Containers
Open the projects in Android Studio or Xcode to compile and deploy to devices:
```bash
# Open project in Android Studio
npx cap open android

# Open project in Xcode
npx cap open ios
```

---

<div align="center">
  <sub>Designed and developed with ❤️ by <b>Arabinda Kabiraj</b></sub>
</div>
