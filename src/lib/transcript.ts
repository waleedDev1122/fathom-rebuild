export type TranscriptSegmentLike = {
  id: string;
  speakerId: string;
  speakerName: string;
  startSec: number;
  endSec: number;
  text: string;
  order: number;
};

export type SpeakerGroup = {
  speakerId: string;
  speakerName: string;
  startSec: number;
  segments: TranscriptSegmentLike[];
};

/** Groups consecutive segments from the same speaker. Assumes `segments` is already sorted by `order`. */
export function groupSegmentsBySpeaker(
  segments: TranscriptSegmentLike[]
): SpeakerGroup[] {
  const groups: SpeakerGroup[] = [];

  for (const segment of segments) {
    const last = groups[groups.length - 1];
    if (last && last.speakerId === segment.speakerId) {
      last.segments.push(segment);
    } else {
      groups.push({
        speakerId: segment.speakerId,
        speakerName: segment.speakerName,
        startSec: segment.startSec,
        segments: [segment],
      });
    }
  }

  return groups;
}
