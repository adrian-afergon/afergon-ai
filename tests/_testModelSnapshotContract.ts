import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { loadProfileDocument } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
import { acquireMigrationSnapshot, assertProfileSourceUnchanged } from "../scripts/lib/model-profiles/infrastructure/migration-snapshot.js";
import { invalidReads } from "./_testModelRawFixtures.js";

const roots: string[] = [];
const releases: Array<() => void> = [];

export function realSnapshotFixture(contents = "{}", absent = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-s11-snapshot-"));
  roots.push(root);
  const configDir = path.join(root, "isolated");
  const configPath = path.join(configDir, "config.json");
  if (!absent) {
    fs.mkdirSync(configDir);
    fs.writeFileSync(configPath, contents);
  }
  const source = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: configDir });
  const backup = `${source.configPath}.pre-v2.bak`;
  const unchanged = (snapshotExists = true, snapshotBytes = source.sourceBytes ?? Buffer.from(`${JSON.stringify(source.document, null, 2)}\n`)) => {
    expect(fs.existsSync(source.configPath)).toBe(!absent);
    if (!absent) expect(fs.readFileSync(source.configPath)).toEqual(Buffer.from(contents));
    if (snapshotExists) expect(fs.readFileSync(backup)).toEqual(snapshotBytes);
    expect(fs.readdirSync(configDir)).toEqual([...(absent ? [] : ["config.json"]), ...(snapshotExists ? ["config.json.pre-v2.bak"] : [])]);
  };
  return { root, source, backup, input: { source, recoveryDocument: source.document }, unchanged };
}

type SnapshotFaultStage = "write" | "fsync" | "close" | "open" | "read" | "sourceRead";
export function snapshotFault(backup: string, stage: SnapshotFaultStage) {
  const failure = new Error(`backup ${stage} fault`);
  const open = fs.openSync.bind(fs), close = fs.closeSync.bind(fs);
  let descriptor: number | undefined, closes = 0, closed = false;
  vi.spyOn(fs, "openSync").mockImplementation((file, flags, ...args) => {
    if (file === backup && flags === "wx" && stage === "open") throw failure;
    const fd = open(file, flags, ...args);
    if (file === backup && flags === "wx") descriptor = fd;
    return fd;
  });
  vi.spyOn(fs, "closeSync").mockImplementation(fd => {
    if (fd === descriptor && ++closes === 1 && stage === "close") throw failure;
    const result = close(fd);
    if (fd === descriptor) closed = true;
    return result;
  });
  const method = stage === "write" ? "writeFileSync" : stage === "fsync" ? "fsyncSync" : "readFileSync";
  const original = fs[method].bind(fs);
  if (!["open", "close"].includes(stage)) vi.spyOn(fs, method).mockImplementation((target, ...args) => {
    const faultTarget = stage === "read" ? backup : stage === "sourceRead" ? backup.slice(0, -".pre-v2.bak".length) : descriptor;
    if (target === faultTarget) {
      if (stage === "write") fs.writeSync(descriptor!, "{");
      throw failure;
    }
    return (original as (...args: unknown[]) => never)(target, ...args);
  });
  releases.push(() => { if (descriptor !== undefined && !closed) close(descriptor); });
  return { failure, closeAttempts: () => closes, descriptor: () => descriptor };
}

