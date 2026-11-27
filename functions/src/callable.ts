import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';
import { logger } from 'firebase-functions';
import { onCall as firebaseOnCall } from 'firebase-functions/v2/https';
import type { CallableOptions, CallableRequest, CallableResponse } from 'firebase-functions/v2/https';

type Timings = { courseMs: number; rosterMs: number; transactionMs: number };
const timings = new AsyncLocalStorage<Timings>();

export async function measure<T>(stage: keyof Timings, work: () => Promise<T>): Promise<T> {
  const metrics = timings.getStore();
  if (!metrics) return work();
  const start = performance.now();
  try {
    return await work();
  } finally {
    metrics[stage] += performance.now() - start;
  }
}

export const studentBurstOptions = { cpu: 1, concurrency: 80, maxInstances: 20 } as const;

export function onCall<T = any, R = unknown, Stream = unknown>(
  name: string,
  options: CallableOptions<T>,
  handler: (request: CallableRequest<T>, response?: CallableResponse<Stream>) => R,
) {
  let firstInvocation = true;
  return firebaseOnCall(options, async (request, response) => {
    const coldStart = firstInvocation;
    firstInvocation = false;
    const warm = (request.data as { warm?: unknown } | null)?.warm === true;
    const start = performance.now();
    const stages: Timings = { courseMs: 0, rosterMs: 0, transactionMs: 0 };
    let ok = false;
    try {
      const result = warm
        ? { ok: true }
        : await timings.run(stages, () => handler(request, response));
      ok = true;
      return result;
    } finally {
      const ms = (value: number) => Math.round(value * 100) / 100;
      logger.info('callable.performance', {
        name, warm, coldStart, ok, totalMs: ms(performance.now() - start),
        courseMs: ms(stages.courseMs), rosterMs: ms(stages.rosterMs), transactionMs: ms(stages.transactionMs),
      });
    }
  });
}
