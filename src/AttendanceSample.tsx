// 課堂點名樣張（佇列 #67 第一階段）。只用合成資料顯示畫面，不呼叫任何後端；
// 核可後第二階段才把這些畫面接上正式的路由與 callable。
import React, { useEffect, useState } from 'react';
import qrcode from 'qrcode-generator';

type Status = 'present' | 'absent' | 'pending';
type Rec = { uid: string; status: Status; signedAt?: string; via?: 'qr' | 'code'; sameDevice?: string; locked?: boolean; edited?: boolean; editedAt?: string };
type Session = {
  id: string; date: string; weekday: string; period: number; start: string; className: string; mailed: boolean; backfilled?: boolean;
  durationSec: number; codeSec: number; qrSec: number; records: Rec[];
  counts: { present: number; absent: number };
  live?: { signed: number; total: number; remainSec: number; code: string; codeRemainSec: number; qrRemainSec: number; token: string };
};
type Student = { uid: string; seat: number; studentId: string; name: string; classId: string; email: string };
export type AttendanceSampleData = {
  source: string;
  course: { id: string; code: string; name: string; term: string; teacherName: string; teacherEmail: string };
  platformUrl: string;
  classes: { id: string; name: string; mentorName: string; mentorEmail: string }[];
  students: Student[]; sessions: Session[];
  audit: { id: string; at: string; sessionId: string; uid: string; from: Status; to: Status; reason: string; by: string }[];
  me: string;
};

const statusText: Record<Status, string> = { present: '準時', absent: '未到', pending: '尚未簽到' };
const md = (s: Session) => `${Number(s.date.slice(5, 7))}/${Number(s.date.slice(8))}（${s.weekday}）`;
const hm = (t?: string) => (t ? t.slice(0, 5) : '');
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

function StatusPill({ status, time }: { status: Status; time?: string }) {
  return <span className={`att-pill att-${status}`}>{statusText[status]}{status === 'present' && time ? ` ${hm(time)}` : ''}</span>;
}

/* ───────── 學生：掃 QR 簽到頁 ───────── */
export type ScanKind = 'ok' | 'expired' | 'inapp' | 'notclass' | 'dup' | 'trial';
function ScanPage({ data, kind }: { data: AttendanceSampleData; kind: ScanKind }) {
  const s = data.sessions[4];
  const me = data.students.find((x) => x.uid === data.me)!;
  const rec = s.records.find((r) => r.uid === me.uid)!;
  const where = `${md(s)}第 ${s.period} 節・${s.className}`;
  const who = `${me.name}（${me.studentId}）`;
  const [copied, setCopied] = useState(false);
  return (
    <main className="att-scan">
      <header className="att-brand" data-secondary><span>{data.course.code}</span>{data.course.name}</header>
      <section className="att-scan-body" aria-live="polite">
        {kind === 'ok' && <>
          <div className="att-mark att-mark-ok" aria-hidden="true">✓</div>
          <h1>已簽到 {hm(rec.signedAt)}</h1>
          <p className="att-where">{where}</p>
          <p>{who}</p>
          <a className="att-btn primary" href="#/view/my">看我的出缺席</a>
          <p className="att-note" data-secondary>可以關閉這個頁面了。</p>
        </>}
        {kind === 'dup' && <>
          <div className="att-mark att-mark-ok" aria-hidden="true">✓</div>
          <h1>你已經簽到過了</h1>
          <p className="att-where">已簽到 {hm(rec.signedAt)}・{where}</p>
          <p>{who}</p>
          <p>不用再掃一次，紀錄只會算一次。</p>
          <a className="att-btn" href="#/view/my">看我的出缺席</a>
        </>}
        {kind === 'trial' && <>
          <div className="att-mark att-mark-trial" aria-hidden="true">✓</div>
          <h1>試簽成功</h1>
          <p className="att-where">這次不算點名</p>
          <p>{who}</p>
          <p>你的手機已經登入。之後上課用手機相機掃投影幕上的 QR，就會直接簽到。</p>
        </>}
        {kind === 'expired' && <>
          <div className="att-mark att-mark-warn" aria-hidden="true">!</div>
          <h1>QR 已過期</h1>
          <p>還沒有簽到。請用手機相機<strong>再掃一次</strong>投影幕上的 QR。</p>
          <p>QR 每 {s.qrSec} 秒更換一次，掃到後請馬上打開。</p>
          <a className="att-btn primary" href="#/view/home-input">改用 4 位數字碼簽到</a>
        </>}
        {kind === 'inapp' && <>
          <div className="att-mark att-mark-warn" aria-hidden="true">!</div>
          <h1>請改用 Safari 或 Chrome 開啟</h1>
          <p>還沒有簽到。你現在是在 LINE 裡面打開的，這裡不能登入學校帳號。</p>
          <ol className="att-steps">
            <li>按下面的〔複製網址〕。</li>
            <li>打開 Safari 或 Chrome，貼上網址。</li>
            <li>登入後，輸入投影幕上的 4 位數字碼。</li>
          </ol>
          <button className="att-btn primary" onClick={() => setCopied(true)}>{copied ? '已複製網址' : '複製網址'}</button>
          <p className="att-note" data-secondary>下次請直接用手機內建的相機掃 QR。</p>
        </>}
        {kind === 'notclass' && <>
          <div className="att-mark att-mark-stop" aria-hidden="true">×</div>
          <h1>你不在這一節點名的班級</h1>
          <p>沒有簽到。這一節點名的名單裡沒有你。</p>
          <p>你登入的帳號：{who}。</p>
          <p>如果有錯誤，請直接告訴老師。</p>
          <a className="att-btn" href="#/view/my">看我的出缺席</a>
        </>}
      </section>
    </main>
  );
}

