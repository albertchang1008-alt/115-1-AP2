export type CourseFeatures = {
  assessments: boolean;
  teachingConsole: boolean;
  classroomInteraction: boolean;
  readabilityOverlay?: boolean;
  readabilityOverlayExclusions?: string[];
};
export const featureNames = ['assessments', 'teachingConsole', 'classroomInteraction'] as const;
export type Feature = (typeof featureNames)[number];
export function featureEnabled(
  course: { features?: Partial<CourseFeatures> } | undefined,
  feature: Feature,
) {
  return course?.features?.[feature] === true;
}

/** Persist all supported settings; missing readability settings are enabled by default. */
export function normalizeCourseFeatures(features?: Partial<CourseFeatures>) {
  return {
    ...Object.fromEntries(featureNames.map((key) => [key, features?.[key] === true])),
    readabilityOverlay: features?.readabilityOverlay !== false,
    readabilityOverlayExclusions: [...(features?.readabilityOverlayExclusions || [])],
  } as CourseFeatures;
}
export function courseFeaturesFromRecord(record: {
  features?: Partial<CourseFeatures>;
  draft?: { features?: Partial<CourseFeatures> };
  published?: { features?: Partial<CourseFeatures> };
}) {
  const fallback = record.draft?.features || record.published?.features;
  return normalizeCourseFeatures({
    ...record.features,
    readabilityOverlay: record.features?.readabilityOverlay ?? fallback?.readabilityOverlay ?? true,
    readabilityOverlayExclusions:
      record.features?.readabilityOverlayExclusions ?? fallback?.readabilityOverlayExclusions ?? [],
  });
}
