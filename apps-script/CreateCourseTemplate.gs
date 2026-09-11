// 範本產生工具：只建立新檔，不改動任何現有試算表。
// 這不是同步程式；同步仍由 Firebase Cloud Functions 讀取。
function createCoursePlatformTemplate() {
  var file = SpreadsheetApp.create('課序－課程題庫與名冊範本');
  var roster = file.getSheets()[0]; roster.setName('名冊');
  roster.getRange(1, 1, 1, 6).setValues([['課程代碼', '班級代碼', '學號', '姓名', '學校信箱', '啟用']]);
  roster.setFrozenRows(1); roster.getRange('A:E').setNumberFormat('@');
  roster.getRange('F2:F1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['TRUE', 'FALSE'], true).build());
  var bank = file.insertSheet('unit01');
  var headers = ['課程代碼','題目ID','題型','問題','選項A','選項B','選項C','選項D','解答','解析','核心概念','常見誤解','① 先看題幹','② 比較觀念','③ 推回答案','圖片網址','講義標題','講義連結','補救資源'];
  bank.getRange(1,1,1,headers.length).setValues([headers]); bank.setFrozenRows(1);
  bank.getRange('A:B').setNumberFormat('@');
  bank.getRange('C2:C1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['單選','圖片'], true).build());
  bank.getRange('I2:I1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['A','B','C','D'], true).build());
  [roster, bank].forEach(function(sheet) { sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight('bold').setBackground('#dbeafe'); sheet.autoResizeColumns(1,sheet.getLastColumn()); });
  Logger.log(file.getUrl());
  return file.getUrl();
}
