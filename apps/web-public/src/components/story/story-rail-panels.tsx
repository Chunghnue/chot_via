'use client';

import { FunPollPanel, HotTopicsPanel, TopStoryAuthorsPanel } from './story-rail';

export function StoryRailPanels() {
  return (
    <div className="flex flex-col gap-4">
      <HotTopicsPanel />
      <FunPollPanel />
      <TopStoryAuthorsPanel />
    </div>
  );
}
