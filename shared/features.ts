export type CourseFeatures = { assessments: boolean; teachingConsole: boolean; classroomInteraction: boolean };
export const featureNames = ['assessments', 'teachingConsole', 'classroomInteraction'] as const;
export type Feature = typeof featureNames[number];
export function featureEnabled(course: { features?: Partial<CourseFeatures> } | undefined, feature: Feature) {
  return course?.features?.[feature] === true;
}
