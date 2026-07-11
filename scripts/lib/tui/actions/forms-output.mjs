const DEFAULT_MAX_OUTPUT_LINES = 40;
const DEFAULT_MAX_OUTPUT_BYTES = 4 * 1024;

export function sanitizeTerminalOutput(text) {
  if (typeof text !== "string" || text.length === 0) {
    return "";
  }

  return text
    .replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\u001b[@-_]/g, "")
    .replace(/\u009d[^\u0007\u001b\u009c]*(?:\u0007|\u001b\\|\u009c)/g, "")
    .replace(/\u009b[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u0080-\u009f]/g, "?");
}

function appendBoundedLines(targetLines, sourceLines, state, maxOutputLines, maxOutputBytes) {
  for (const line of sourceLines) {
    const lineBytes = Buffer.byteLength(line) + 1;
    if (targetLines.length >= maxOutputLines || state.bytes + lineBytes > maxOutputBytes) {
      state.truncated = true;
      return;
    }

    targetLines.push(line);
    state.bytes += lineBytes;
  }
}

export function getOutputLines(outputState, { maxOutputLines = DEFAULT_MAX_OUTPUT_LINES, maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES } = {}) {
  const stdout = sanitizeTerminalOutput(outputState.result.stdout).trimEnd();
  const stderr = sanitizeTerminalOutput(outputState.result.stderr).trimEnd();
  const lines = [
    `Output [${outputState.result.ok ? "ok" : "fail"}]`,
    `Action: ${sanitizeTerminalOutput(outputState.action.label)}`,
    `CLI equivalent: ${sanitizeTerminalOutput(outputState.action.cliEquivalent)}`,
  ];
  const state = { bytes: 0, truncated: false };
  if (outputState.result.timedOut) lines.push("Result: command timed out before it finished.");
  if (stdout.trim()) appendBoundedLines(lines, ["", "stdout", ...stdout.split("\n")], state, maxOutputLines, maxOutputBytes);
  if (stderr.trim()) appendBoundedLines(lines, ["", "stderr", ...stderr.split("\n")], state, maxOutputLines, maxOutputBytes);
  if (outputState.result.stdoutTruncated || outputState.result.stderrTruncated) {
    state.truncated = true;
  }
  if (state.truncated) {
    while (lines.length >= maxOutputLines) {
      lines.pop();
    }
    lines.push("[output truncated]");
  }
  return [...lines, "", "Press Enter or Esc to close this output panel."];
}
