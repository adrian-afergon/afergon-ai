// This contract suite exercises TypeScript sources and emitted JavaScript runtime modules.
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import * as actionDefinitionsTypeScript from "../scripts/lib/tui/actions/definitions.ts";
import * as actionRunnerTypeScript from "../scripts/lib/tui/actions/runner.ts";
import { createActionDefinition } from "../scripts/lib/tui/actions/definitions.js";
import {
  createActionDefinition as createActionDefinitionRuntime,
  formatActionCliEquivalent as formatActionCliEquivalentRuntime,
  resolveActionArgv as resolveActionArgvRuntime,
} from "../scripts/lib/tui/actions/definitions.js";
import {
  appendConfirmationCharacter,
  appendFormCharacter,
  backspaceFormCharacter,
  backspaceConfirmationCharacter,
  changeFormValue,
  createCheckboxFormState,
  createConfirmationState,
  createFormState,
  getCheckboxFormSubmitState,
  getFormInput,
  getFormSubmitState,
  getOutputLines,
  moveCheckboxFormSelection,
  moveFormSelection,
  sanitizeTerminalOutput,
  toggleCheckboxFormSelection,
  validateConfirmationState,
  validateFormInput,
} from "../scripts/lib/tui/actions/forms.js";
import { runActionCommand } from "../scripts/lib/tui/actions/runner.js";
import { buildCommandArgv } from "../scripts/lib/tui/command-manifest.js";
import { createTuiApp } from "../scripts/tui.js";

class FakeTerminal {
  constructor() { this.columns = 100; this.rows = 30; this.kittyProtocolActive = false; this.output = ""; this.stopCalls = 0; }
  start(onInput, onResize) { this.onInput = onInput; this.onResize = onResize; }
  stop() { this.stopCalls += 1; }
  async drainInput() {}
  write(data) { this.output += data; }
  moveBy() {}
  hideCursor() {}
  showCursor() {}
  clearLine() {}
  clearFromCursor() {}
  clearScreen() {}
  setTitle(title) { this.title = title; }
  setProgress() {}
  emitInput(data) { this.onInput?.(data); }
}

class FakeChildProcess {
  constructor() { this.stdout = { on: vi.fn() }; this.stderr = { on: vi.fn() }; this.handlers = new Map(); this.kill = vi.fn(() => { this.killed = true; }); }
  on(event, handler) { this.handlers.set(event, handler); return this; }
  emitStdout(chunk) { this.stdout.on.mock.calls.find(([event]) => event === "data")?.[1](chunk); }
  emitStderr(chunk) { this.stderr.on.mock.calls.find(([event]) => event === "data")?.[1](chunk); }
  emit(event, ...args) { this.handlers.get(event)?.(...args); }
}