/* ───────── 學生：平台首頁備用（數字碼） ───────── */
export type HomeKind = 'input' | 'wrong' | 'locked' | 'done';
function HomeBackup({ data, kind }: { data: AttendanceSampleData; kind: HomeKind }) {
  const s = data.sessions[5];
  const live = s.live!;
  const digits = kind === 'input' ? ['4', '7', '', ''] : kind === 'wrong' ? ['', '', '', ''] : live.code.split('');
  return (
    <main className="att-home">
      <header className="att-brand" data-secondary><span>{data.course.code}</span>{data.course.name}</header>
      <section className={`att-banner att-banner-${kind}`} aria-label="課堂點名">
        {kind === 'done' ? <>
          <h2>已簽到 10:10</h2>
          <p>{md(s)}第 {s.period} 節・{s.className}</p>
          <a className="att-btn" href="#/view/my">看我的出缺席</a>
        </> : kind === 'locked' ? <>
          <h2>這一節不能再輸入數字碼</h2>
          <p>已經輸入錯誤 5 次。請直接告訴老師，老師可以在後台幫你處理。</p>
        </> : <>
          <div className="att-banner-head"><h2>老師正在點名</h2><span className="att-count" aria-label="剩餘時間">剩 {clock(live.remainSec)}</span></div>
          <p>第 {s.period} 節・{s.className}。請輸入投影幕上的 4 位數字碼。</p>
          <div className="att-digits" role="group" aria-label="4 位數字碼">
            {digits.map((d, i) => <input key={i} className={d ? 'filled' : ''} inputMode="numeric" pattern="[0-9]*" maxLength={1} aria-label={`第 ${i + 1} 位`} defaultValue={d} />)}
          </div>
          {kind === 'wrong' && <p className="att-error" role="alert">數字碼不對，請看投影幕再輸入一次。還可以再試 3 次。</p>}
          <button className="att-btn primary">簽到</button>
          <p className="att-note" data-secondary>也可以用手機相機掃投影幕上的 QR。</p>
        </>}
      </section>
      <section className="att-home-rest" aria-hidden="true">
        <h2>必做單元</h2>
        <div className="att-ghost"><strong>消化系統（一）</strong><span>完成度 60%</span></div>
        <div className="att-ghost"><strong>內分泌系統（一）</strong><span>完成度 20%</span></div>
      </section>
    </main>
  );
}

