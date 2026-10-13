import { HttpsError } from 'firebase-functions/v2/https';
import { Feature, featureEnabled } from '../../shared/features';
export function requireFeature(c: any, feature: Feature) {
  if (!featureEnabled(c, feature)) throw new HttpsError('permission-denied', '此課程尚未開放此功能');
}
export function featureAccess(access: (req: any, id: string, teacher?: boolean) => Promise<any>, feature: Feature) {
  return async (req: any, id: string, teacher = false) => {
    const result = await access(req, id, teacher);
    requireFeature(result.c, feature);
    return result;
  };
}
