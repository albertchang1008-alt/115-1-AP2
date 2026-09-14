// 一次性工具，綁在你正在用的正式 Google Sheet 上執行（不是 CreateCourseTemplate.gs 那種「建立新檔」工具）。
// 用途：
//   1) 把空白的「課程代碼」欄，整批填上你指定的課程代碼
//   2) 把空白的「單元」欄，用同一個「次單元」裡其他列已經填過的值自動帶入
// 只改你這份 Sheet 的儲存格內容，不會動到 Firestore、不會觸發同步。
// 建議跑之前先「檔案 > 建立副本」備份一次，跑完再回來對照。
//
// 使用方式：
//   1. 開啟你的 Google Sheet →「擴充功能」→「Apps Script」
//   2. 新增一個檔案（或直接用一個空白檔案），把這份內容整份貼上
//   3. 把下面 COURSE_ID 改成你的課程代碼（例如 'ap2-115-1'，只能中文、英數字、- 或 _，不能有空白）
//   4. 上方工具列選函式 fillCourseAndUnit，按執行；第一次執行會跳出授權視窗，照著同意即可
//   5. 執行完會跳出結果視窗，列出每個分頁補了幾列；如果有「次單元」從頭到尾都沒有任何一列填過「單元」，
//      會列在「需要你手動決定」清單裡——這種沒辦法自動帶，因為程式不知道你想歸在哪一類
//
// 這個檔案只在你這份 Sheet 的 Apps Script 專案裡執行，跟平台程式碼（Cloud Functions）是分開的兩件事，
// 執行前後都不需要碰程式、不需要部署。

const COURSE_ID = '請改成你的課程代碼'; // ← 先改這一行，再執行

function fillCourseAndUnit() {
  const ui = SpreadsheetApp.getUi();
  if (COURSE_ID === '請改成你的課程代碼') {
    ui.alert('請先把檔案最上面的 COURSE_ID 改成你的課程代碼，再執行一次。');
    return;
  }
  const confirm = ui.alert(
    '即將修改這份 Sheet',
    '會把空白的「課程代碼」欄填上「' + COURSE_ID + '」，並把空白的「單元」欄依同一個次單元已填的值自動帶入。\n建議先確認你已經備份過。要繼續嗎？',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = [];

  ss.getSheets().forEach(function (sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return; // 沒有資料列，略過

    const headers = data[0];
    const col = function (name) { return headers.indexOf(name); }; // 找不到回傳 -1
    const courseCol = col('課程代碼');
    const unitCol = col('單元');
    const subunitCol = col('次單元');
    if (courseCol === -1 && unitCol === -1) return; // 這個分頁跟這兩件事都無關，略過（例如說明頁）

    let courseFilled = 0;
    let unitFilled = 0;
    const unitBySubunit = {}; // 次單元 -> 單元，從已經填好的列建立對照表
    const unresolvedSubunits = {}; // 找不到對照、需要人工決定的次單元

    if (unitCol !== -1 && subunitCol !== -1) {
      for (let r = 1; r < data.length; r++) {
        const u = String(data[r][unitCol] || '').trim();
        const su = String(data[r][subunitCol] || '').trim();
        if (su && u && !unitBySubunit[su]) unitBySubunit[su] = u;
      }
    }

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (row.every(function (v) { return v === ''; })) continue; // 整列空白，略過

      if (courseCol !== -1 && !String(row[courseCol] || '').trim()) {
        sheet.getRange(r + 1, courseCol + 1).setValue(COURSE_ID);
        courseFilled++;
      }
      if (unitCol !== -1 && subunitCol !== -1) {
        const u = String(row[unitCol] || '').trim();
        const su = String(row[subunitCol] || '').trim();
        if (!u && su) {
          if (unitBySubunit[su]) {
            sheet.getRange(r + 1, unitCol + 1).setValue(unitBySubunit[su]);
            unitFilled++;
          } else {
            unresolvedSubunits[su] = true;
          }
        }
      }
    }

    let line = '分頁「' + sheet.getName() + '」：課程代碼補了 ' + courseFilled + ' 列，單元補了 ' + unitFilled + ' 列';
    const leftover = Object.keys(unresolvedSubunits);
    if (leftover.length) {
      line += '\n　需要你手動決定「單元」的次單元（從沒有任何一列填過單元）：' + leftover.join('、');
    }
    report.push(line);
  });

  const msg = report.length ? report.join('\n\n') : '這份 Sheet 找不到「課程代碼」或「單元」欄，沒有東西可以補。';
  ui.alert('補欄結果', msg, ui.ButtonSet.OK);
  Logger.log(msg);
}

// 選單方便之後重複打開，不強制使用
function onOpen() {
  SpreadsheetApp.getUi().createMenu('題庫小工具').addItem('補課程代碼與單元欄', 'fillCourseAndUnit').addToUi();
}
