#!/usr/bin/env python3
"""Stop hook: append the final assistant response text to .agent-logs/<session>.md.

Never blocks: any internal failure is swallowed and logged to
.agent-logs/.hook-errors.log, and the script always exits 0.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capture_common as cc

# The transcript's final text line can lag slightly behind the Stop event
# firing (observed empirically: a real canary response was read before its
# text block was flushed to disk). Retry briefly rather than log an empty
# response.
MAX_RETRIES = 15
RETRY_DELAY_SECONDS = 0.2


def main():
    data = cc.read_stdin_json()
    project_root = cc.project_root_from(data)

    try:
        session_id = data["session_id"]
        transcript_path = data["transcript_path"]

        log_dir = cc.log_dir_for(project_root)
        timestamp = cc.utc_now_iso()

        text, model = cc.final_response_from_transcript(transcript_path)
        retries = 0
        while not text and retries < MAX_RETRIES:
            time.sleep(RETRY_DELAY_SECONDS)
            text, model = cc.final_response_from_transcript(transcript_path)
            retries += 1

        path = cc.find_session_log_path(log_dir, session_id)
        if path is None:
            # A Stop with no prior PROMPT entry shouldn't happen, but don't
            # lose the response if it does.
            path = cc.create_new_session_log(log_dir, session_id, model, timestamp)

        content = cc.read_file(path)
        # Respond against the most recent prompt's exchange number.
        num = cc.max_entry_num(content, "PROMPT") or 1

        cc.append_entry(path, "RESPONSE", num, session_id, timestamp, model, text)

        content = cc.read_file(path)
        content = cc.update_frontmatter_field(content, "model", model)
        cc.write_file(path, content)

    except Exception as exc:  # noqa: BLE001 - never break the session
        cc.log_error(project_root, f"capture_response failed: {exc!r}")

    sys.exit(0)


if __name__ == "__main__":
    main()
