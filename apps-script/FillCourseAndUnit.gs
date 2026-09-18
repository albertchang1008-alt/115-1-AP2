// 一次性工具，綁在你正在用的正式 Google Sheet 上執行（不是 CreateCourseTemplate.gs 那種「建立新檔」工具）。
// 用途：
//   1) 「課程代碼」欄：不存在就新增在最後一欄，存在則補空白列；整批填上你指定的課程代碼
//   2) 「單元」欄（僅題庫格式的分頁）：空白的列，用同一個「次單元」裡其他列已經填過的值自動帶入
// 只改你這份 Sheet 的內容（可能新增一欄），不會動到 Firestore、不會觸發同步。
// 建議跑之前先「檔案 > 建立副本」備份一次，跑完再回來對照。
//
// 會處理的分頁：看起來像名冊（有「學號」＋「姓名」欄）或像題庫（有「題目ID」＋「問題」＋「正確答案代碼」欄）的分頁；
// 其他分頁（例如說明頁、雙向細目表）不會被動到。
//
// 使用方式：
//   1. 開啟你的 Google Sheet →「擴充功能」→「Apps Script」
//   2. 左側檔案清單點「＋」新增一個指令碼檔案（保留原本既有的 Code.gs、version.gs 不動），
//      把這份內容整份貼上
//   3. 把下面 COURSE_ID 改成你的課程代碼（例如 'ap2-115-1'，只能中文、英數字、- 或 _，不能有空白）
//   4. 上方工具列的函式下拉選單選 fillCourseAndUnit，按執行；第一次執行會跳出授權視窗，照著同意即可
//   5. 會先跳出一個「即將修改哪些分頁」的確認視窗，按是才會真的動手；跑完再跳出結果視窗
//   6. 如果有「次單元」從頭到尾都沒有任何一列填過「單元」，會列在結果裡的「需要你手動決定」清單，
//      這種沒辦法自動帶，因為程式不知道你想歸在哪一類
//
// 這個檔案只在你這份 Sheet 的 Apps Script 專案裡執行，跟平台程式碼（Cloud Functions）是分開的兩件事，
// 執行前後都不需要碰程式、不需要部署。刻意不加選單（onOpen），避免跟既有的「課序題庫」選單衝突；
// 每次都用函式下拉選單手動執行即可。

const COURSE_ID = '請改成你的課程代碼'; // ← 先改這一行，再執行

const ALIASES = {
  課程代碼: ['課程代碼', '課程', 'courseId'],
  學號: ['學號', 'studentId'],
  姓名: ['姓名', 'name'],
  題目ID: ['題目ID', 'id', '題號'],
  問題: ['問題', 'text', '題幹', 'question'],
  正確答案代碼: ['正確答案代碼', 'answerCode'],
};

function findCol(headers, aliases) {
  for (let i = 0; i < aliases.length; i++) {
    const idx = headers.indexOf(aliases[i]);
    if (idx >= 0) return idx; // 0-based
  }
  return -1;
}

function fillCourseAndUnit() {
  const ui = SpreadsheetApp.getUi();
  if (COURSE_ID === '請改成你的課程代碼') {
    ui.alert('請先把檔案最上面的 COURSE_ID 改成你的課程代碼，再執行一次。');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const plans = [];

  ss.getSheets().forEach(function (sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length < 1) return;
    const headers = data[0];

    const isRoster = findCol(headers, ALIASES.學號) >= 0 && findCol(headers, ALIASES.姓名) >= 0;
    const isBank = findCol(headers, ALIASES.題目ID) >= 0 && findCol(headers, ALIASES.問題) >= 0 && findCol(headers, ALIASES.正確答案代碼) >= 0;
    if (!isRoster && !isBank) return; // 不是名冊也不是題庫格式的分頁，跳過（例如說明頁、細目表）

    plans.push({
      sheet: sheet,
      data: data,
      courseCol: findCol(headers, ALIASES.課程代碼), // -1 代表這個分頁要新增欄
      unitCol: headers.indexOf('單元'),
      subunitCol: headers.indexOf('次單元'),
      isBank: isBank,
    });
  });

  if (!plans.length) {
    ui.alert('這份 Sheet 沒有找到名冊格式（學號＋姓名）或題庫格式（題目ID＋問題＋正確答案代碼）的分頁，沒有東西可以補。');
    return;
  }

  const preview = plans.map(function (p) {
    let line = '分頁「' + p.sheet.getName() + '」：' + (p.courseCol === -1 ? '目前沒有「課程代碼」欄，會新增在最後一欄' : '課程代碼欄已存在，補空白列');
    if (p.isBank && p.unitCol >= 0 && p.subunitCol >= 0) line += '；會嘗試補齊「單元」欄空白';
    return line;
  }).join('\n');

  const confirm = ui.alert('即將修改這些分頁', preview + '\n\n課程代碼統一填「' + COURSE_ID + '」。要繼續嗎？', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  const report = [];
  plans.forEach(function (p) {
    const sheet = p.sheet;
    const data = p.data;
    let courseCol = p.courseCol;

    if (courseCol === -1) {
      const newColIndex = sheet.getLastColumn() + 1; // 1-based，加在最後一欄
      sheet.getRange(1, newColIndex).setValue('課程代碼');
      courseCol = newColIndex - 1; // 換回 0-based，對齊 data 陣列的欄位索引概念
    }

    let courseFilled = 0;
    let unitFilled = 0;
    const unitBySubunit = {}; // 次單元 -> 單元，從已經填好的列建立對照表
    const unresolvedSubunits = {}; // 找不到對照、需要人工決定的次單元

    if (p.isBank && p.unitCol >= 0 && p.subunitCol >= 0) {
      for (let r = 1; r < data.length; r++) {
        const u = String(data[r][p.unitCol] || '').trim();
        const su = String(data[r][p.subunitCol] || '').trim();
        if (su && u && !unitBySubunit[su]) unitBySubunit[su] = u;
      }
    }

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (row.every(function (v) { return v === ''; })) continue; // 整列空白，略過

      const existingCourse = courseCol < row.length ? String(row[courseCol] || '').trim() : '';
      if (!existingCourse) {
        sheet.getRange(r + 1, courseCol + 1).setValue(COURSE_ID);
        courseFilled++;
      }
      if (p.isBank && p.unitCol >= 0 && p.subunitCol >= 0) {
        const u = String(row[p.unitCol] || '').trim();
        const su = String(row[p.subunitCol] || '').trim();
        if (!u && su) {
          if (unitBySubunit[su]) {
            sheet.getRange(r + 1, p.unitCol + 1).setValue(unitBySubunit[su]);
            unitFilled++;
          } else {
            unresolvedSubunits[su] = true;
          }
        }
      }
    }

    let line = '分頁「' + sheet.getName() + '」：課程代碼補了 ' + courseFilled + ' 列';
    if (p.isBank && p.unitCol >= 0 && p.subunitCol >= 0) line += '，單元補了 ' + unitFilled + ' 列';
    const leftover = Object.keys(unresolvedSubunits);
    if (leftover.length) line += '\n　需要你手動決定「單元」的次單元（從沒有任何一列填過單元）：' + leftover.join('、');
    report.push(line);
  });

  ui.alert('補欄結果', report.join('\n\n'), ui.ButtonSet.OK);
  Logger.log(report.join('\n\n'));
}
