// 課序題庫同步。共用版本由 version.gs 自動產生。
function onOpen() { SpreadsheetApp.getUi().createMenu('課序題庫').addItem('檢查並發布目前工作表', 'publishCurrentSheet').addToUi(); }
function publishCurrentSheet() {
  var props=PropertiesService.getScriptProperties();
  var endpoint=props.getProperty('PUBLISH_ENDPOINT'),secret=props.getProperty('SHEETS_SYNC_KEY'),courseId=props.getProperty('COURSE_ID'),unitId=props.getProperty('UNIT_ID');
  if(!endpoint||!secret||!courseId||!unitId)throw new Error('請設定 PUBLISH_ENDPOINT、SHEETS_SYNC_KEY、COURSE_ID、UNIT_ID');
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw new Error('已有同步工作執行中');
  try {var values=SpreadsheetApp.getActiveSheet().getDataRange().getValues(),headers=values.shift();
    var required=['id','text','a','b','answer','explanation'];required.forEach(function(h){if(headers.indexOf(h)<0)throw new Error('缺少欄位：'+h);});
    var seen={};var questions=values.filter(function(r){return String(r[headers.indexOf('id')]).trim();}).map(function(row){var q={};headers.forEach(function(h,i){q[h]=String(row[i]||'').trim();});if(seen[q.id])throw new Error('重複題目 ID：'+q.id);seen[q.id]=true;var options=['a','b','c','d','e','f','g','h'].filter(function(k){return q[k];}).map(function(k){return {id:k,text:q[k]};});return {id:q.id,text:q.text,options:options,answer:q.answer.toLowerCase(),explanation:q.explanation,concept:q.concept||'',image:q.image||'',socratic:{concept:q.socraticConcept||'',misconception:q.socraticMisconception||'',hint1:q.socraticHint1||'',hint2:q.socraticHint2||'',hint3:q.socraticHint3||''},remedialUrl:q.remedialUrl||''};});
    var payload=JSON.stringify({courseId:courseId,unitId:unitId,questions:questions,platformVersion:PLATFORM_VERSION});var hash=Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,payload));var key='last_'+courseId+'_'+unitId;
    if(props.getProperty(key)===hash){SpreadsheetApp.getUi().alert('題庫內容沒有變動，不需再次發布。');return;}
    var stamp=String(Date.now());var bytes=Utilities.computeHmacSha256Signature(stamp+'.'+payload,secret);var signature=bytes.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
    var response=UrlFetchApp.fetch(endpoint,{method:'post',contentType:'application/json',payload:payload,headers:{'x-timestamp':stamp,'x-signature':signature},muteHttpExceptions:true});if(response.getResponseCode()!==200)throw new Error(response.getContentText());var result=JSON.parse(response.getContentText());props.setProperty(key,hash);SpreadsheetApp.getUi().alert('已發布 '+result.count+' 題。\n版本：'+result.version+'\n請在教師後台的題庫管理連接此版本，再發布課程。');
  } finally {lock.releaseLock();}
}
