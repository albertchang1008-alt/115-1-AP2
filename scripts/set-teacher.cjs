// 使用 ADC，不接受或寫入服務帳戶金鑰檔。
const {createRequire}=require('node:module');
const {resolve}=require('node:path');
const backendRequire=createRequire(resolve(__dirname,'../functions/package.json'));
const {initializeApp,applicationDefault}=backendRequire('firebase-admin/app');
const {getAuth}=backendRequire('firebase-admin/auth');
const [projectId,uid]=process.argv.slice(2);if(!projectId||!uid)throw Error('用法：node scripts/set-teacher.cjs PROJECT_ID UID');
initializeApp({credential:applicationDefault(),projectId});
getAuth().getUser(uid).then(user=>getAuth().setCustomUserClaims(uid,{...user.customClaims,teacher:true})).then(()=>console.log('教師權限已設定；請重新登入。')).catch(e=>{console.error(e.message);process.exitCode=1});
