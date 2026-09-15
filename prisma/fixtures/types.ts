export type FixtureSegment = {
  speaker: string;
  startSec: number;
  endSec: number;
  text: string;
};

export type Fixture = {
  slugBase: string;
  title: string;
  startedAt: string;
  durationSec: number;
  participants: string[];
  segments: FixtureSegment[];
};
