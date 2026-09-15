"use client";

import { useState, type ReactNode } from "react";

type SummaryTemplate = "ENHANCED" | "BRIEF";

type TemplateSwitcherProps = {
  summaries: { template: SummaryTemplate; content: string }[];
  actionItems: { id: string; text: string; owner: string | null }[];
};

const TEMPLATE_LABELS: Record<SummaryTemplate, string> = {
  ENHANCED: "Enhanced",
  BRIEF: "Brief",
};

/** Minimal renderer for the "## Heading" / "- item" markdown our prompts produce. */
function renderSummaryContent(content: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={blocks.length} className="text-sm text-foreground">
          {paragraph.join(" ")}
        </p>
      );
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h4
          key={blocks.length}
          className="mt-3 text-sm font-semibold text-foreground first:mt-0"
        >
          {line.slice(3)}
        </h4>
      );
    } else if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return blocks;
}

export function TemplateSwitcher({ summaries, actionItems }: TemplateSwitcherProps) {
  const [selected, setSelected] = useState<SummaryTemplate>(
    summaries.find((s) => s.template === "ENHANCED")?.template ??
      summaries[0]?.template ??
      "ENHANCED"
  );

  if (summaries.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-sm font-medium text-foreground">No summary yet</p>
        <p className="text-sm text-foreground-muted">
          A summary hasn&apos;t been generated for this meeting.
        </p>
      </div>
    );
  }

  const active = summaries.find((s) => s.template === selected);

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex gap-2" role="tablist" aria-label="Summary template">
        {summaries.map((s) => (
          <button
            key={s.template}
            type="button"
            role="tab"
            aria-selected={selected === s.template}
            onClick={() => setSelected(s.template)}
            className={selected === s.template ? "btn btn-primary" : "btn btn-secondary"}
          >
            {TEMPLATE_LABELS[s.template]}
          </button>
        ))}
      </div>

      <div>{active ? renderSummaryContent(active.content) : null}</div>

      {actionItems.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Action items</h3>
          <ul className="flex flex-col gap-2">
            {actionItems.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-foreground">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>
                  {item.text}
                  {item.owner && (
                    <span className="text-foreground-muted"> — {item.owner}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
