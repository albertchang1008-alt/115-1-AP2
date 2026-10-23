import type {Page} from 'playwright';
import type {LearningEvent} from '../../shared/learning';
export function installReadOnlyTracking(page:Page):Promise<void>;
export function validateCapturedEvents(events:LearningEvent[],questionIds:Set<string>):LearningEvent[];
export function verifyReadOnlyTracking(page:Page):Promise<LearningEvent[]>;