const flushTui = async () => { await new Promise((resolve) => process.nextTick(resolve)); await new Promise((resolve) => setTimeout(resolve, 0)); };
const getStatusFixture = () => ({ title: "Status", summary: { label: "Readiness", state: "ok", detail: "Ready for guided workflows." }, items: [{ id: "opencode", label: "OpenCode", state: "ok", detail: "Managed install detected." }], actions: [] });
const getThrownMessage = (callback) => {
  try {
    callback();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

describe("runActionCommand", () => {
  it("keeps the TypeScript action runner aligned with the source runtime contract for successful execution", async () => {
    const createSpawnImpl = () => {
      const child = new FakeChildProcess();
      const spawnImpl = vi.fn(() => {
        queueMicrotask(() => {
          child.emitStdout("doctor ok\n");
          child.emit("close", 0);
        });
        return child;
      });

      return { child, spawnImpl };
    };

    const runtime = createSpawnImpl();
    const runtimeResult = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      cwd: "/tmp/afergon-ai",
      spawnImpl: runtime.spawnImpl,
    });

    const typeScript = createSpawnImpl();
    const typeScriptResult = await actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      cwd: "/tmp/afergon-ai",
      spawnImpl: typeScript.spawnImpl,
    });

    expect(typeScriptResult).toEqual(runtimeResult);
    expect(typeScript.spawnImpl).toHaveBeenCalledWith(
      process.execPath,
      ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      expect.objectContaining({ cwd: "/tmp/afergon-ai", shell: false }),
    );
  });

  it("keeps the TypeScript action runner aligned with the source runtime contract for failure and timeout paths", async () => {
    const runtimeFailureChild = new FakeChildProcess();
    const runtimeFailure = runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "update"],
      spawnImpl: vi.fn(() => {
        queueMicrotask(() => {
          runtimeFailureChild.emitStderr("permission denied\n");
          runtimeFailureChild.emit("close", 1);
        });
        return runtimeFailureChild;
      }),
    });

    const typeScriptFailureChild = new FakeChildProcess();
    const typeScriptFailure = actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "update"],
      spawnImpl: vi.fn(() => {
        queueMicrotask(() => {
          typeScriptFailureChild.emitStderr("permission denied\n");
          typeScriptFailureChild.emit("close", 1);
        });
        return typeScriptFailureChild;
      }),
    });

    await expect(typeScriptFailure).resolves.toEqual(await runtimeFailure);

    const runtimeTimeoutChild = new FakeChildProcess();
    const runtimeTimeout = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor"],
      timeoutMs: 5,
      spawnImpl: vi.fn(() => runtimeTimeoutChild),
    });

    const typeScriptTimeoutChild = new FakeChildProcess();
    const typeScriptTimeout = await actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor"],
      timeoutMs: 5,
      spawnImpl: vi.fn(() => typeScriptTimeoutChild),
    });

    expect(typeScriptTimeout).toEqual(runtimeTimeout);
    expect(typeScriptTimeoutChild.kill).toHaveBeenCalled();
  });

  it("keeps the TypeScript action runner aligned with the source runtime contract when output truncates at configured limits", async () => {
    const createSpawnImpl = () => {
      const child = new FakeChildProcess();
      const spawnImpl = vi.fn(() => {
        queueMicrotask(() => {
          child.emitStdout("one\ntwo\nthree\nfour\n");
          child.emitStderr("err-one\nerr-two\nerr-three\n");
          child.emit("close", 1);
        });
        return child;
      });

      return { spawnImpl };
    };

    const runtime = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      spawnImpl: createSpawnImpl().spawnImpl,
      maxStreamBytes: 12,
      maxStreamLines: 2,
    });

    const typeScript = await actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      spawnImpl: createSpawnImpl().spawnImpl,
      maxStreamBytes: 12,
      maxStreamLines: 2,
    });

    expect(typeScript).toEqual(runtime);
    expect(typeScript).toEqual(expect.objectContaining({
      stdoutTruncated: true,
      stderrTruncated: true,
      stdout: "one\ntwo\n",
      stderr: "err-one\nerr-",
    }));
  });

  it("builds explicit argv arrays from stable manifest entries without fabricating shell commands", () => {
    const argv = buildCommandArgv("doctor", ["--opencode"]);
    expect(argv).toEqual(["doctor", "--opencode"]);
    expect(() => argv.push("--mutated")).toThrow(TypeError);
    expect(() => buildCommandArgv("doctor", "--opencode")).toThrow(/argv array/i);
  });

  it("spawns explicit argv arrays with shell disabled and captures output", async () => {
    const child = new FakeChildProcess();
    const spawnImpl = vi.fn(() => { queueMicrotask(() => { child.emitStdout("doctor ok\n"); child.emit("close", 0); }); return child; });
    const result = await runActionCommand({ command: process.execPath, argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"], cwd: "/tmp/afergon-ai", spawnImpl });
    expect(spawnImpl).toHaveBeenCalledWith(process.execPath, ["scripts/cli-dispatch.js", "doctor", "--opencode"], expect.objectContaining({ cwd: "/tmp/afergon-ai", shell: false }));
    expect(result).toEqual(expect.objectContaining({ ok: true, exitCode: 0, stdout: "doctor ok\n", stderr: "" }));
  });

  it("reports stderr and timeout failures without falling back to a shell string", async () => {
    const failureChild = new FakeChildProcess();
    const failureResult = runActionCommand({ command: process.execPath, argv: ["scripts/cli-dispatch.js", "update"], spawnImpl: vi.fn(() => { queueMicrotask(() => { failureChild.emitStderr("permission denied\n"); failureChild.emit("close", 1); }); return failureChild; }) });
    await expect(failureResult).resolves.toEqual(expect.objectContaining({ ok: false, exitCode: 1, stderr: "permission denied\n", timedOut: false }));

    const timeoutChild = new FakeChildProcess();
    const timeoutResult = await runActionCommand({ command: process.execPath, argv: ["scripts/cli-dispatch.js", "doctor"], timeoutMs: 5, spawnImpl: vi.fn(() => timeoutChild) });
    expect(timeoutChild.kill).toHaveBeenCalled();
    expect(timeoutResult).toEqual(expect.objectContaining({ ok: false, exitCode: null, timedOut: true }));
  });

  it("caps captured stdout and stderr, marks truncation, and preserves failure metadata", async () => {
    const child = new FakeChildProcess();
    const spawnImpl = vi.fn(() => {
      queueMicrotask(() => {
        child.emitStdout("one\ntwo\nthree\nfour\n");
        child.emitStderr("err-one\nerr-two\nerr-three\n");
        child.emit("close", 1);
      });
      return child;
    });

    const result = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      spawnImpl,
      maxStreamBytes: 12,
      maxStreamLines: 2,
    });

    expect(result).toEqual(expect.objectContaining({
      ok: false,
      exitCode: 1,
      timedOut: false,
      stdout: "one\ntwo\n",
      stderr: "err-one\nerr-",
      stdoutTruncated: true,
      stderrTruncated: true,
    }));
  });

  it("does not mark truncation when stdout or stderr lands exactly on the configured byte and line boundaries", async () => {
    const child = new FakeChildProcess();
    const spawnImpl = vi.fn(() => {
      queueMicrotask(() => {
        child.emitStdout("one\ntwo\n");
        child.emitStderr("12345678");
        child.emit("close", 0);
      });
      return child;
    });

    const result = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.js", "doctor", "--opencode"],
      spawnImpl,
      maxStreamBytes: 8,
      maxStreamLines: 2,
    });

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      exitCode: 0,
      timedOut: false,
      stdout: "one\ntwo\n",
      stderr: "12345678",
      stdoutTruncated: false,
      stderrTruncated: false,
    }));
  });

  it("rejects executable action definitions that are not built from the stable manifest allowlist", () => {
    expect(() => createActionDefinition({ id: "status-unsafe", section: "status", kind: "read", label: "Unsafe", argv: ["bash", "-lc", "rm -rf /"] })).toThrow(/stable manifest/i);
    expect(createActionDefinition({ id: "status-safe", section: "status", kind: "read", label: "Safe", argv: buildCommandArgv("doctor", ["--opencode"]) })).toEqual(expect.objectContaining({ argv: ["doctor", "--opencode"] }));
  });
});