/* ───────── 學生：我的出缺席 ───────── */
function MyAttendance({ data }: { data: AttendanceSampleData }) {
  const rows = data.sessions.filter((s) => !s.live).map((s) => ({ s, r: s.records.find((x) => x.uid === data.me)! })).reverse();
  const n = (st: Status) => rows.filter((x) => x.r.status === st).length;
  return (
    <main className="att-my">
      <header className="att-brand" data-secondary><span>{data.course.code}</span>{data.course.name}</header>
      <a className="att-back" href="#/view/home-input">‹ 回首頁</a>
      <h1>我的出缺席</h1>
      <div className="att-stats">
        <div><b>{n('present')}</b><span>準時</span></div>
        <div><b>{n('absent')}</b><span>未到</span></div>
      </div>
      <ul className="att-list">
        {rows.map(({ s, r }) => <li key={s.id}><span>{md(s)}第 {s.period} 節</span><StatusPill status={r.status} time={r.signedAt} /></li>)}
      </ul>
      <p>對紀錄有疑問，請直接洽老師。</p>
      <p className="att-note" data-secondary>老師修改紀錄後，這裡會跟著更新。點名只做紀錄，不計入成績。</p>
    </main>
  );
}

/* ───────── 教師：開始點名＋投影畫面 ───────── */
function Qr({ text }: { text: string }) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return <div className="att-qr" role="img" aria-label="簽到 QR" dangerouslySetInnerHTML={{ __html: q.createSvgTag({ scalable: true, margin: 2 }) }} />;
}
function StartPanel({ s }: { s: Session }) {
  return (
    <section className="panel att-start">
      <h2>開始點名</h2>
      <div className="att-start-grid">
        <label>班級<select defaultValue="a"><option value="a">{s.className}（60 人）</option><option>示範乙班</option><option>兩班一起</option></select></label>
        <label>節次<select defaultValue="4"><option value="4">{md(s)}第 {s.period} 節</option></select></label>
        <label>點名時間（分鐘）<input type="number" defaultValue={1} min={1} /></label>
        <label>數字碼更換（秒，15–300）<input type="number" defaultValue={s.codeSec} /></label>
        <label>QR 更換（秒，10–60）<input type="number" defaultValue={s.qrSec} /></label>
      </div>
      <div className="att-start-actions">
        <button className="primary">開始點名</button>
        <button>試簽（不算點名）</button>
        <span className="muted">試簽：第一堂課讓全班先掃一次，把登入狀態留在手機裡。</span>
      </div>
    </section>
  );
}
function Projection({ data }: { data: AttendanceSampleData }) {
  const s = data.sessions[5];
  const live = s.live!;
  const url = `${data.platformUrl}#/attend?c=${data.course.id}&t=${live.token}`;
  return (
    <section className="att-proj" aria-label="投影畫面">
      <div className="att-proj-top"><strong>{data.course.name}　課堂點名</strong><span>{md(s)}第 {s.period} 節・{s.className}</span></div>
      <div className="att-proj-main">
        <div className="att-proj-qr">
          <Qr text={url} />
          <p>用<b>手機相機</b>掃描（不要用 LINE、IG 掃）</p>
          <small>QR {live.qrRemainSec} 秒後更換</small>
        </div>
        <div className="att-proj-side">
          <div className="att-proj-box"><span>剩餘時間</span><b className="att-proj-time">{clock(live.remainSec)}</b></div>
          <div className="att-proj-box"><span>已簽到</span><b>{live.signed}<i>／{live.total}</i></b></div>
          <div className="att-proj-box att-proj-code"><span>掃不到？在平台首頁輸入數字碼</span><b>{live.code.split('').join(' ')}</b><small>{live.codeRemainSec} 秒後更換</small></div>
        </div>
      </div>
      <div className="att-proj-actions"><button>提前結束</button><button>延長 1 分鐘</button></div>
    </section>
  );
}

