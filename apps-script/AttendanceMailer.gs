/**
 * 課堂點名寄信程式（佇列 #67）。
 * 建立方式見 docs/attendance/APPS_SCRIPT_SETUP.md。
 * 這支程式只做一件事：收到平台後端（帶正確密鑰）的要求時，用「部署這支程式的老師本人」的學校信箱寄出一封純文字信。
 * 它不讀也不寫任何 Google 試算表、文件或雲端硬碟檔案；只用指令碼屬性（PropertiesService）記住最近 180 天寄過的信件編號，避免重複寄。
 *
 * 密鑰放在「專案設定 → 指令碼屬性」的 MAIL_KEY，不寫在程式裡。
 */
var SENT_PREFIX_ = 'sent:';
var RETENTION_MS_ = 180 * 24 * 60 * 60 * 1000;

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('MAIL_KEY');
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
    var sentKey = SENT_PREFIX_ + digest_(mailId);
    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // 一次只處理一封，避免同一個編號同時進來兩次
    try {
      var now = Date.now();
      var all = props.getProperties();
      for (var k in all) {
        if (!Object.prototype.hasOwnProperty.call(all, k)) continue;
        if (k.indexOf(SENT_PREFIX_) !== 0) continue;
        var raw = String(all[k]);
        var ts = Number(raw.indexOf('pending:') === 0 ? raw.slice(8) : raw);
        if (!isFinite(ts) || now - ts >= RETENTION_MS_) {
          delete all[k];
          try {
            props.deleteProperty(k);
          } catch (cleanupErr) {}
        }
      }
      var existing = Object.prototype.hasOwnProperty.call(all, sentKey) ? String(all[sentKey]) : '';
      if (existing && existing.indexOf('pending:') !== 0) return reply_({ ok: true, duplicate: true });
      if (existing && existing.indexOf('pending:') === 0 && body.forceResend !== true) {
        return reply_({
          ok: false,
          uncertain: true,
          error: '前次寄送結果不明（尚有待確認紀錄），請教師確認未寄後再單封重送',
        });
      }
      if (MailApp.getRemainingDailyQuota() < 1) return reply_({ ok: false, error: '今天的寄信額度已用完' });
      // 先在 PropertiesService 預留去重紀錄，確認空間與寫入配額足夠再寄信，避免寄出後寫入失敗造成重寄
      props.setProperty(sentKey, 'pending:' + now);
      var options = {};
      var fromName = String(body.fromName || '').trim().slice(0, 40);
      if (fromName) options.name = fromName;
      try {
        MailApp.sendEmail(to, subject, text, options);
      } catch (sendErr) {
        try {
          props.deleteProperty(sentKey);
        } catch (delErr) {}
        throw sendErr;
      }
      try {
        props.setProperty(sentKey, String(Date.now())); // 寄出成功才寫入正式完成時間，保留 180 天
      } catch (finalizeErr) {
        // 寄信已成功且 pending: 已寫入；即使第二次寫入配額耗盡，仍回報成功避免平台誤認失敗而重寄
      }
    } finally {
      lock.releaseLock();
    }
    var remaining = null;
    try {
      remaining = MailApp.getRemainingDailyQuota();
    } catch (quotaErr) {}
    return reply_(remaining === null ? { ok: true } : { ok: true, remaining: remaining });
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

/** 把信件編號換成固定長度的字串，當作指令碼屬性的鍵。 */
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
