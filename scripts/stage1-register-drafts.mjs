import {upsertCatalogEntry,syncCatalog} from './materials.mjs';
upsertCatalogEntry('cardiac-electrical-v1',{label:'心臟的電性活動｜互動資訊圖表',tracking:'interactive',nodeTotal:9,questionTotal:11,note:'9 個知識節點；6 先備＋5 情境'});
upsertCatalogEntry('rbc-homeostasis-v1',{label:'紅血球的恆定機制｜互動資訊圖表',tracking:'interactive',nodeTotal:6,questionTotal:11,note:'6 個知識節點；6 先備＋5 情境'});
await syncCatalog();
