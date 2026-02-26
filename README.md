# 💰 MoneyFlow — Student Financial Tracker

> React + Vite + Tailwind CSS + Google Sheets + Gemini AI

---

## 🚀 Quick Start

### Step 1: Project Setup
```bash
# Project ফোল্ডারে যান
cd moneyflow

# Dependencies install করুন
npm install

# .env ফাইল তৈরি করুন
cp .env.example .env
```

### Step 2: Google Sheets Database Setup

1. **নতুন Google Sheet তৈরি করুন**: [sheets.google.com](https://sheets.google.com)
2. URL থেকে **Spreadsheet ID** নিন:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_ID]/edit
   ```
3. **Extensions → Apps Script** ক্লিক করুন
4. `google-apps-script/Code.gs` ফাইলের সম্পূর্ণ কোড পেস্ট করুন
5. কোডে `YOUR_SPREADSHEET_ID_HERE` আপনার ID দিয়ে বদলান
6. **Save** করুন (Ctrl+S)

### Step 3: Deploy Google Apps Script

1. Apps Script এ **Deploy → New Deployment** ক্লিক করুন
2. Type: **Web App** সিলেক্ট করুন
3. Execute as: **Me** সিলেক্ট করুন
4. Who has access: **Anyone** সিলেক্ট করুন
5. **Deploy** ক্লিক করুন
6. **Web App URL** কপি করুন (https://script.google.com/macros/s/.../exec)

### Step 4: Configure .env

`.env` ফাইল খুলুন এবং GAS URL বসান:
```env
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 5: Gemini API Key Setup

1. [aistudio.google.com](https://aistudio.google.com) এ যান
2. **Get API Key → Create API Key** ক্লিক করুন
3. Key কপি করুন
4. `.env` ফাইলে যোগ করুন:
```env
VITE_GEMINI_API_KEY=AIzaSyYOUR_KEY_HERE
```

### Step 6: Run the App
```bash
npm run dev
```
Browser এ **http://localhost:5173** খুলুন।

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| 💰 Credit/Debit | Income ও Expense ট্র্যাক |
| 🏦 Account Types | Cash ও Bank আলাদা |
| 🏷️ Categories | Tiffin, Books, Travel, Tuition, Others |
| ✅ Need vs Want | প্রতিটি খরচ চিহ্নিত করুন |
| 🐷 Piggy Bank | মাসিক সঞ্চয়ের লক্ষ্য |
| 📅 Date Filter | দিন বা মাস অনুযায়ী ফিল্টার |
| 🤖 AI Advisor | Gemini দিয়ে আর্থিক পরামর্শ |
| 📄 PDF Export | Monthly statement ডাউনলোড |
| 🌙 Dark Mode | চোখ আরামদায়ক থিম |

---

## 🔧 Build for Production
```bash
npm run build
npm run preview
```

## 🌐 Deploy (Vercel)
```bash
npm install -g vercel
vercel --env VITE_GAS_URL=... --env VITE_GEMINI_API_KEY=...
```
