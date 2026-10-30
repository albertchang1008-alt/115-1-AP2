import { test } from 'node:test';
import { verifyUpdateBanner } from '../scripts/update-banner-verify.mjs';
test(
  '新版橫幅：前景／online／30分鐘、390、手動載入新bundle、所有作答模式保護與交卷後解鎖',
  { timeout: 120000 },
  async () => {
    await verifyUpdateBanner();
  },
);
