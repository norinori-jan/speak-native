/**
 * speak-native / gas / Code.js
 * Google Apps Script — Speak Native 学習ログ同期
 *
 * デプロイ方法:
 * 1. script.google.com で新規プロジェクト作成
 * 2. このコードを貼り付け
 * 3. SPREADSHEET_ID を自分のスプレッドシートIDに変更
 * 4. デプロイ → ウェブアプリ → 「全員」にアクセス許可
 * 5. デプロイURLをアプリの設定 > GAS URL に貼り付け
 */

// ── 設定 ──────────────────────────────────────────
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ← 変更必須
const SHEET_HISTORY  = '学習履歴';
const SHEET_VOCAB    = '単語帳';
const SHEET_SUMMARY  = 'サマリー';

// ── エントリーポイント ──────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'english_log';

    if (action === 'english_log') {
      return handleEnglishLog(data);
    }
    return ok('unknown action');
  } catch(err) {
    return error(err.message);
  }
}

function doGet(e) {
  // GETリクエストでデータ取得（将来の拡張用）
  try {
    const action = e.parameter.action || 'get_summary';
    if (action === 'get_summary') return getSummary();
    if (action === 'get_vocab')   return getVocab();
    return ok('speak-native GAS OK');
  } catch(err) {
    return error(err.message);
  }
}

// ── 学習ログ処理 ────────────────────────────────────
function handleEnglishLog(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. 学習履歴シート
  const histSheet = getOrCreateSheet(ss, SHEET_HISTORY, ['日付', '正解数', '出題数', '正答率', '連続日数']);
  if (data.history && data.history.length > 0) {
    const lastRow = histSheet.getLastRow();
    const existing = lastRow > 1
      ? histSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String)
      : [];
    data.history.forEach(h => {
      if (!existing.includes(String(h.date))) {
        const pct = h.total > 0 ? Math.round(h.correct / h.total * 100) : 0;
        histSheet.appendRow([h.date, h.correct, h.total, pct + '%', data.streak || 0]);
      }
    });
  }

  // 2. 単語帳シート
  const vocabSheet = getOrCreateSheet(ss, SHEET_VOCAB, ['英語', '日本語', 'メモ', '登録日']);
  if (data.vocab && data.vocab.length > 0) {
    const lastRow = vocabSheet.getLastRow();
    const existing = lastRow > 1
      ? vocabSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String)
      : [];
    data.vocab.forEach(v => {
      if (!existing.includes(v.en)) {
        vocabSheet.appendRow([v.en, v.jp || '', v.note || '', v.date || new Date().toISOString().slice(0,10)]);
      }
    });
  }

  // 3. サマリーシート（最新状態を上書き）
  const sumSheet = getOrCreateSheet(ss, SHEET_SUMMARY, ['項目', '値', '更新日時']);
  sumSheet.clearContents();
  sumSheet.appendRow(['項目', '値', '更新日時']);
  const now = new Date().toLocaleString('ja-JP');
  sumSheet.appendRow(['連続日数', data.streak || 0, now]);
  sumSheet.appendRow(['単語数', (data.vocab || []).length, now]);
  sumSheet.appendRow(['学習日数', (data.history || []).length, now]);
  sumSheet.appendRow(['最終同期', data.timestamp || now, now]);

  return ok('synced');
}

// ── サマリー取得 ─────────────────────────────────────
function getSummary() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sumSheet = ss.getSheetByName(SHEET_SUMMARY);
  if (!sumSheet) return ok({ streak: 0, vocabCount: 0 });
  const rows = sumSheet.getDataRange().getValues();
  const result = {};
  rows.slice(1).forEach(r => { result[r[0]] = r[1]; });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 単語帳取得 ─────────────────────────────────────
function getVocab() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_VOCAB);
  if (!sheet || sheet.getLastRow() < 2) return ok({ vocab: [] });
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  const vocab = rows.map(r => ({ en: r[0], jp: r[1], note: r[2], date: r[3] })).filter(v => v.en);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, vocab }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ユーティリティ ────────────────────────────────────
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1a3a2a')
      .setFontColor('#5cefb0')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ok(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
