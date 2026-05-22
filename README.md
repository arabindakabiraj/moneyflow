# 💰 MoneyFlow V.2 — Premium AI-Powered Financial Tracker

<div align="center">

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
  [![Gemini AI](https://img.shields.io/badge/Gemini_AI-9E5CF2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
  [![Capacitor Mobile](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)

  <p align="center">
    A premium, state-of-the-art mobile-first personal finance tracking ecosystem. Built for modern users and students, combining beautiful fluid visuals, intelligent AI insights, offline-first reliability, and full-spectrum financial analytics.
  </p>

  <h4>
    <a href="#-core-capabilities">Key Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Installation</a> •
    <a href="#-capacitor-native-mobile-setup">Mobile Build</a> •
    <a href="#-security-design">Security</a>
  </h4>
</div>

---

## 💎 Premium Design Philosophy & UX

MoneyFlow V.2 is crafted from the ground up to feel **premium, organic, and ultra-modern**. It rejects standard, boring spreadsheets in favor of a responsive interface that feels alive:
*   **GSAP-Powered Motion Design**: A professional entry experience featuring a smooth, physics-informed splash screen with bouncy transitions.
*   **Curated HSL Color System & Dark Aesthetics**: Elegant deep backgrounds matched with harmoniously balanced gradient highlight colors.
*   **Diamond Action HUD**: A distinctive center-docked, rotated diamond dynamic action button (`+`) for lightning-fast expense logging.
*   **Interactive Micro-Animations**: Buttons, inputs, tab transitions, and cards react organically using custom spring-like hover and active transitions.
*   **Responsive Fluid Layouts**: Native look-and-feel whether viewed on a desktop browser, a PWA install, or wrapped inside a native iOS/Android shell.

---

## 🚀 Core Capabilities

### 🤖 AI Financial Intelligence & Advisor
*   **Interactive AI Chat Companion**: An integrated chat interface powered by **Gemini (via OpenRouter or native Gemini API)** to provide contextual financial wisdom, custom savings strategies, and spending analysis.
*   **Smart SMS Import**: Scan and parse transaction SMS alerts seamlessly with our built-in pattern matching parser, translating text messages into structured records.
*   **Natural Language Entry (Smart Add)**: Input expenses by typing human sentences (e.g., *"Spent 150 on coffee with Raj today"*) — parsed dynamically to extract value, description, and automatically categorize using automated dictionary clustering.
*   **Anomaly & Spending Predictors**: AI monitors spending history to identify deviations, warn when you approach 80% of category limits, and predict end-of-month cash flow using behavioral tracking algorithms.

### 📶 Offline-First Smart Sync
*   **Built-in Offline Engine**: Persistent cached local database using Firebase Firestore's local cache (IndexedDB) for zero-lag performance even on poor networks.
*   **Automatic Conflict Resolution**: Queue offline modifications instantly. Records sync cleanly to the cloud database as soon as network state switches back.
*   **Real-time Network Tracking**: A custom reactive hook (`useNetwork.js`) tracks online/offline states to display elegant micro-toasts and persistent banners.

### 📊 Professional Analytics & Heatmaps
*   **Interactive Recharts Dashboard**: Visualize categories, cash inflows, and monthly spending profiles with custom animated charts, circular savings progress rings, and interactive legends.
*   **Expense Density Heatmap**: Identify calendar days of high-volume transactions via an interactive visual calendar-style density map.
*   **Budget vs. Actual Trackers**: Set rigid financial boundaries per category and visual indicator bars showing real-time utilization.

### 💼 Comprehensive Ledger & Split Tools
*   **Multi-Account Ledger**: Manage Cash, Bank accounts, credit lines, and UPI accounts independently with total unified net-worth calculations.
*   **Split Bill Engine & Groups**: Complete group management to track complex shared expenses, calculate optimized debt structures (who owes whom), and send reminder indicators.
*   **Structured Debts Tracker**: Separate record logs for money borrowed or lent with automated calculation of net balances.
*   **Savings Goals & Progress Rings**: Set long-term target pools, associate transactions with them, and track savings streaks.
*   **EMI & Bill Reminder Dashboards**: Track recurring debts, calculate loan payments, and set future payment reminders.

---

## 🛠️ Tech Stack

MoneyFlow V.2 features a lightweight yet incredibly robust modern runtime environment:

*   **Runtime & Framework**: [React 18](https://react.dev/) + [Vite 7](https://vitejs.dev/) (lightning-fast HMR and optimized builds)
*   **Styling & Icons**: [Tailwind CSS 3](https://tailwindcss.com/) with native variables, glassmorphism, and [Lucide Icons](https://lucide.dev/)
*   **Animations**: [GreenSock Animation Platform (GSAP)](https://greensock.com/gsap/) for smooth splash screens
*   **Database & Core Engine**: [Firebase 12 (Firestore)](https://firebase.google.com/) configured with offline persistent caching
*   **Interactive Visualization**: [Recharts 3](https://recharts.org/) for vector-perfect, responsive canvas charts
*   **Mobile Wrapper**: [Capacitor 8](https://capacitorjs.com/) enabling cross-platform iOS & Android deployments
*   **PDF Generation**: [jsPDF 4](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) for pixel-perfect PDF financial statements

---

## 📂 Project Architecture

```
MoneyFlow V.2/
├── public/                 # Static assets & manifest files
├── src/
│   ├── App.jsx             # Root layout, router, global PIN locks, and tab layout coordinator
│   ├── main.jsx            # React root DOM initialization
│   ├── authUtils.js        # PBKDF2/SHA-256 custom cryptographic hashing library
│   ├── firebase.js         # Firebase initialization & Offline Firestore config
│   ├── constants.js        # Global static financial options and styles
│   ├── components/         # Premium reusable functional views
│   │   ├── ui/             # Core UI atoms & glass wrappers
│   │   ├── AIChat.jsx      # Gemini interactive chatbot interface
│   │   ├── Accounts.jsx    # Bank, UPI, and Cash balance coordinator
│   │   ├── AddTransaction. # Dynamic debit/credit forms with interactive modifiers
│   │   ├── AppLock.jsx     # Safe PIN Lock & auto-timeout lock UI
│   │   ├── AuthScreen.jsx  # Elegant phone-password hybrid signup/signin
│   │   ├── Charts.jsx      # Interactive Recharts analytics dashboard
│   │   ├── DebtTracker.jsx # Borrowed & lent record keeper
│   │   ├── ExpenseHeatmap. # Multi-scale visual transaction calendar density map
│   │   ├── GroupExpenses.jsx # Advanced bill-split engine & balance optimizer
│   │   ├── Settings.jsx    # Security presets, profile configs, export utilities
│   │   └── ... (additional feature components)
│   ├── context/
│   │   ├── AppContext.jsx  # Main state engine, CRUD modifiers, and Firebase queries
│   │   └── ThemeContext.js # Multi-theme switching coordinator (Glass, Dark, HSL presets)
│   ├── hooks/
│   │   ├── useNetwork.js   # Live online/offline browser state listener
│   │   ├── useNotifications.js # App-wide local notification manager
│   │   └── useInstallPrompt.js # PWA browser install handler
│   └── utils/
│       ├── autoCategory.js # Keywords mapping & auto-classifier algorithm
│       ├── smsParser.js    # Decodes regular transactional SMS syntax patterns
│       └── pdfExport.js    # Formats statements into clean, structured tables
```

---

## 🔒 Security Design

*   **Zero-Trust Authentication**: By using custom cryptographic hashing (`authUtils.js`) powered by PBKDF2/SHA-256 on password strings before database submissions, plain passwords never reach the database.
*   **Contextual Auto-AppLock**: A local security overlay prompts for a 4-digit PIN stored securely in the local context.
*   **Activity Auto-Lock Timer**: Tracks mouse moves, scrolls, and visibility toggles to automatically lock the workspace after standard idle durations.

---

## 🚀 Getting Started

### 1. Prerequisite Installations
Ensure you have [Node.js (v18 or higher)](https://nodejs.org/) installed on your local computer.

### 2. Project Download & Dependencies
Clone the repository and install npm dependencies:
```bash
# Clone the repository
git clone https://github.com/arabindakabiraj/moneyflow-xyz.vercel.app.git

# Move into the folder
cd "MoneyFlow V.2"

# Install node dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory. You can copy `.env.example` as a starting template:
```bash
cp .env.example .env
```
Populate the file with your keys:
```env
# Google Apps Script Web App Integration (Optional backup)
VITE_GAS_URL=your_gas_web_app_url_here

# Native Gemini API Integration (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter Integration Key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Firebase Web Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Development Server
Run the local dev engine:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### 5. Production Compilation
Create an optimized production bundle:
```bash
npm run build
```

---

## 📱 PWA & Capacitor Native Mobile Setup

MoneyFlow V.2 is pre-configured with **CapacitorJS**, making it extremely simple to deploy onto mobile operating systems:

### Initializing Mobile Frameworks
```bash
# Initialize Android platform wrapper
npx cap add android

# Initialize iOS platform wrapper
npx cap add ios
```

### Compiling and Synchronizing
Whenever you build your frontend bundle, sync the assets to the native shells:
```bash
# Build the production react bundles
npm run build

# Synchronize resources with Capacitor
npx cap sync
```

### Opening IDE Native Projects
Open the native container directly inside Xcode or Android Studio:
```bash
# Launch Android Studio
npx cap open android

# Launch Xcode
npx cap open ios
```

---

## 📸 Interface Captures
*(Place your dynamic app walkthrough GIFs or PNG mockups here to display the gorgeous visual glassmorphism UI!)*

---

<div align="center">
  <sub>Designed with ❤️ by <b>Arabinda Kabiraj</b></sub>
</div>
