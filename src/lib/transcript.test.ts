import { describe, expect, it } from "vitest";
import { groupSegmentsBySpeaker, type TranscriptSegmentLike } from "./transcript";

function seg(overrides: Partial<TranscriptSegmentLike>): TranscriptSegmentLike {
  return {
    id: "seg",
    speakerId: "p1",
    speakerName: "Jordan",
    startSec: 0,
    endSec: 10,
    text: "hi",
    order: 0,
    ...overrides,
  };
}

describe("groupSegmentsBySpeaker", () => {
  it("returns an empty array for no segments", () => {
    expect(groupSegmentsBySpeaker([])).toEqual([]);
  });

  it("merges consecutive segments from the same speaker into one group", () => {
    const segments = [
      seg({ id: "1", speakerId: "p1", speakerName: "Jordan", startSec: 0, order: 0 }),
      seg({ id: "2", speakerId: "p1", speakerName: "Jordan", startSec: 10, order: 1 }),
    ];
    const groups = groupSegmentsBySpeaker(segments);
    expect(groups).toHaveLength(1);
    expect(groups[0].segments.map((s) => s.id)).toEqual(["1", "2"]);
    expect(groups[0].startSec).toBe(0);
  });

  it("starts a new group whenever the speaker changes", () => {
    const segments = [
      seg({ id: "1", speakerId: "p1", speakerName: "Jordan", startSec: 0, order: 0 }),
      seg({ id: "2", speakerId: "p2", speakerName: "Sam", startSec: 10, order: 1 }),
      seg({ id: "3", speakerId: "p1", speakerName: "Jordan", startSec: 20, order: 2 }),
    ];
    const groups = groupSegmentsBySpeaker(segments);
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.speakerId)).toEqual(["p1", "p2", "p1"]);
  });

  it("preserves segment order within a group", () => {
    const segments = [
      seg({ id: "1", speakerId: "p1", order: 0 }),
      seg({ id: "2", speakerId: "p1", order: 1 }),
      seg({ id: "3", speakerId: "p1", order: 2 }),
    ];
    const [group] = groupSegmentsBySpeaker(segments);
    expect(group.segments.map((s) => s.id)).toEqual(["1", "2", "3"]);
  });

  it("uses the first segment's startSec as the group's startSec", () => {
    const segments = [
      seg({ id: "1", speakerId: "p1", startSec: 42, order: 0 }),
      seg({ id: "2", speakerId: "p1", startSec: 55, order: 1 }),
    ];
    const [group] = groupSegmentsBySpeaker(segments);
    expect(group.startSec).toBe(42);
  });
});
