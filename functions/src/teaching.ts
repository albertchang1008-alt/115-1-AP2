import { classroomDeckSlides } from '../../shared/presentation';
import { featureAccess } from './features';
import { featureEnabled } from '../../shared/features';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { forClass } from '../../shared/model';
import { Firestore } from 'firebase-admin/firestore';
export function createTeachingHandlers(
  db: Firestore,
  access: (req: any, id: string, teacher?: boolean) => Promise<any>,
  options: any,
) {
  const teachingAccess = featureAccess(access, 'teachingConsole');
  return {
    getTeachingDeck: onCall(options, async (req) => {
      const { c } = await teachingAccess(req, req.data.courseId, true);
      const asset = (await db.doc(`courses/${req.data.courseId}/teacherAssets/presentation`).get()).data();
      if (!asset) return { title: '', slides: [] };
      const config = featureEnabled(c, 'classroomInteraction') ? (await db.doc(`courses/${req.data.courseId}/classroomConfig/interactions`).get()).data() : undefined;
      return { title: asset.title, slides: classroomDeckSlides(asset.slides, config) };
    }),
    getClassroomCourse: onCall(options, async (req) => {
      const { p, c } = await access(req, req.data.courseId);
      if (!featureEnabled(c, 'teachingConsole') && !featureEnabled(c, 'classroomInteraction')) throw new HttpsError('permission-denied', '此課程尚未開放此功能');
      if (p.teacher) throw new HttpsError('permission-denied', '此入口供學生更新課堂進度');
      return {
        ...forClass(c.published, p.classId),
        features: c.features || {},
        id: req.data.courseId,
        enrollmentClassId: p.classId,
        studentName: p.name || '',
      };
    }),
  };
}
