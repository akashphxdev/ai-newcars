// src/jobs/index.ts
//
// Single place that knows about every background scheduler — server.ts
// only calls startAllSchedulers()/stopAllSchedulers() and never has to
// change when a new job is added, only this file does.

import { startArticleScheduler, stopArticleScheduler } from '@/jobs/articleScheduler.job';
import { startStoryScheduler, stopStoryScheduler } from '@/jobs/storyScheduler.job';
import { startAiFaqScheduler, stopAiFaqScheduler } from '@/jobs/aiFaqScheduler.job';
import { startArticleGeneratorScheduler, stopArticleGeneratorScheduler } from '@/jobs/articleGeneratorScheduler.job';
import { startStoryGeneratorScheduler, stopStoryGeneratorScheduler } from '@/jobs/storyGeneratorScheduler.job';

export function startAllSchedulers(): void {
  startArticleScheduler();
  startStoryScheduler();
  startAiFaqScheduler();
  startArticleGeneratorScheduler();
  startStoryGeneratorScheduler();
}

export function stopAllSchedulers(): void {
  stopArticleScheduler();
  stopStoryScheduler();
  stopAiFaqScheduler();
  stopArticleGeneratorScheduler();
  stopStoryGeneratorScheduler();
}
