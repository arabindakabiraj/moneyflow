/**
 * ============================================================
 *  MoneyFlow — Google Apps Script Backend (Code.gs)
 *  Google Sheets কে Database হিসেবে ব্যবহার করার জন্য
 *
 *  HOW TO USE:
 *  1. Google Sheets খুলুন → Extensions → Apps Script
 *  2. এই সম্পূর্ণ কোড Code.gs তে পেস্ট করুন
 *  3. SPREADSHEET_ID টি আপনার Sheet এর ID দিয়ে বদলান
 *  4. Deploy → New Deployment → Web App → Execute as "Me" → Anyone → Deploy
 *  5. Web App URL কপি করে .env এ VITE_GAS_URL হিসেবে রাখুন
 * ============================================================
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Transactions';

const COL = { ID:0, DATE:1, DESC:2, AMOUNT:3, TYPE:4, CAT:5, ACC:6, WANT:7, CREATED:8 };

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function initSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['ID','Date','Description','Amount','Type','Category','Account','IsWant','CreatedAt'];
    sheet.appendRow(headers);
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setBackground('#22c55e');
    hr.setFontColor('#ffffff');
    hr.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// GET: সব transactions ফেরত দাও
function doGet(e) {
  try {
    const sheet = initSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse({ success: true, data: [] });
    const transactions = data.slice(1).map(row => ({
      id: row[COL.ID].toString(),
      date: row[COL.DATE],
      description: row[COL.DESC],
      amount: Number(row[COL.AMOUNT]),
      type: row[COL.TYPE],
      category: row[COL.CAT],
      account: row[COL.ACC],
      isWant: row[COL.WANT] === true || row[COL.WANT] === 'true',
      createdAt: row[COL.CREATED],
    })).filter(t => t.id);
    return createResponse({ success: true, data: transactions });
  } catch(err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

// POST: add/update/delete
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'add') return addTx(body);
    if (body.action === 'update') return updateTx(body);
    if (body.action === 'delete') return deleteTx(body);
    return createResponse({ success: false, error: 'Unknown action' });
  } catch(err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

function addTx(data) {
  const sheet = initSheet();
  const row = [
    data.id || Date.now().toString(),
    data.date, data.description,
    Number(data.amount), data.type,
    data.category || 'Others',
    data.account || 'Cash',
    data.isWant || false,
    new Date().toISOString()
  ];
  sheet.appendRow(row);
  sheet.getRange(sheet.getLastRow(), COL.AMOUNT+1).setNumberFormat('"Rs."#,##0.00');
  return createResponse({ success: true, id: row[0] });
}

function updateTx(data) {
  const sheet = initSheet();
  const all = sheet.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (all[i][COL.ID].toString() === data.id.toString()) {
      sheet.getRange(i+1, 1, 1, 9).setValues([[
        data.id, data.date, data.description,
        Number(data.amount), data.type,
        data.category, data.account,
        data.isWant || false,
        all[i][COL.CREATED]
      ]]);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: 'Not found' });
}

function deleteTx(data) {
  const sheet = initSheet();
  const all = sheet.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (all[i][COL.ID].toString() === data.id.toString()) {
      sheet.deleteRow(i+1);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: 'Not found' });
}
