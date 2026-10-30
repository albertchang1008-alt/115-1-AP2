import type { Activity, Course } from './model';
export const fontScales: Record<string, number> = {
  small: 0.875,
  default: 1,
  large: 1.15,
  xlarge: 1.3,
};
export function displayPreferences(
  course: Pick<Course, 'features'> | undefined,
  activity: Pick<Activity, 'url' | 'materialVersion'>,
  fontScale: number,
) {
  const version = activity.materialVersion || activity.url.match(/\/materials\/([^/]+)/)?.[1] || '';
  return {
    type: 'display-prefs',
    protocolVersion: 1,
    fontScale,
    overlay:
      course?.features?.readabilityOverlay !== false &&
      !course?.features?.readabilityOverlayExclusions?.includes(version),
  };
}
