import { groupSegmentsBySpeaker, type TranscriptSegmentLike } from "@/lib/transcript";
import { formatClockTime } from "@/lib/format";

type TranscriptPaneProps = {
  segments: TranscriptSegmentLike[];
};

export function TranscriptPane({ segments }: TranscriptPaneProps) {
  const groups = groupSegmentsBySpeaker(segments);

  return (
    <div className="card max-h-[70vh] overflow-y-auto">
      <ol className="flex flex-col gap-4">
        {groups.map((group, i) => (
          <li key={`${group.speakerId}-${i}`}>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">
                {group.speakerName}
              </span>
              <span className="text-xs text-foreground-muted">
                {formatClockTime(group.startSec)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {group.segments.map((segment) => (
                <p key={segment.id} className="text-sm text-foreground-muted">
                  {segment.text}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