/* ───────── 教師後台：節次列表＋單節名冊 ───────── */
function SessionList({ data, current }: { data: AttendanceSampleData; current: string }) {
  return (
    <aside className="panel att-sessions">
      <div className="att-row-head"><h2>節次</h2><button>補建節次</button></div>
      <ul>
        {[...data.sessions].reverse().map((s) => <li key={s.id} className={s.id === current ? 'current' : ''}>
          <strong>{md(s)}第 {s.period} 節</strong><span>{s.className}{s.backfilled ? '・補建' : ''}</span>
          {s.live ? <em className="att-tag live">點名中 {s.live.signed}／{s.live.total}</em> : <>
            <span>準時 {s.counts.present}　未到 {s.counts.absent}</span>
            <em className={`att-tag ${s.mailed ? 'sent' : 'todo'}`}>{s.mailed ? '通知已寄' : '尚未確認寄出'}</em>
          </>}
        </li>)}
      </ul>
    </aside>
  );
}
function Roster({ data }: { data: AttendanceSampleData }) {
  const s = data.sessions[4];
  const name = (uid: string) => data.students.find((x) => x.uid === uid)!.name;
  // 樣張把需要注意的列排到前面，其餘照座號。
  const weight = (r: Rec) => (r.sameDevice ? 0 : r.status === 'absent' ? 1 : r.edited ? 2 : 3);
  const rows = data.students.map((st) => ({ st, r: s.records.find((x) => x.uid === st.uid)! })).sort((a, b) => weight(a.r) - weight(b.r) || a.st.seat - b.st.seat).slice(0, 15);
  return (
    <section className="panel att-roster">
      <div className="att-row-head">
        <div><h2>{md(s)}第 {s.period} 節　{s.className}</h2>
          <p className="att-chips"><span className="att-pill att-present">準時 {s.counts.present}</span><span className="att-pill att-absent">未到 {s.counts.absent}</span><span className="muted">應到 60・09:10 開始，1 分鐘後自動結束</span></p></div>
        <div className="att-actions"><button>匯出本節 CSV</button><button className="primary">確認並寄出（未到 {s.counts.absent} 人）</button></div>
      </div>
      <div className="notice warning att-device">⚠ 同裝置提醒：示範學生 11、示範學生 12 用同一台手機簽到。只是提醒，請自行判斷；不會擋下簽到，也不會寫進通知信。</div>
      <div className="att-bulk"><span>已選 2 人</span><button>改為準時</button><button>改為未到</button><span className="muted">排序：需要注意的在前（樣張只顯示前 15 列，共 60 列）</span></div>
      <div className="att-table-wrap">
        <table>
          <thead><tr><th></th><th>座號</th><th>學號</th><th>姓名</th><th>狀態（點一下就能改）</th><th>簽到時間</th><th>方式</th><th>提醒</th></tr></thead>
          <tbody>
            {rows.map(({ st, r }) => <tr key={st.uid} className={r.sameDevice ? 'flag' : ''}>
              <td><input type="checkbox" aria-label={`選取 ${st.name}`} defaultChecked={st.uid === 'demo-17' || st.uid === 'demo-31'} /></td>
              <td>{st.seat}</td><td>{st.studentId}</td><td>{st.name}</td>
              <td className="att-status-cell"><button className={`att-pill att-${r.status}`}>{statusText[r.status]} ▾</button>
                {st.uid === 'demo-05' && <div className="att-pop" role="dialog" aria-label="修改狀態">
                  <strong>示範學生 05：未到 → 準時</strong>
                  <label>原因（可不填，只有老師看得到）<input defaultValue="手機故障，已當面確認在場" /></label>
                  <div><button className="primary">改為準時</button><button>不改</button></div>
                </div>}
              </td>
              <td>{r.signedAt || '—'}</td><td>{r.via === 'qr' ? '掃 QR' : r.via === 'code' ? '數字碼' : r.edited ? '老師修改' : '—'}</td>
              <td>{r.sameDevice ? `⚠ 與 ${name(r.sameDevice)} 同裝置` : r.locked ? '🔒 數字碼錯 5 次，已鎖住' : r.edited ? `已修改 ${r.editedAt}` : ''}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────── 教師後台：總表＋修改紀錄＋累加用明細檔 ───────── */
const detailHeader = '格式版本,學期,課程代碼,課程名稱,班級,日期,節次,學號,姓名,狀態,簽到時間,是否修改過,匯出時間';
function Summary({ data }: { data: AttendanceSampleData }) {
  const done = data.sessions.filter((s) => !s.live);
  const rows = data.students.map((st) => {
    const recs = done.map((s) => s.records.find((r) => r.uid === st.uid)!);
    const n = (x: Status) => recs.filter((r) => r.status === x).length;
    return { st, recs, present: n('present'), absent: n('absent') };
  }).sort((a, b) => b.absent - a.absent || a.st.seat - b.st.seat);
  const sym: Record<Status, string> = { present: '●', absent: '✕', pending: '' };
  const s0 = done[4], st0 = data.students[4], st1 = data.students[6];
  const line = (st: Student, status: string, time: string, edited: string) => `1,${data.course.term},${data.course.code},${data.course.name},${s0.className},${s0.date},${s0.period},${st.studentId},${st.name},${status},${time},${edited},2026-11-16 12:10`;
  return (
    <div className="att-admin-col">
      <section className="panel">
        <div className="att-row-head">
          <div><h2>總表</h2><p className="att-chips"><label>班級 <select defaultValue="a"><option value="a">示範甲班</option></select></label><label>排序 <select defaultValue="x"><option value="x">未到次數多的在前</option></select></label><span className="muted">● 準時　✕ 未到　外框＝老師修改過</span></p></div>
          <div className="att-actions"><button>總表 CSV</button><button>累加用明細檔</button></div>
        </div>
        <div className="att-table-wrap">
          <table className="att-matrix">
            <thead><tr><th>座號</th><th>學號</th><th>姓名</th>{done.map((s) => <th key={s.id}>{md(s).replace(/（.）/, '')}<br />第{s.period}節</th>)}<th>準時</th><th>未到</th></tr></thead>
            <tbody>{rows.slice(0, 12).map((x) => <tr key={x.st.uid}><td>{x.st.seat}</td><td>{x.st.studentId}</td><td>{x.st.name}</td>
              {x.recs.map((r, i) => <td key={i} className={`att-sym att-sym-${r.status}${r.edited ? ' att-sym-edited' : ''}`} title={statusText[r.status]}>{sym[r.status]}</td>)}
              <td>{x.present}</td><td className={x.absent >= 2 ? 'att-many' : ''}>{x.absent}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="muted">樣張只顯示前 12 位，共 60 位。</p>
      </section>
      <section className="panel">
        <h2>修改紀錄（學生看不到）</h2>
        <table>
          <thead><tr><th>修改時間</th><th>節次</th><th>學生</th><th>改前 → 改後</th><th>原因</th><th>修改人</th></tr></thead>
          <tbody>{data.audit.map((a) => { const s = data.sessions.find((x) => x.id === a.sessionId)!; const st = data.students.find((x) => x.uid === a.uid)!; return <tr key={a.id}><td>{a.at}</td><td>{md(s)}第 {s.period} 節</td><td>{st.name}（{st.studentId}）</td><td><StatusPill status={a.from} /> → <StatusPill status={a.to} /></td><td>{a.reason || '（未填）'}</td><td>{a.by}</td></tr>; })}</tbody>
        </table>
      </section>
      <section className="panel">
        <h2>累加用明細檔（每學期欄位與順序完全相同，可直接往下貼）</h2>
        <pre className="att-csv">{[detailHeader, line(st0, '未到', '', '否'), line(st1, '準時', '09:10:12', '否'), line(data.students[8], '準時', '', '是')].join('\n')}</pre>
        <p className="muted">學號以文字輸出（保留開頭的 0）；同一節重複匯出內容相同；不含修改原因與同裝置提醒。</p>
      </section>
    </div>
  );
}

/* ───────── Email 樣式 ───────── */
function Mail({ title, from, to, subject, children }: { title: string; from: string; to: string; subject: string; children: React.ReactNode }) {
  return (
    <section className="att-mail">
      <h2>{title}</h2>
      <dl><dt>寄件人</dt><dd>{from}</dd><dt>收件人</dt><dd>{to}</dd><dt>主旨</dt><dd><strong>{subject}</strong></dd></dl>
      <div className="att-mail-body">{children}</div>
    </section>
  );
}
function Emails({ data }: { data: AttendanceSampleData }) {
  const s = data.sessions[4];
  const c = data.course, cls = data.classes[0];
  const from = `${c.teacherName} <${c.teacherEmail}>`;
  const st = data.students[4];
  const st2 = data.students[8];
  const by = (x: Status) => s.records.filter((r) => r.status === x).map((r) => data.students.find((y) => y.uid === r.uid)!);
  const link = `${data.platformUrl}#/course/${c.code}/attendance`;
  return (
    <div className="att-mails">
      <Mail title="① 未到通知（寄給未到的學生本人）" from={from} to={`${st.name} <${st.email}>`} subject={`【${c.name}】${md(s)}第 ${s.period} 節紀錄為未到`}>
        <p>{st.name} 同學：</p>
        <p>{c.name}　{s.date}（{s.weekday}）第 {s.period} 節，本節紀錄為<strong>未到</strong>。</p>
        <p>如果對紀錄有疑問，請直接洽老師。</p>
        <p>查看我的出缺席：<a href={link}>{link}</a></p>
        <p>{c.teacherName}</p>
      </Mail>
      <Mail title="② 更正通知（已寄過未到通知，之後老師改為準時）" from={from} to={`${st2.name} <${st2.email}>`} subject={`【${c.name}】${md(s)}第 ${s.period} 節的紀錄已改為準時`}>
        <p>{st2.name} 同學：</p>
        <p>{c.name}　{s.date}（{s.weekday}）第 {s.period} 節的紀錄已改為<strong>準時</strong>。先前寄出的未到通知請不用理會。</p>
        <p>查看我的出缺席：<a href={link}>{link}</a></p>
        <p>{c.teacherName}</p>
      </Mail>
      <Mail title="③ 導師彙整（每班導師每天一封）" from={from} to={`${cls.mentorName} <${cls.mentorEmail}>`} subject={`【${c.name}】${cls.name} ${s.date} 出缺席彙整`}>
        <p>{cls.mentorName} 老師您好：</p>
        <p>以下是 {cls.name} {s.date}（{s.weekday}）在「{c.name}」的出缺席紀錄。</p>
        <h3>第 {s.period} 節</h3>
        <p>應到 60 人，準時 {s.counts.present} 人，未到 {s.counts.absent} 人。</p>
        <p><strong>未到名單</strong></p>
        <ul>{by('absent').map((x) => <li key={x.uid}>{x.name}（{x.studentId}）</li>)}</ul>
        <p>{c.teacherName}</p>
      </Mail>
      <section className="att-mail att-mail-side">
        <h2>教師按〔寄出今日導師彙整〕時的提醒</h2>
        <div className="att-confirm" role="dialog" aria-label="寄出今日導師彙整">
          <strong>今天還有 1 節尚未確認</strong>
          <p>第 4 節還沒有按〔確認並寄出〕，不會放進這封彙整。</p>
          <div><button>先去確認第 4 節</button><button className="primary">只寄已確認的節次</button></div>
        </div>
        <h2>寄送時間由老師決定（系統不會自己寄）</h2>
        <div className="att-confirm" role="group" aria-label="寄送時間">
          <strong>待寄 8 封</strong>
          <p>第 3 節未到通知 6 封、更正通知 1 封、示範甲班導師彙整 1 封。改狀態後要寄的信也會先排在這裡。</p>
          <div className="att-send">
            <label><input type="radio" name="when" /> 現在寄出</label>
            <label><input type="radio" name="when" defaultChecked /> 設定時間 <input type="time" defaultValue="17:00" aria-label="寄送時間" /></label>
            <button className="primary">排定今天 17:00 寄出</button>
          </div>
        </div>
        <h2>寄送紀錄</h2>
        <table><thead><tr><th>時間</th><th>收件人</th><th>種類</th><th>結果</th></tr></thead><tbody>
          <tr><td>12:10</td><td>{st.name}</td><td>未到通知</td><td>成功</td></tr>
          <tr><td>12:10</td><td>示範學生 17</td><td>未到通知</td><td className="att-fail">失敗 <button>重寄</button></td></tr>
          <tr><td>12:31</td><td>{st2.name}</td><td>更正通知</td><td>成功</td></tr>
          <tr><td>17:00</td><td>{cls.mentorName}</td><td>導師彙整</td><td>成功（排定）</td></tr>
        </tbody></table>
        <p className="muted">信件只寫點名資訊，不含成績、情緒、關心標記與同裝置提醒。同一封不重複寄。</p>
      </section>
    </div>
  );
}

/* ───────── 樣張版面 ───────── */
function Phone({ label, scale = 1, children }: { label: string; scale?: number; children: React.ReactNode }) {
  return (
    <figure className="att-phone-fig">
      <figcaption>{label}</figcaption>
      <div className="att-phone" style={{ ['--font-scale' as string]: scale }}>{children}</div>
    </figure>
  );
}
function Sheet({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className={`att-sheet att-sheet-${n}`}>
      <header className="att-sheet-head"><h1>樣張 {n}／8　{title}</h1><span>課堂點名（#67 第一階段）・全部是合成資料</span></header>
      {children}
    </div>
  );
}
const scanLabels: Record<ScanKind, string> = { ok: '簽到成功', expired: 'QR 已過期', inapp: 'App 內建瀏覽器', notclass: '非本班', dup: '重複簽到', trial: '試簽' };
const homeLabels: Record<HomeKind, string> = { input: '輸入中', wrong: '輸入錯誤', locked: '錯 5 次鎖住', done: '簽到完成' };

export default function AttendanceSample({ data }: { data: AttendanceSampleData }) {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => { const f = () => setHash(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const scale = Number(new URLSearchParams(query).get('scale')) || 1;
  useEffect(() => { document.documentElement.style.setProperty('--font-scale', String(scale)); }, [scale]);
  const view = (id: string) => {
    if (id.startsWith('scan-')) return <ScanPage data={data} kind={id.slice(5) as ScanKind} />;
    if (id.startsWith('home-')) return <HomeBackup data={data} kind={id.slice(5) as HomeKind} />;
    if (id === 'my') return <MyAttendance data={data} />;
    return null;
  };
  const m = path.match(/^\/view\/(.+)$/);
  if (m) return view(m[1]);
  const n = Number(path.match(/^\/sheet\/(\d)$/)?.[1]);
  if (n === 1) return <Sheet n={1} title="授課控制台：開始點名與投影畫面"><StartPanel s={data.sessions[5]} /><Projection data={data} /></Sheet>;
  if (n === 2) return <Sheet n={2} title="掃 QR 簽到成功（手機 390 寬）"><div className="att-phones"><Phone label="字級：預設">{view('scan-ok')}</Phone><Phone label="字級：特大" scale={1.3}>{view('scan-ok')}</Phone></div></Sheet>;
  if (n === 3) return <Sheet n={3} title="簽到頁的其他結果（手機 390 寬）"><div className="att-phones">{(['expired', 'inapp', 'notclass', 'dup', 'trial'] as ScanKind[]).map((k) => <Phone key={k} label={scanLabels[k]}>{view(`scan-${k}`)}</Phone>)}</div></Sheet>;
  if (n === 4) return <Sheet n={4} title="平台首頁備用：輸入 4 位數字碼（手機 390 寬）"><div className="att-phones">{(['input', 'wrong', 'locked', 'done'] as HomeKind[]).map((k) => <Phone key={k} label={homeLabels[k]}>{view(`home-${k}`)}</Phone>)}<Phone label="輸入中（字級：特大）" scale={1.3}>{view('home-input')}</Phone></div></Sheet>;
  if (n === 5) return <Sheet n={5} title="我的出缺席（手機 390 寬）"><div className="att-phones"><Phone label="字級：預設">{view('my')}</Phone><Phone label="字級：特大" scale={1.3}>{view('my')}</Phone></div></Sheet>;
  if (n === 6) return <Sheet n={6} title="教師後台：節次列表與單節名冊（含同裝置提醒）"><div className="att-admin"><SessionList data={data} current={data.sessions[4].id} /><Roster data={data} /></div></Sheet>;
  if (n === 7) return <Sheet n={7} title="教師後台：總表、修改紀錄、累加用明細檔"><Summary data={data} /></Sheet>;
  if (n === 8) return <Sheet n={8} title="Email：未到通知、更正通知、導師彙整"><Emails data={data} /></Sheet>;
  return (
    <nav className="att-index">
      <h1>課堂點名樣張（合成資料）</h1>
      <ol>{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <li key={i}><a href={`#/sheet/${i}`}>樣張 {i}</a></li>)}</ol>
    </nav>
  );
}
