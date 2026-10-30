import { useLayoutEffect, useSyncExternalStore } from 'react';
export function createUpdateActivity() {
  const locks = new Set<symbol>(),
    listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  return {
    getSnapshot: () => locks.size > 0,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    lock() {
      const id = Symbol('answering');
      locks.add(id);
      emit();
      return () => {
        if (locks.delete(id)) emit();
      };
    },
  };
}
export const updateActivity = createUpdateActivity();
export function useUpdateProtection(active: boolean) {
  useLayoutEffect(() => {
    if (active) return updateActivity.lock();
  }, [active]);
}
export function useUpdateActivity() {
  return useSyncExternalStore(updateActivity.subscribe, updateActivity.getSnapshot, () => false);
}
export function reloadIfIdle(reload: () => void) {
  if (updateActivity.getSnapshot()) return false;
  reload();
  return true;
}