describe("action definitions TypeScript parity", () => {
  it("keeps formatActionCliEquivalent aligned with the source runtime contract across valid and invalid argv inputs", () => {
    expect(actionDefinitionsTypeScript.formatActionCliEquivalent(["doctor", "--opencode"]))
      .toBe(formatActionCliEquivalentRuntime(["doctor", "--opencode"]));

    for (const invalidArgv of [undefined, [], ["doctor", ""], ["doctor", 1]]) {
      expect(getThrownMessage(() => actionDefinitionsTypeScript.formatActionCliEquivalent(invalidArgv)))
        .toBe(getThrownMessage(() => formatActionCliEquivalentRuntime(invalidArgv)));
    }
  });

  it("keeps resolveActionArgv aligned with the source runtime contract for static, built, and invalid actions", () => {
    const staticAction = createActionDefinitionRuntime({
      id: "status-doctor",
      section: "status",
      kind: "read",
      label: "Run doctor",
      argv: buildCommandArgv("doctor", ["--opencode"]),
    });
    const builtAction = createActionDefinitionRuntime({
      id: "configuration-init",
      section: "configuration",
      kind: "mutate",
      label: "Initialize project files",
      buildArgv: ({ selectedIds = [] }) => buildCommandArgv("init", selectedIds.map((id) => `--${id}`)),
    });

    expect(actionDefinitionsTypeScript.resolveActionArgv(staticAction)).toEqual(resolveActionArgvRuntime(staticAction));
    expect(actionDefinitionsTypeScript.resolveActionArgv(builtAction, { selectedIds: ["one", "two"] }))
      .toEqual(resolveActionArgvRuntime(builtAction, { selectedIds: ["one", "two"] }));

    const invalidBuilderAction = {
      ...builtAction,
      buildArgv: () => ["bash", "-lc", "rm -rf /"],
    };
    const missingExecutableAction = {
      ...staticAction,
      argv: undefined,
    };

    expect(() => actionDefinitionsTypeScript.resolveActionArgv(invalidBuilderAction)).toThrow(/stable manifest/i);
    expect(() => resolveActionArgvRuntime(invalidBuilderAction)).toThrow(/stable manifest/i);
    expect(() => actionDefinitionsTypeScript.resolveActionArgv(missingExecutableAction)).toThrow(/missing executable argv/i);
    expect(() => resolveActionArgvRuntime(missingExecutableAction)).toThrow(/missing executable argv/i);
  });

  it("keeps createActionDefinition aligned with the source runtime contract across supported and invalid forms", () => {
    const checkboxDefinition = {
      id: "configuration-init",
      section: "configuration",
      kind: "mutate",
      label: "Initialize project files",
      buildArgv: ({ selectedIds = [] }) => buildCommandArgv("init", selectedIds.map((id) => `--${id}`)),
      form: {
        kind: "checkboxes",
        title: "Choose what to initialize",
        options: [
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ],
      },
      confirmLabel: "Initialize the selected surfaces?",
      refreshTarget: "configuration",
    };

    expect(actionDefinitionsTypeScript.createActionDefinition(checkboxDefinition)).toEqual(
      createActionDefinitionRuntime(checkboxDefinition),
    );

    const pickerDefinition = {
      id: "models-picker",
      section: "model-profiles",
      kind: "read",
      label: "Choose model",
      argv: buildCommandArgv("models"),
      form: {
        kind: "picker",
        title: "Choose a model",
        options: [{ id: "default", label: "Default" }],
      },
    };
    expect(actionDefinitionsTypeScript.createActionDefinition(pickerDefinition)).toEqual(
      createActionDefinitionRuntime(pickerDefinition),
    );

    const fieldsDefinition = {
      id: "models-create-profile",
      section: "model-profiles",
      kind: "mutate",
      label: "Create profile",
      buildArgv: ({ profileName }) => buildCommandArgv("models", ["create-profile", profileName]),
      form: {
        kind: "fields",
        title: "Create profile",
        fields: [{ id: "profileName", label: "Profile name" }],
      },
    };
    expect(actionDefinitionsTypeScript.createActionDefinition(fieldsDefinition)).toEqual(
      createActionDefinitionRuntime(fieldsDefinition),
    );

    const invalidDefinitions = [
      [{ id: "status-invalid", section: "status", kind: "read", label: "Invalid", argv: buildCommandArgv("doctor"), form: { kind: "picker", options: [] } }, /non-empty options definition/i],
      [{ id: "status-invalid", section: "status", kind: "read", label: "Invalid", argv: buildCommandArgv("doctor"), form: { kind: "fields", fields: [] } }, /non-empty fields definition/i],
      [{ id: "status-invalid", section: "status", kind: "read", label: "Invalid", argv: buildCommandArgv("doctor"), form: { kind: "wizard" } }, /unsupported action form kind/i],
    ];

    for (const [definition, errorPattern] of invalidDefinitions) {
      expect(() => actionDefinitionsTypeScript.createActionDefinition(definition)).toThrow(errorPattern);
      expect(() => createActionDefinitionRuntime(definition)).toThrow(errorPattern);
    }
  });
});

