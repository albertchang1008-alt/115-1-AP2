import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as A from '../shared/attendance';
import { featureEnabled, featureNames, normalizeCourseFeatures } from '../shared/features';
import { AttendanceBanner, isMyAttendanceHash } from '../src/Attendance';

test('點名旗標預設關閉；未設定的課程存回時仍是關閉', () => {
  assert(featureNames.includes('attendance'));
  assert.equal(featureEnabled({ features: {} }, 'attendance'), false);
  assert.equal(featureEnabled(undefined, 'attendance'), false);
  assert.equal(normalizeCourseFeatures({}).attendance, false);
  assert.equal(normalizeCourseFeatures({ attendance: true }).attendance, true);
  assert.equal(
    normalizeCourseFeatures({ attendance: true }).classroomInteraction,
    false,
    '不連帶開啟別的功能',
  );
});
test('旗標關閉或預覽模式時，學生首頁不顯示點名橫幅', () => {
  const api: any = {
    preview: false,
    call: async () => {
      throw new Error('不應呼叫');
    },
  };
  const course: any = { id: 'c', title: 't', classIds: [], features: {} };
  assert.equal(renderToStaticMarkup(React.createElement(AttendanceBanner, { api, course })), '');
  assert.equal(
    renderToStaticMarkup(
      React.createElement(AttendanceBanner, {
        api: { ...api, preview: true },
        course: { ...course, features: { attendance: true } },
      }),
    ),
    '',
  );
  assert.match(
    renderToStaticMarkup(
      React.createElement(AttendanceBanner, {
        api,
        course: { ...course, features: { attendance: true } },
      }),
    ),
    /我的出缺席/,
  );
});
test('簽到網址：解析與產生；我的出缺席路由', () => {
  assert.deepEqual(
    A.parseAttendHash('#/attend?c=115-1-AP2&t=2026-11-16-p03-ab12cd34.3.AAAAAAAAAAAAAAAAAAAAAA'),
    { courseId: '115-1-AP2', token: '2026-11-16-p03-ab12cd34.3.AAAAAAAAAAAAAAAAAAAAAA' },
  );
  assert.deepEqual(A.parseAttendHash('#/attend?c=115-1-AP2'), { courseId: '115-1-AP2', token: '' });
  assert.deepEqual(A.parseAttendHash('#/attend?c=115-1-AP2&t=<script>'), {
    courseId: '115-1-AP2',
    token: '',
  });
  assert.equal(A.parseAttendHash('#/attend'), null);
  assert.equal(A.parseAttendHash('#/course/x'), null);
  assert.equal(A.parseAttendHash('#attendance'), null);
  const url = A.attendUrl('https://example.edu/app/#old', '115-1-MI-國考', 'a.1.b');
  assert.equal(url, 'https://example.edu/app/#/attend?c=115-1-MI-%E5%9C%8B%E8%80%83&t=a.1.b');
  assert.deepEqual(A.parseAttendHash(new URL(url).hash), {
    courseId: '115-1-MI-國考',
    token: 'a.1.b',
  });
  assert.equal(
    A.attendUrl('https://example.edu/', 'c'),
    'https://example.edu/#/attend?c=c',
    '複製用網址不含憑證',
  );
  assert.equal(isMyAttendanceHash('#/course/115-1-AP2/attendance', '115-1-AP2'), true);
  assert.equal(isMyAttendanceHash('#/course/115-1-AP2', '115-1-AP2'), false);
});
test('App 內建瀏覽器偵測', () => {
  assert.equal(
    A.inAppBrowserName('Mozilla/5.0 (iPhone) AppleWebKit Mobile Safari Line/14.0.0'),
    'LINE',
  );
  assert.equal(A.inAppBrowserName('Mozilla/5.0 (iPhone) Instagram 300.0'), 'Instagram');
  assert.equal(A.inAppBrowserName('Mozilla/5.0 [FBAN/FBIOS;FBAV/400]'), 'Facebook');
  assert.equal(
    A.inAppBrowserName('Mozilla/5.0 (Linux; Android 14; Pixel; wv) Chrome/120 Mobile'),
    'App',
  );
  assert.equal(
    A.inAppBrowserName(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    ),
    '',
  );
  assert.equal(
    A.inAppBrowserName(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
    ),
    '',
  );
});
test('時間區段、寬限、台北時間', () => {
  const t0 = Date.parse('2026-11-16T01:10:00Z');
  assert.equal(A.taipeiDate(t0), '2026-11-16');
  assert.equal(A.taipeiDate(Date.parse('2026-11-16T16:30:00Z')), '2026-11-17', '台北已跨日');
  assert.equal(A.taipeiTime(t0, true), '09:10:00');
  assert.equal(A.sessionLabel({ date: '2026-11-16', period: 3 }), '11/16（一）第 3 節');
  assert.equal(A.stepRemainingMs(t0 + 16000, t0, 15), 14000);
  assert.equal(A.sessionAcceptsCheckIn({ status: 'open', endsAt: t0 }, t0 + 5000), true);
  assert.equal(A.sessionAcceptsCheckIn({ status: 'open', endsAt: t0 }, t0 + 5001), false);
  assert.equal(A.sessionAcceptsCheckIn({ status: 'closed', endsAt: t0 + 60000 }, t0), false);
  assert.equal(A.validAttendanceDate('2026-02-30'), false);
});
test('待通知判斷：只在紀錄與上次通知不一致時需要通知', () => {
  assert.equal(A.pendingStudentMail({ status: 'absent' }), 'absent');
  assert.equal(A.pendingStudentMail({ status: 'absent', lastNotified: 'absent' }), null);
  assert.equal(A.pendingStudentMail({ status: 'present', lastNotified: 'absent' }), 'correction');
  assert.equal(A.pendingStudentMail({ status: 'present' }), null);
  assert.equal(A.pendingStudentMail({ status: 'present', lastNotified: 'present' }), null);
  assert.equal(A.pendingStudentMail({ status: 'absent', lastNotified: 'present' }), 'absent');
});
test('信件內容：只有點名資訊', () => {
  const ctx = {
    courseName: '解剖生理學（二）',
    teacherName: '示範教師',
    link: 'https://example.edu/#/course/c/attendance',
  };
  const s = { date: '2026-11-16', period: 3 };
  const absent = A.absentMail(ctx, s, '示範學生 05');
  assert.equal(absent.subject, '【解剖生理學（二）】11/16（一）第 3 節紀錄為未到');
  assert.match(absent.text, /本節紀錄為未到。/);
  assert.match(
    A.correctionMail(ctx, s, '示範學生 05').text,
    /紀錄已改為準時。先前寄出的未到通知請不用理會。/,
  );
  const digest = A.mentorDigestMail(ctx, '甲班', '示範導師', '2026-11-16', [
    {
      session: s,
      records: [
        { status: 'absent', name: '乙', studentId: '002', classId: '甲班' },
        { status: 'present', name: '甲', studentId: '001', classId: '甲班' },
        { status: 'absent', name: '別班', studentId: '003', classId: '乙班' },
      ],
    },
  ]);
  assert.match(digest.text, /應到 2 人，準時 1 人，未到 1 人。/);
  assert(!digest.text.includes('別班'), '導師彙整只列自己班的學生');
  for (const m of [absent, A.correctionMail(ctx, s, 'x'), digest])
    assert(!/成績|分數|情緒|關心|同裝置|原因/.test(m.subject + m.text));
});
test('輸入白名單與 CSV 跳脫', () => {
  assert.throws(() => A.onlyKeys({ a: 1, b: 2 }, ['a']), /不支援的欄位：b/);
  assert.throws(() => A.onlyKeys(null, []));
  assert.throws(
    () => A.validateStartInput({ classIds: ['X'], period: 1 }, ['A'], '2026-11-16'),
    /班級不屬於課程/,
  );
  assert.deepEqual(
    A.validateStartInput({ classIds: ['B', 'A', 'A'], period: 3 }, ['A', 'B'], '2026-11-16'),
    {
      classIds: ['A', 'B'],
      period: 3,
      date: '2026-11-16',
      durationSec: 60,
      codeSec: 60,
      qrSec: 15,
      trial: false,
    },
  );
  assert.equal(A.csvCell('a,"b"'), '"a,""b"""');
  assert.equal(A.csvText('0990001'), '"=""0990001"""');
  assert.equal(A.validEmailKey('a/b@example.edu'), false);
  assert.equal(A.validEmailKey('A@example.edu'), false);
});
test('開啟 Gmail 網址：收件人、主旨、內文完整編碼；有指定帳號才帶 authuser', () => {
  const mail = { to: 's1@example.edu', subject: '【課】第 3 節 & 未到', text: '甲 同學：\n\n第二行 #?=' };
  const u = new URL(A.gmailComposeUrl('teacher@example.edu', mail));
  assert.equal(u.origin + u.pathname, 'https://mail.google.com/mail/');
  assert.equal(u.searchParams.get('view'), 'cm');
  assert.equal(u.searchParams.get('authuser'), 'teacher@example.edu');
  assert.equal(u.searchParams.get('to'), mail.to);
  assert.equal(u.searchParams.get('su'), mail.subject);
  assert.equal(u.searchParams.get('body'), mail.text);
  assert(!new URL(A.gmailComposeUrl('', mail)).searchParams.has('authuser'));
  assert(!('nextSendAt' in A) && !('validDailyTime' in A), '排程寄信已移除');
});
