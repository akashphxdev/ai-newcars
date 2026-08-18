// src/jobs/index.ts
//
// Single place that knows about every background scheduler — server.ts
// only calls startAllSchedulers()/stopAllSchedulers() and never has to
// change when a new job is added, only this file does.

import { startArticleScheduler, stopArticleScheduler } from '@/jobs/articleScheduler.job';
import { startStoryScheduler, stopStoryScheduler } from '@/jobs/storyScheduler.job';

export function startAllSchedulers(): void {
  startArticleScheduler();
  startStoryScheduler();
}

export function stopAllSchedulers(): void {
  stopArticleScheduler();
  stopStoryScheduler();
}