describe("sanitizeTerminalOutput", () => {
  it("keeps the extracted confirmation runtime module aligned with shared form helpers", async () => {
    const runtimeExtracted = await import("../dist/scripts/lib/tui/actions/forms-confirmation.js");
    const action = {
      id: "remove-profile",
      confirmation: {
        kind: "typed-match",
        expectedText: "danger\n\u009b31mprofile\u009b0m",
        mismatchMessage: "Type the selected profile name to continue.",
      },
    };

    expect(runtimeExtracted.createConfirmationState({ action })).toEqual(createConfirmationState({ action }));

    const editedState = appendConfirmationCharacter(
      appendConfirmationCharacter(createConfirmationState({ action }), "d"),
      "a",
    );

    expect(runtimeExtracted.backspaceConfirmationCharacter(editedState)).toEqual(
      backspaceConfirmationCharacter(editedState),
    );
    expect(runtimeExtracted.validateConfirmationState({
      ...editedState,
      value: "danger\nprofile",
    })).toEqual(validateConfirmationState({
      ...editedState,
      value: "danger\nprofile",
    }));
  });

  it("keeps the extracted confirmation TypeScript mirror in parity with the runtime module", async () => {
    const runtimeExtracted = await import("../dist/scripts/lib/tui/actions/forms-confirmation.js");
    const typeScriptExtracted = await import("../scripts/lib/tui/actions/forms-confirmation.ts");
    const action = {
      id: "remove-profile",
      confirmation: {
        kind: "typed-match",
        expectedText: "danger\n\u009b31mprofile\u009b0m",
      },
    };
    const initialState = runtimeExtracted.createConfirmationState({ action });

    expect(typeScriptExtracted.createConfirmationState({ action })).toEqual(initialState);
    expect(typeScriptExtracted.appendConfirmationCharacter(initialState, "x")).toEqual(
      runtimeExtracted.appendConfirmationCharacter(initialState, "x"),
    );

    const dirtyState = {
      ...initialState,
      value: "danger\nprofile",
      validationMessage: "previous error",
    };

    expect(typeScriptExtracted.backspaceConfirmationCharacter(dirtyState)).toEqual(
      runtimeExtracted.backspaceConfirmationCharacter(dirtyState),
    );
    expect(typeScriptExtracted.validateConfirmationState(dirtyState)).toEqual(
      runtimeExtracted.validateConfirmationState(dirtyState),
    );
    expect(typeScriptExtracted.validateConfirmationState({
      ...dirtyState,
      value: "danger\nother",
      confirmation: {
        kind: "typed-match",
        expectedText: "danger\n\u009b31mprofile\u009b0m",
        mismatchMessage: "Type the selected profile name to continue.",
      },
    })).toEqual(runtimeExtracted.validateConfirmationState({
      ...dirtyState,
      value: "danger\nother",
      confirmation: {
        kind: "typed-match",
        expectedText: "danger\n\u009b31mprofile\u009b0m",
        mismatchMessage: "Type the selected profile name to continue.",
      },
    }));
  });

  it("keeps the extracted forms-output runtime module aligned with shared form helpers", async () => {
    const runtimeExtracted = await import("../dist/scripts/lib/tui/actions/forms-output.js");

    expect(runtimeExtracted.sanitizeTerminalOutput("safe\n\u009b31mred\u009b0m\n")).toBe(
      sanitizeTerminalOutput("safe\n\u009b31mred\u009b0m\n"),
    );
    expect(runtimeExtracted.getOutputLines({
      action: { label: "Run doctor", cliEquivalent: "afergon-ai doctor --opencode" },
      result: {
        ok: false,
        timedOut: true,
        stdout: "alpha\nbeta\n",
        stderr: "warn\n",
        stdoutTruncated: false,
        stderrTruncated: false,
      },
    }, {
      maxOutputLines: 7,
      maxOutputBytes: 80,
    })).toEqual(getOutputLines({
      action: { label: "Run doctor", cliEquivalent: "afergon-ai doctor --opencode" },
      result: {
        ok: false,
        timedOut: true,
        stdout: "alpha\nbeta\n",
        stderr: "warn\n",
        stdoutTruncated: false,
        stderrTruncated: false,
      },
    }, {
      maxOutputLines: 7,
      maxOutputBytes: 80,
    }));
  });

  it("keeps the extracted forms-output TypeScript mirror in parity with the runtime module", async () => {
    const runtimeExtracted = await import("../dist/scripts/lib/tui/actions/forms-output.js");
    const typeScriptExtracted = await import("../scripts/lib/tui/actions/forms-output.ts");

    for (const value of ["", "safe\n\u009b31mred\u009b0m\n\u009d2;owned\u0007tail\u0085done\n", 42, null]) {
      expect(typeScriptExtracted.sanitizeTerminalOutput(value)).toBe(runtimeExtracted.sanitizeTerminalOutput(value));
    }

    const exactBoundaryOutputState = {
      action: { label: "Run doctor", cliEquivalent: "afergon-ai doctor --opencode" },
      result: {
        ok: true,
        timedOut: false,
        stdout: "one\ntwo\n",
        stderr: "12345678",
        stdoutTruncated: false,
        stderrTruncated: false,
      },
    };

    expect(typeScriptExtracted.getOutputLines(exactBoundaryOutputState, {
      maxOutputLines: 8,
      maxOutputBytes: 8,
    })).toEqual(runtimeExtracted.getOutputLines(exactBoundaryOutputState, {
      maxOutputLines: 8,
      maxOutputBytes: 8,
    }));
  });

  it("keeps the extracted forms-state TypeScript mirror in parity with the runtime module", async () => {
    const runtimeExtracted = await import("../dist/scripts/lib/tui/actions/forms-state.js");
    const typeScriptExtracted = await import("../scripts/lib/tui/actions/forms-state.ts");
    const checkboxAction = {
      id: "configuration-init",
      form: {
        kind: "checkboxes",
        options: [
          { id: "all", label: "All" },
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ],
      },
    };
    const checkboxState = runtimeExtracted.createFormState({ action: checkboxAction });

    expect(typeScriptExtracted.createFormState({ action: checkboxAction })).toEqual(checkboxState);
    expect(typeScriptExtracted.moveFormSelection({ ...checkboxState, validationMessage: "old" }, -1)).toEqual(
      runtimeExtracted.moveFormSelection({ ...checkboxState, validationMessage: "old" }, -1),
    );
    expect(typeScriptExtracted.toggleCheckboxFormSelection({
      ...checkboxState,
      activeIndex: 1,
      validationMessage: "old",
    })).toEqual(runtimeExtracted.toggleCheckboxFormSelection({
      ...checkboxState,
      activeIndex: 1,
      validationMessage: "old",
    }));
    expect(typeScriptExtracted.getFormSubmitState({ ...checkboxState, activeIndex: 3 })).toEqual(
      runtimeExtracted.getFormSubmitState({ ...checkboxState, activeIndex: 3 }),
    );
    expect(typeScriptExtracted.getFormInput({ ...checkboxState, selectedIds: ["one", "two"] })).toEqual(
      runtimeExtracted.getFormInput({ ...checkboxState, selectedIds: ["one", "two"] }),
    );

    const fieldsAction = {
      id: "remove-profile",
      form: {
        kind: "fields",
        fields: [
          { id: "profileName", label: "Profile name", type: "text", required: true },
          {
            id: "confirmName",
            label: "Confirm profile name",
            type: "text",
            matchesSanitizedFieldId: "profileName",
            mismatchMessage: "Type the selected profile name to continue.",
          },
          { id: "applyEverywhere", label: "Apply everywhere", type: "toggle", initialValue: true },
          {
            id: "adapter",
            label: "Adapter",
            type: "picker",
            options: [{ id: "claude", label: "Claude" }, { id: "gemini", label: "Gemini" }],
          },
        ],
      },
    };
    const fieldsState = runtimeExtracted.createFormState({ action: fieldsAction });

    expect(typeScriptExtracted.changeFormValue({ ...fieldsState, activeIndex: 2, validationMessage: "old" }, 1)).toEqual(
      runtimeExtracted.changeFormValue({ ...fieldsState, activeIndex: 2, validationMessage: "old" }, 1),
    );
    expect(typeScriptExtracted.changeFormValue({ ...fieldsState, activeIndex: 3, validationMessage: "old" }, -1)).toEqual(
      runtimeExtracted.changeFormValue({ ...fieldsState, activeIndex: 3, validationMessage: "old" }, -1),
    );
    expect(typeScriptExtracted.appendFormCharacter({ ...fieldsState, validationMessage: "old" }, "A")).toEqual(
      runtimeExtracted.appendFormCharacter({ ...fieldsState, validationMessage: "old" }, "A"),
    );
    expect(typeScriptExtracted.backspaceFormCharacter({
      ...fieldsState,
      values: { ...fieldsState.values, profileName: "Alice" },
      validationMessage: "old",
    })).toEqual(runtimeExtracted.backspaceFormCharacter({
      ...fieldsState,
      values: { ...fieldsState.values, profileName: "Alice" },
      validationMessage: "old",
    }));
    expect(typeScriptExtracted.validateFormInput({
      ...fieldsState,
      values: {
        ...fieldsState.values,
        profileName: "\u009b31mAlice\u009b0m",
        confirmName: "Alice",
      },
    })).toEqual(runtimeExtracted.validateFormInput({
      ...fieldsState,
      values: {
        ...fieldsState.values,
        profileName: "\u009b31mAlice\u009b0m",
        confirmName: "Alice",
      },
    }));

    const omittedTypeAction = {
      id: "omitted-type",
      form: {
        kind: "fields",
        fields: [
          {
            id: "implicitText",
            label: "Implicit text",
            initialValue: "seed",
            required: true,
            matchesSanitizedFieldId: "explicitText",
          },
          {
            id: "explicitText",
            label: "Explicit text",
            type: "text",
            initialValue: "reference",
          },
        ],
      },
    };
    const omittedTypeState = runtimeExtracted.createFormState({ action: omittedTypeAction });

    expect(typeScriptExtracted.createFormState({ action: omittedTypeAction })).toEqual(omittedTypeState);
    expect(typeScriptExtracted.appendFormCharacter({ ...omittedTypeState, validationMessage: "old" }, "A")).toEqual(
      runtimeExtracted.appendFormCharacter({ ...omittedTypeState, validationMessage: "old" }, "A"),
    );
    expect(typeScriptExtracted.backspaceFormCharacter({
      ...omittedTypeState,
      values: { ...omittedTypeState.values, implicitText: "value" },
      validationMessage: "old",
    })).toEqual(runtimeExtracted.backspaceFormCharacter({
      ...omittedTypeState,
      values: { ...omittedTypeState.values, implicitText: "value" },
      validationMessage: "old",
    }));
    expect(typeScriptExtracted.validateFormInput({
      ...omittedTypeState,
      values: { ...omittedTypeState.values, implicitText: "", explicitText: "reference" },
    })).toEqual(runtimeExtracted.validateFormInput({
      ...omittedTypeState,
      values: { ...omittedTypeState.values, implicitText: "", explicitText: "reference" },
    }));

    const nonStringInitialValueAction = {
      id: "non-string-initial-value",
      form: {
        kind: "fields",
        fields: [
          {
            id: "profileName",
            label: "Profile name",
            type: "text",
            initialValue: 42,
          },
        ],
      },
    };
    const nonStringInitialValueState = runtimeExtracted.createFormState({ action: nonStringInitialValueAction });

    expect(typeScriptExtracted.createFormState({ action: nonStringInitialValueAction })).toEqual(nonStringInitialValueState);
    expect(typeScriptExtracted.appendFormCharacter({ ...nonStringInitialValueState, validationMessage: "old" }, "A")).toEqual(
      runtimeExtracted.appendFormCharacter({ ...nonStringInitialValueState, validationMessage: "old" }, "A"),
    );
    expect(typeScriptExtracted.backspaceFormCharacter({ ...nonStringInitialValueState, validationMessage: "old" })).toEqual(
      runtimeExtracted.backspaceFormCharacter({ ...nonStringInitialValueState, validationMessage: "old" }),
    );
  });

  it("creates and updates checkbox form state while clearing validation noise", () => {
    const action = {
      id: "configuration-init",
      form: {
        kind: "checkboxes",
        options: [
          { id: "all", label: "All" },
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ],
      },
    };

    const initialState = createCheckboxFormState({ action });
    expect(initialState).toEqual({
      kind: "form",
      formKind: "checkboxes",
      actionId: "configuration-init",
      action,
      activeIndex: 0,
      selectedIds: ["all"],
      validationMessage: "",
    });
    expect(createFormState({ action })).toEqual(initialState);

    const wrappedState = moveCheckboxFormSelection({
      ...initialState,
      validationMessage: "Choose at least one option.",
    }, -1);
    expect(wrappedState).toEqual({
      ...initialState,
      activeIndex: 4,
      validationMessage: "",
    });
    expect(moveFormSelection({ ...initialState, validationMessage: "old" }, 1)).toEqual({
      ...initialState,
      activeIndex: 1,
      validationMessage: "",
    });

    const selectedSpecific = toggleCheckboxFormSelection({
      ...initialState,
      activeIndex: 1,
      validationMessage: "old",
    });
    expect(selectedSpecific).toEqual({
      ...initialState,
      activeIndex: 1,
      selectedIds: ["one"],
      validationMessage: "",
    });
    expect(toggleCheckboxFormSelection({
      ...selectedSpecific,
      activeIndex: 1,
    })).toEqual({
      ...selectedSpecific,
      activeIndex: 1,
      selectedIds: [],
      validationMessage: "",
    });
    expect(toggleCheckboxFormSelection({
      ...selectedSpecific,
      activeIndex: 0,
    })).toEqual({
      ...selectedSpecific,
      activeIndex: 0,
      selectedIds: ["all"],
      validationMessage: "",
    });
    const missingCheckboxOptionState = { ...initialState, activeIndex: 9 };
    expect(toggleCheckboxFormSelection(missingCheckboxOptionState)).toBe(missingCheckboxOptionState);
    expect(getCheckboxFormSubmitState({ ...initialState, activeIndex: 3 })).toEqual({ isSubmit: true, isCancel: false });
    expect(getCheckboxFormSubmitState({ ...initialState, activeIndex: 4 })).toEqual({ isSubmit: false, isCancel: true });
    expect(getFormSubmitState({ ...initialState, activeIndex: 4 })).toEqual({ isSubmit: false, isCancel: true });
    expect(getFormInput({ ...selectedSpecific, selectedIds: ["one", "two"] })).toEqual({
      selectedIds: ["one", "two"],
    });
  });

  it("handles picker and field form state navigation, editing, and validation", () => {
    const pickerAction = {
      id: "models-picker",
      form: {
        kind: "picker",
        options: [{ id: "claude", label: "Claude" }, { id: "gemini", label: "Gemini" }],
      },
    };
    const pickerState = createFormState({ action: pickerAction });

    expect(pickerState).toEqual({
      kind: "form",
      formKind: "picker",
      actionId: "models-picker",
      action: pickerAction,
      activeIndex: 0,
      selectedId: "claude",
      validationMessage: "",
    });
    expect(moveFormSelection({ ...pickerState, validationMessage: "old" }, -1)).toEqual({
      ...pickerState,
      activeIndex: 2,
      validationMessage: "",
    });
    expect(getFormSubmitState({ ...pickerState, activeIndex: 1 })).toEqual({ isSubmit: true, isCancel: false });
    expect(getFormSubmitState({ ...pickerState, activeIndex: 2 })).toEqual({ isSubmit: false, isCancel: true });
    expect(getFormInput({ ...pickerState, activeIndex: 1 })).toEqual({ selectedId: "gemini" });
    expect(getFormInput({ ...pickerState, activeIndex: 9 })).toEqual({ selectedId: "claude" });

    const fieldsAction = {
      id: "remove-profile",
      form: {
        kind: "fields",
        fields: [
          { id: "profileName", label: "Profile name", type: "text", required: true, requiredMessage: "Profile name is required." },
          {
            id: "confirmName",
            label: "Confirm profile name",
            type: "text",
            matchesSanitizedFieldId: "profileName",
            mismatchMessage: "Type the selected profile name to continue.",
          },
          { id: "applyEverywhere", label: "Apply everywhere", type: "toggle", initialValue: true },
          {
            id: "adapter",
            label: "Adapter",
            type: "picker",
            options: [{ id: "claude", label: "Claude" }, { id: "gemini", label: "Gemini" }],
          },
        ],
      },
    };
    const fieldsState = createFormState({ action: fieldsAction });

    expect(fieldsState).toEqual({
      kind: "form",
      formKind: "fields",
      actionId: "remove-profile",
      action: fieldsAction,
      activeIndex: 0,
      values: {
        profileName: "",
        confirmName: "",
        applyEverywhere: true,
        adapter: "claude",
      },
      validationMessage: "",
    });
    expect(moveFormSelection({ ...fieldsState, validationMessage: "old" }, -1).activeIndex).toBe(5);
    expect(changeFormValue({ ...fieldsState, activeIndex: 2, validationMessage: "old" }, 1)).toEqual({
      ...fieldsState,
      activeIndex: 2,
      values: {
        ...fieldsState.values,
        applyEverywhere: false,
      },
      validationMessage: "",
    });
    expect(changeFormValue({ ...fieldsState, activeIndex: 3, validationMessage: "old" }, -1)).toEqual({
      ...fieldsState,
      activeIndex: 3,
      values: {
        ...fieldsState.values,
        adapter: "gemini",
      },
      validationMessage: "",
    });
    const inactiveTextFieldState = { ...fieldsState, activeIndex: 0 };
    expect(changeFormValue(inactiveTextFieldState, 1)).toBe(inactiveTextFieldState);

    const appended = appendFormCharacter({ ...fieldsState, validationMessage: "old" }, "A");
    expect(appended).toEqual({
      ...fieldsState,
      values: {
        ...fieldsState.values,
        profileName: "A",
      },
      validationMessage: "",
    });
    expect(backspaceFormCharacter({
      ...appended,
      values: {
        ...appended.values,
        profileName: "Alice",
      },
      validationMessage: "old",
    })).toEqual({
      ...fieldsState,
      values: {
        ...fieldsState.values,
        profileName: "Alic",
      },
      validationMessage: "",
    });
    const toggleFieldState = { ...fieldsState, activeIndex: 2 };
    expect(appendFormCharacter(toggleFieldState, "A")).toBe(toggleFieldState);
    expect(backspaceFormCharacter(toggleFieldState)).toBe(toggleFieldState);

    expect(validateFormInput(fieldsState)).toEqual({
      ok: false,
      message: "Profile name is required.",
      activeIndex: 0,
    });
    expect(validateFormInput({
      ...fieldsState,
      values: {
        ...fieldsState.values,
        profileName: "\u009b31mAlice\u009b0m",
        confirmName: "Alice",
      },
    })).toEqual({
      ok: true,
      input: {
        profileName: "\u009b31mAlice\u009b0m",
        confirmName: "Alice",
        applyEverywhere: true,
        adapter: "claude",
      },
    });
    expect(validateFormInput({
      ...fieldsState,
      values: {
        ...fieldsState.values,
        profileName: "Alice",
        confirmName: "Bob",
      },
    })).toEqual({
      ok: false,
      message: "Type the selected profile name to continue.",
      activeIndex: 1,
    });
    expect(getFormSubmitState({ ...fieldsState, activeIndex: 4 })).toEqual({ isSubmit: true, isCancel: false });
    expect(getFormSubmitState({ ...fieldsState, activeIndex: 5 })).toEqual({ isSubmit: false, isCancel: true });
    expect(getFormInput(fieldsState)).toEqual(fieldsState.values);
    expect(() => createFormState({ action: { id: "bad", form: { kind: "wizard" } } })).toThrow(
      "Unsupported form kind: wizard",
    );
  });

  it("removes C1 control sequences while preserving printable text and newlines", () => {
    expect(sanitizeTerminalOutput("safe\n\u009b31mred\u009b0m\n\u009d2;owned\u0007tail\u0085done\n")).toBe("safe\nred\ntail?done\n");
  });

  it("caps rendered output lines and bytes and shows a truncation indicator", () => {
    const outputLines = getOutputLines({
      action: { label: "Run doctor", cliEquivalent: "afergon-ai doctor --opencode" },
      result: {
        ok: false,
        timedOut: false,
        stdout: "alpha\nbeta\ngamma\ndelta\n",
        stderr: "1234567890ABCDEFGHIJ\n",
        stdoutTruncated: false,
        stderrTruncated: true,
      },
    }, {
      maxOutputLines: 8,
      maxOutputBytes: 70,
    });

    expect(outputLines).toEqual([
      "Output [fail]",
      "Action: Run doctor",
      "CLI equivalent: afergon-ai doctor --opencode",
      "",
      "stdout",
      "alpha",
      "beta",
      "[output truncated]",
      "",
      "Press Enter or Esc to close this output panel.",
    ]);
  });

  it("sanitizes typed-match confirmations and clears validation state while editing", () => {
    const action = {
      id: "remove-profile",
      confirmation: {
        kind: "typed-match",
        expectedText: "danger\n\u009b31mprofile\u009b0m",
        mismatchMessage: "Type the selected profile name to continue.",
      },
    };

    const initialState = createConfirmationState({ action });
    const editedState = appendConfirmationCharacter(
      appendConfirmationCharacter(
        {
          ...initialState,
          validationMessage: "previous error",
        },
        "d",
      ),
      "a",
    );

    expect(editedState).toEqual({
      ...initialState,
      value: "da",
      validationMessage: "",
    });

    const backspacedState = backspaceConfirmationCharacter({
      ...editedState,
      value: "danger\nprofileX",
      validationMessage: "another error",
    });

    expect(backspacedState).toEqual({
      ...initialState,
      value: "danger\nprofile",
      validationMessage: "",
    });

    expect(validateConfirmationState(backspacedState)).toEqual({ ok: true });
    expect(validateConfirmationState({
      ...initialState,
      value: "danger\nother",
    })).toEqual({
      ok: false,
      message: "Type the selected profile name to continue.",
    });
  });
});

