# 💰 MoneyFlow — Premium Student Financial Tracker

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter-7C3AED?style=for-the-badge&logo=google-gemini&logoColor=white" />
</div>

---

## ✨ Features

### 💎 Premium UI/UX Redesign
- **Animated Splash Screen**: A professional entry experience with bouncing logos and smooth transitions.
- **Diamond CTA Navigation**: A modern, rotated diamond "+" button for quick expense entry.
- **Glassmorphism Design**: Frosted glass effects, vibrant gradients, and premium typography (Sora & DM Sans).
- **Dynamic Dashboard**: Prominent balance cards, circular savings progress rings, and animated category breakdowns.

### 🤖 AI Financial Advisor
- Integrated with **Gemini via OpenRouter** to provide personalized financial tips.
- Analyzes your spending patterns and detects anomalies (e.g., spending > 2x your category average).
- Real-time budget alerts when you approach 80% of your limit.

### 📶 Smart Offline Sync
- **Built-in Offline Engine**: Powered by Firebase Firestore's persistent local cache (IndexedDB).
- **Zero Interruption**: Add transactions even without internet; they sync automatically as soon as you're back online.
- **Offline Banner**: Real-time connectivity tracking with the `useNetwork` hook.

### 📱 Core Capabilities
- **Multi-Account Tracking**: Manage Cash, Bank, and UPI balances separately.
- **Debt Tracker**: Keep track of what you owe or what others owe you.
- **Split Calculator**: Easily split bills with friends.
- **PDF Export**: Generate professional monthly expense reports.
- **PIN Lock**: Secure your data with a 4-digit PIN stored locally.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: Firebase Firestore
- **State Management**: Context API
- **AI**: OpenRouter (Gemini 2.5 Flash)
- **Authentication**: Custom Phone + Password auth with SHA-256 hashing

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/arabindakabiraj/moneyflow-xyz.vercel.app.git
cd moneyflow
npm install
```

### 2. Environment Variables
Create a `.env` file in the root:
```env
VITE_FIREBASE_API_KEY=YOUR_KEY
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
# ... other Firebase config variables
```

### 3. Run Locally
```bash
npm run dev
```

---

## 📸 Screenshots

*(Add your screenshots here)*

---

## 🔒 Security
- **No Firebase Auth needed**: Uses custom SHA-256 password hashing for maximum compatibility across environments.
- **Data Privacy**: All transaction data is stored securely in your private Firestore instance.
- **Local App Lock**: PIN protection using browser `localStorage`.

---

<div align="center">
  Made with ❤️ by <b>Arabinda Kabiraj</b>
</div>
