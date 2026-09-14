#!/usr/bin/env python3
"""UserPromptSubmit hook: append the verbatim prompt to .agent-logs/<session>.md.

Never blocks the user's actual prompt: any internal failure is swallowed and
logged to .agent-logs/.hook-errors.log, and the script always exits 0.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capture_common as cc


def main():
    data = cc.read_stdin_json()
    project_root = cc.project_root_from(data)

    try:
        session_id = data["session_id"]
        prompt = data.get("prompt", "")
        transcript_path = data.get("transcript_path")

        log_dir = cc.log_dir_for(project_root)
        timestamp = cc.utc_now_iso()

        model = cc.model_from_transcript(transcript_path) if transcript_path else cc.DEFAULT_MODEL

        path = cc.find_session_log_path(log_dir, session_id)
        if path is None:
            path = cc.create_new_session_log(log_dir, session_id, model, timestamp)

        content = cc.read_file(path)
        num = cc.max_entry_num(content, "PROMPT") + 1

        cc.append_entry(path, "PROMPT", num, session_id, timestamp, model, prompt)

        content = cc.read_file(path)
        content = cc.update_frontmatter_field(content, "total_exchanges", num)
        content = cc.update_frontmatter_field(content, "last_prompt_time", timestamp)
        content = cc.update_frontmatter_field(content, "model", model)
        cc.write_file(path, content)

    except Exception as exc:  # noqa: BLE001 - never break the user's prompt
        cc.log_error(project_root, f"capture_prompt failed: {exc!r}")

    sys.exit(0)


if __name__ == "__main__":
    main()