function assertCleanupFault(stage: "remove" | "close" | "both") {
  const f = realSnapshotFixture();
  const cleanup = new Error(`cleanup ${stage}`);
  const remove = fs.rmSync.bind(fs), close = fs.closeSync.bind(fs);
  const fault = snapshotFault(f.backup, "write");
  if (stage !== "close") vi.spyOn(fs, "rmSync").mockImplementation((target, ...args) => {
    if (target === f.backup) throw cleanup;
    return remove(target, ...args);
  });
  if (stage !== "remove") vi.spyOn(fs, "closeSync").mockImplementation(fd => {
    if (fd === fault.descriptor()) throw cleanup;
    return close(fd);
  });
  let failure: unknown;
  try { acquireMigrationSnapshot(f.input); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(AggregateError);
  expect((failure as AggregateError).errors).toEqual([
    fault.failure, stage === "both" ? expect.objectContaining({ errors: [cleanup, cleanup] }) : cleanup,
  ]);
  expect((failure as AggregateError).errors[0]).toBe(fault.failure);
  if (stage === "both") {
    const nested = (failure as AggregateError).errors[1];
    expect(nested).toBeInstanceOf(AggregateError);
    expect(nested.errors[0]).toBe(cleanup);
    expect(nested.errors[1]).toBe(cleanup);
  } else expect((failure as AggregateError).errors[1]).toBe(cleanup);
  f.unchanged(stage !== "close", Buffer.from("{"));
}

export function registerSnapshotContract() {
  afterEach(() => {
    vi.restoreAllMocks();
    for (const release of releases.splice(0)) release();
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  it("C3 write failure cleans only its newly created partial", () => {
    const f = realSnapshotFixture();
    const fault = snapshotFault(f.backup, "write");
    let caught: unknown;
    expect(() => {
      try { acquireMigrationSnapshot(f.input); } catch (error) { caught = error; throw error; }
    }).toThrow(fault.failure);
    expect(caught).toBe(fault.failure);
    expect(fault.closeAttempts()).toBeGreaterThanOrEqual(1);
    vi.restoreAllMocks();
    f.unchanged(false);
    expect(acquireMigrationSnapshot(f.input).disposition).toBe("created");
    f.unchanged();
  });

  it("C cleanup removal failure reports original and cleanup errors", () => {
    assertCleanupFault("remove");
  });

  it("C cleanup T1 close failure still attempts owned removal", () => {
    assertCleanupFault("close");
  });

  it("C cleanup T2 retains simultaneous close and removal errors", () => {
    assertCleanupFault("both");
  });

  it("C absent T2 refuses contradictory captured bytes", () => {
    const f = realSnapshotFixture("{}", true);
    f.source.sourceBytes = Buffer.from("{}");
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => acquireMigrationSnapshot(f.input)).toThrow("Invalid source observation");
    expect(() => assertProfileSourceUnchanged(f.source)).toThrow("Invalid source observation");
    expect(mkdir).not.toHaveBeenCalled();
    expect(fs.existsSync(path.dirname(f.backup))).toBe(false);
  });

  it.each([
    ["C observation requires captured Buffer before mkdir", undefined],
    ["C observation characterization refuses non-Buffer bytes", new Uint8Array([123, 125])],
  ] as const)("%s", (_name, bytes) => {
    const f = realSnapshotFixture();
    f.source.sourceBytes = bytes as never;
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => acquireMigrationSnapshot(f.input)).toThrow("Invalid source observation");
    expect(() => assertProfileSourceUnchanged(f.source)).toThrow("Invalid source observation");
    expect(mkdir).not.toHaveBeenCalled();
    f.unchanged(false);
  });

  it.each([
    ["C3 T1 fsync failure cleans its incomplete snapshot", "fsync", false],
    ["C3 T2 close failure cleans its incomplete snapshot", "close", false],
    ["C open fault leaves source and no owned backup", "open", false],
    ["C open fault preserves previous valid backup", "open", true],
    ["C existing backup read fault preserves previous valid backup", "read", true],
    ["C source permission fault propagates instead of absence", "sourceRead", true],
  ] as const)("%s", (_name, stage, previous) => {
    const f = realSnapshotFixture();
    if (previous) fs.writeFileSync(f.backup, f.source.sourceBytes!);
    const fault = snapshotFault(f.backup, stage);
    let caught: unknown;
    expect(() => {
      try { acquireMigrationSnapshot(f.input); } catch (error) { caught = error; throw error; }
    }).toThrow(fault.failure);
    expect(caught).toBe(fault.failure);
    expect(fault.closeAttempts()).toBeGreaterThanOrEqual(["fsync", "close"].includes(stage) ? 1 : 0);
    vi.restoreAllMocks();
    f.unchanged(previous);
    expect(acquireMigrationSnapshot(f.input).disposition).toBe(previous ? "reused" : "created");
    f.unchanged();
  });

  it.skipIf(process.platform === "win32").each([
    ["C mode creates a private snapshot from a 0600 source under umask022", false, false],
    ["C mode T1 creates a private absent-source default snapshot", true, false],
    ["C mode T2 preserves a completed existing backup mode0640", false, true],
  ] as const)("%s", (_name, absent, previous) => {
    const f = realSnapshotFixture("{}", absent);
    const mask = process.umask(0o022);
    try {
      if (!absent) fs.chmodSync(f.source.configPath, 0o600);
      if (previous) fs.writeFileSync(f.backup, f.source.sourceBytes!, { mode: 0o640 });
      acquireMigrationSnapshot(f.input);
      expect(fs.statSync(f.backup).mode & 0o777).toBe(previous ? 0o640 : 0o600);
      if (!absent) expect(fs.statSync(f.source.configPath).mode & 0o777).toBe(0o600);
      f.unchanged();
    } finally { process.umask(mask); }
  });

  const refusals: Array<[string, string | undefined, Record<string, unknown> | undefined, string | typeof SyntaxError, string?, boolean?]> = [
    ["C2 T1 refuses valid but byte-different backup", "{ }", undefined, "Migration snapshot bytes do not match"],
    ["C2 T2 refuses malformed partial backup without deleting it", "{", undefined, SyntaxError],
    ["C2 rejects invalid known backup shape with its path", '{"models":null}', undefined, "models must be an object"],
    ["C recovery rejects malformed known fields before mkdir", undefined, { models: null }, "models must be an object"],
    ["C recovery T1 refuses structurally different recovery", undefined, { memo: "unexpected" }, "Recovery document does not match"],
    ["C recovery T2 refuses matching future schema before mkdir", undefined, { version: 3 }, "unsupported profile version 3", '{"version":3}'],
    ["C absent T1 refuses nondefault recovery before mkdir", undefined, {}, "Recovery document does not match", undefined, true],
    ...invalidReads.map(([name, raw, diagnostic]) => [`C validation reuse ${name}`, undefined, raw as Record<string, unknown>, diagnostic] as [string, undefined, Record<string, unknown>, string]),
  ];
  it.each(refusals)("%s", (_name, prior, recovery, diagnostic, contents, absent = false) => {
    const f = realSnapshotFixture(contents, absent);
    if (prior !== undefined) fs.writeFileSync(f.backup, prior);
    const mkdir = vi.spyOn(fs, "mkdirSync"), open = vi.spyOn(fs, "openSync");
    expect(() => acquireMigrationSnapshot({ ...f.input, recoveryDocument: structuredClone(recovery ?? f.input.recoveryDocument) })).toThrow(diagnostic);
    if (prior === undefined) for (const spy of [mkdir, open]) expect(spy).not.toHaveBeenCalled();
    if (!absent) expect(fs.readFileSync(f.source.configPath, "utf8")).toBe(contents ?? "{}");
    else expect(fs.existsSync(path.dirname(f.backup))).toBe(false);
    if (prior !== undefined) f.unchanged(true, Buffer.from(prior));
    else expect(fs.existsSync(f.backup)).toBe(false);
  });

  it.each([
    ["C1 creates an exact durable snapshot without replacing source", "{}", undefined, false, false],
    ["C1 retains formatted multibyte source instead of reserialization", '{\n "memo": "café ☕", "version": 1\n}\n', { version: 1, memo: "café ☕" }, false, false],
    ["C absent source creates only a recoverable default snapshot", "{}", { models: { profiles: {}, activeProfile: null }, version: 1 }, true, false],
    ["C2 reuses a completed exact backup without writing or deleting", "{}", undefined, false, true],
  ] as const)("%s", (_name, contents, recovery, absent, previous) => {
    const f = realSnapshotFixture(contents, absent);
    const defaultBytes = `${JSON.stringify(f.input.recoveryDocument, null, 2)}\n`;
    f.input.recoveryDocument = structuredClone(recovery ?? f.input.recoveryDocument);
    if (previous) fs.writeFileSync(f.backup, f.source.sourceBytes!);
    const sync = vi.spyOn(fs, "fsyncSync"), write = vi.spyOn(fs, "writeFileSync"), remove = vi.spyOn(fs, "rmSync");
    const read = vi.spyOn(fs, "readFileSync");
    expect(acquireMigrationSnapshot(f.input)).toEqual({ snapshotPath: f.backup, disposition: previous ? "reused" : "created", complete: true });
    expect(JSON.parse(fs.readFileSync(f.backup, "utf8"))).toEqual(f.input.recoveryDocument);
    expect(sync).toHaveBeenCalledTimes(previous ? 0 : 1);
    if (previous) {
      for (const spy of [write, remove]) expect(spy).not.toHaveBeenCalled();
      read.mockClear();
      expect(acquireMigrationSnapshot(f.input).disposition).toBe("reused");
      expect(read.mock.calls.filter(([file]) => file === f.backup)).toEqual([[f.backup]]);
    }
    if (absent) {
      expect(fs.readFileSync(f.backup, "utf8")).toBe(defaultBytes);
      expect(acquireMigrationSnapshot(f.input).disposition).toBe("reused");
    }
    f.unchanged();
  });

  it.each([
    ["C1 T1 refuses changed observed bytes before acquisition", false, "{ }", false],
    ["C1 T2 refuses a source appearing after absent observation", true, "{}", false],
    ["C source deletion fails closed with conflict diagnostic", false, null, false],
    ["C timing rechecks changed bytes after preflight before open", false, "{ }", true],
    ["C timing rechecks newly appeared source before open", true, "{}", true],
  ] as const)("%s", (_name, absent, current, duringMkdir) => {
    const f = realSnapshotFixture("{}", absent);
    fs.mkdirSync(path.dirname(f.source.configPath), { recursive: true });
    const change = () => current === null ? fs.unlinkSync(f.source.configPath) : fs.writeFileSync(f.source.configPath, current);
    const mkdir = fs.mkdirSync.bind(fs);
    if (duringMkdir) vi.spyOn(fs, "mkdirSync").mockImplementation((dir, ...args) => { change(); return mkdir(dir, ...args); });
    else change();
    if (!duringMkdir) expect(() => assertProfileSourceUnchanged(f.source)).toThrow("Profile source changed");
    expect(() => acquireMigrationSnapshot(f.input)).toThrow("Profile source changed");
    if (current !== null) expect(fs.readFileSync(f.source.configPath, "utf8")).toBe(current);
    else expect(fs.existsSync(f.source.configPath)).toBe(false);
    expect(fs.existsSync(f.backup)).toBe(false);
  });
}
