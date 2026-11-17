/**
 * 課堂點名寄信程式（佇列 #67）。
 * 建立方式見 docs/attendance/APPS_SCRIPT_SETUP.md。
 * 這支程式只做一件事：收到平台後端（帶正確密鑰）的要求時，用「部署這支程式的老師本人」的學校信箱寄出一封純文字信。
 * 它不讀也不寫任何 Google 試算表、文件或雲端硬碟檔案；只用指令碼快取記住最近 6 小時寄過的信件編號，避免重複寄。
 *
 * 密鑰放在「專案設定 → 指令碼屬性」的 MAIL_KEY，不寫在程式裡。
 */
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var expected = PropertiesService.getScriptProperties().getProperty('MAIL_KEY');
    if (!expected || expected.length < 24) return reply_({ ok: false, error: '尚未設定 MAIL_KEY' });
    if (!sameText_(String(body.key || ''), expected)) return reply_({ ok: false, error: '密鑰不正確' });
    var to = String(body.to || '').trim();
    var subject = String(body.subject || '').trim();
    var text = String(body.text || '');
    if (!/^[^\s,;<>@]+@[^\s,;<>@]+\.[^\s,;<>@]+$/.test(to)) return reply_({ ok: false, error: '收件人無效' });
    if (!subject || subject.length > 200) return reply_({ ok: false, error: '主旨無效' });
    if (!text || text.length > 20000) return reply_({ ok: false, error: '內容無效' });
    // mailId：平台為每一封信產生的編號。同一個編號只寄一次，
    // 所以平台在「不確定上次有沒有寄出去」時重送，學生也不會收到兩封。
    var mailId = String(body.mailId || '');
    if (!mailId || mailId.length > 400 || /[\u0000-\u001f\u007f]/.test(mailId)) return reply_({ ok: false, error: '信件編號無效' });
    var cache = CacheService.getScriptCache();
    var cacheKey = 'sent:' + digest_(mailId);
    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // 一次只處理一封，避免同一個編號同時進來兩次
    try {
      if (cache.get(cacheKey)) return reply_({ ok: true, duplicate: true });
      if (MailApp.getRemainingDailyQuota() < 1) return reply_({ ok: false, error: '今天的寄信額度已用完' });
      var options = {};
      var fromName = String(body.fromName || '').trim().slice(0, 40);
      if (fromName) options.name = fromName;
      MailApp.sendEmail(to, subject, text, options);
      cache.put(cacheKey, '1', 21600); // 寄出成功才記錄，保留 6 小時（CacheService 上限）
    } finally {
      lock.releaseLock();
    }
    return reply_({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return reply_({ ok: false, error: String(err && err.message ? err.message : err).slice(0, 200) });
  }
}

/** 用瀏覽器打開網址時只顯示說明，不寄信、不透露任何資料。 */
function doGet() {
  return ContentService.createTextOutput('課堂點名寄信程式：運作中。這個網址只接受平台後端的要求。');
}

/** 在編輯器裡手動執行一次：寄一封測試信給自己，同時完成授權。 */
function testSendToMyself() {
  var me = Session.getActiveUser().getEmail();
  MailApp.sendEmail(me, '課堂點名寄信程式測試', '看到這封信，表示寄信程式可以正常寄信。\n今天還可以寄 ' + MailApp.getRemainingDailyQuota() + ' 位收件人。');
}

/** 把信件編號換成固定長度的字串，當作快取的鍵（快取的鍵有長度上限）。 */
function digest_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes);
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** 逐字比對，不因為前面幾個字不同就提早結束。 */
function sameText_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
