import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, inMemoryPersistence, setPersistence, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseConfig } from './config.js';
const status = document.querySelector('#status')!;
const login = document.querySelector<HTMLButtonElement>('#login')!;
const auth = getAuth(initializeApp(firebaseConfig));
const nonce = document.querySelector<HTMLMetaElement>('meta[name="login-nonce"]')!.content;
login.addEventListener('click', async () => {
  login.disabled = true;
  try {
    await setPersistence(auth,inMemoryPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account',hd:'ctcn.edu.tw'});
    const result = await signInWithPopup(auth,provider);
    const idToken = await result.user.getIdToken(true);
    const refreshToken = result.user.refreshToken;
    const response = await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json','X-Login-Nonce':nonce},body:JSON.stringify({idToken,refreshToken})});
    const data = await response.json();
    if (!response.ok) throw {code:data.code};
    status.textContent = '教師登入成功；refresh token 已存入 macOS 鑰匙圈。請關閉此頁並回覆 Codex。';
    await signOut(auth);
  } catch(e) {
    // Only fixed format auth error codes; no messages, URLs, account or tokens.
    const raw = (e as {code?:string})?.code || 'auth/login-failed';
    const code = /^(auth\/[a-z-]+|TEACHER_CLAIM_REQUIRED|SCHOOL_ACCOUNT_REQUIRED|KEYCHAIN_ACCESS_FAILED|TOKEN_VERIFICATION_FAILED)$/.test(raw) ? raw : 'auth/login-failed';
    status.textContent = '登入停止：' + code + '。請回報此代碼；不更改學校或 Firebase 安全設定。';
    await signOut(auth).catch(() => {});
    await fetch('/failure',{method:'POST',headers:{'Content-Type':'application/json','X-Login-Nonce':nonce},body:JSON.stringify({code})}).catch(() => {});
  }
});