describe("createTuiApp interactive actions", () => {
  it("renders selected actions with a teal fixed cursor, hides noisy metadata, and still requires confirmation", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({ ok: true, exitCode: 0, stdout: "updated\n", stderr: "", timedOut: false }));
    const app = createTuiApp({ terminal, exit: () => {}, loadStatusScreenState: getStatusFixture, interactiveActionsByRoute: { status: [createActionDefinition({ id: "status-update", section: "status", kind: "mutate", label: "Refresh managed files", argv: buildCommandArgv("update", ["--check"]), cliEquivalent: "afergon-ai update --check" })] }, executeAction });
    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(terminal.output).toContain("\u001b[38;5;6m> Refresh managed files\u001b[0m");
    expect(terminal.output).not.toContain("CLI equivalent: afergon-ai update --check");
    expect(terminal.output).not.toContain("Execution: confirmation required");
    terminal.emitInput("\r");
    await flushTui();
    expect(terminal.output).toContain("Confirmation");
    expect(terminal.output).toContain("afergon-ai update --check");
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("confirms mutating actions, lets Escape cancel, and restores focus to the selected action", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({ ok: true, exitCode: 0, stdout: "updated\n", stderr: "", timedOut: false }));
    const app = createTuiApp({ terminal, exit: () => {}, loadStatusScreenState: getStatusFixture, interactiveActionsByRoute: { status: [createActionDefinition({ id: "status-update", section: "status", kind: "mutate", label: "Refresh managed files", argv: buildCommandArgv("update", ["--check"]), cliEquivalent: "afergon-ai update --check" })] }, executeAction });
    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(terminal.output).toContain("> Refresh managed files");
    terminal.emitInput("\r");
    await flushTui();
    expect(terminal.output).toContain("Confirmation");
    expect(terminal.output).toContain("afergon-ai update --check");
    expect(executeAction).not.toHaveBeenCalled();
    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();
    expect(terminal.output).not.toContain("Confirmation");
    expect(app.navigation.route).toBe("status");
    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.sectionActionSelection).toBe(0);
  });

  it("runs read-only actions inline, renders captured output, and closes the output panel on Escape", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async ({ action }) => ({ ok: false, exitCode: 1, stdout: "doctor summary\n", stderr: `${action.id} failed\n`, timedOut: false }));
    const app = createTuiApp({ terminal, exit: () => {}, loadStatusScreenState: getStatusFixture, interactiveActionsByRoute: { status: [createActionDefinition({ id: "status-doctor", section: "status", kind: "read", label: "Run doctor", argv: buildCommandArgv("doctor", ["--opencode"]), cliEquivalent: "afergon-ai doctor --opencode" })] }, executeAction });
    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    terminal.emitInput("\r");
    await flushTui();
    expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ id: "status-doctor", argv: ["doctor", "--opencode"] }) }));
    expect(terminal.output).toContain("Output [fail]");
    expect(terminal.output).toContain("doctor summary");
    expect(terminal.output).toContain("status-doctor failed");
    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();
    expect(terminal.output).not.toContain("Output [fail]");
    expect(app.navigation.route).toBe("status");
    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.sectionActionSelection).toBe(0);
  });

  it("clamps stale action selection when a route exposes fewer actions before render and execution", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async ({ action }) => ({ ok: true, exitCode: 0, stdout: `${action.id}\n`, stderr: "", timedOut: false }));
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadStatusScreenState: getStatusFixture,
      interactiveActionsByRoute: {
        configuration: [
          createActionDefinition({ id: "configuration-init", section: "configuration", kind: "mutate", label: "Initialize", argv: buildCommandArgv("init") }),
          createActionDefinition({ id: "configuration-doctor", section: "configuration", kind: "read", label: "Doctor", argv: buildCommandArgv("doctor") }),
          createActionDefinition({ id: "configuration-update", section: "configuration", kind: "mutate", label: "Update", argv: buildCommandArgv("update") }),
        ],
        status: [
          createActionDefinition({ id: "status-doctor", section: "status", kind: "read", label: "Run doctor", argv: buildCommandArgv("doctor", ["--opencode"]), cliEquivalent: "afergon-ai doctor --opencode" }),
        ],
      },
      executeAction,
    });

    app.start();
    await flushTui();
    app.navigation.sectionActionSelection = 2;
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(app.navigation.sectionActionSelection).toBe(0);
    expect(terminal.output).toContain("> Run doctor");
    terminal.emitInput("\r");
    await flushTui();
    expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ id: "status-doctor" }) }));
  });

  it("sanitizes ANSI and control-sequence output before rendering the output panel", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({
      ok: false,
      exitCode: 1,
      stdout: "\u001b[31mred\u001b[0m\nline\u0007\u001b]2;owned\u0007",
      stderr: "bad\r\u001b[2Jclear\u0000done\n",
      timedOut: false,
    }));
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadStatusScreenState: getStatusFixture,
      interactiveActionsByRoute: {
        status: [createActionDefinition({ id: "status-doctor", section: "status", kind: "read", label: "Run doctor", argv: buildCommandArgv("doctor", ["--opencode"]), cliEquivalent: "afergon-ai doctor --opencode" })],
      },
      executeAction,
    });

    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    terminal.emitInput("\r");
    await flushTui();
    expect(terminal.output).toContain("red");
    expect(terminal.output).toContain("line");
    expect(terminal.output).toContain("bad");
    expect(terminal.output).toContain("bad?clear?done");
    expect(terminal.output).toContain("clear?done");
    expect(terminal.output).not.toContain("\u001b[31mred");
    expect(terminal.output).not.toContain("\u001b]2;owned\u0007");
    expect(terminal.output).not.toContain("owned");
    expect(terminal.output).not.toContain("line\u0007");
    expect(terminal.output).not.toContain("done\u0000");
  });
});
