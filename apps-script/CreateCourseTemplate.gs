// 範本產生工具：只建立新檔，不改動任何現有試算表。
// 這不是同步程式；同步仍由 Firebase Cloud Functions 讀取。
function createCoursePlatformTemplate() {
  var file = SpreadsheetApp.create('課序－課程題庫與名冊範本');
  var roster = file.getSheets()[0]; roster.setName('名冊');
  roster.getRange(1, 1, 1, 6).setValues([['課程代碼', '班級代碼', '學號', '姓名', '學校信箱', '啟用']]);
  roster.setFrozenRows(1); roster.getRange('A:E').setNumberFormat('@');
  roster.getRange('F2:F1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['TRUE', 'FALSE'], true).build());
  var bank = file.insertSheet('題庫');
  // 單元＝大分類（純顯示分組）；次單元＝真正的題庫單位，對應平台 unitId。
  // 題序：發布前依此欄穩定排序，Sheet 上排序或插入列不會換題庫版本。
  // 啟用：留空或 TRUE 都會出題；FALSE 的列同步時直接略過，不必刪列。
  var headers = ['課程代碼','題目ID','單元','次單元','題序','啟用','題型','問題','選項A','選項B','選項C','選項D','解答','解析','①先想關鍵字','②提問鏈','③回頭選答案','④一句話記憶','⑤追溯原子卡','圖片網址','講義標題','講義連結','補救資源'];
  bank.getRange(1,1,1,headers.length).setValues([headers]); bank.setFrozenRows(1);
  bank.getRange('A:B').setNumberFormat('@');
  bank.getRange('F2:F1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['TRUE', 'FALSE'], true).build());
  bank.getRange('G2:G1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['單選','圖片'], true).build());
  bank.getRange('M2:M1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['A','B','C','D'], true).build());
  [roster, bank].forEach(function(sheet) { sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight('bold').setBackground('#dbeafe'); sheet.autoResizeColumns(1,sheet.getLastColumn()); });
  Logger.log(file.getUrl());
  return file.getUrl();
}
