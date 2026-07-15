import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import path from "node:path";
import { GitReceiptError, runGit, runGitBytes } from "./git.js";

export interface ManifestEntry { path: string; readonly rawPath: Buffer; change: string; oldMode: string; newMode: string; blobOid?: string; }
export interface IndexManifest { commonDir: string; headOid: string; entries: ManifestEntry[]; scopeDigest: string; candidateDigest: string; }

const digest = (domain: string, value: unknown) => createHash("sha256").update(`${domain}\0${JSON.stringify(value)}`).digest("hex");
const intentToAddFlag = 0x20000000;

function hasIntentToAdd(debugIndex: string): boolean {
  return [...debugIndex.matchAll(/flags: ([0-9a-f]+)/g)].some(([, flags]) => (Number.parseInt(flags, 16) & intentToAddFlag) !== 0);
}

function splitNul(buffer: Buffer): Buffer[] {
  const fields: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 0) { fields.push(buffer.subarray(start, index)); start = index + 1; }
  }
  return fields;
}

export function resolveCommonDir(cwd: string, commonDirectory: string, realpath: (target: string) => string = realpathSync): string {
  try {
    return realpath(path.resolve(cwd, commonDirectory));
  } catch {
    throw new GitReceiptError("git-unavailable");
  }
}

export function captureIndexManifest(cwd: string, environment?: NodeJS.ProcessEnv): IndexManifest {
  if (runGit(cwd, ["rev-parse", "--is-inside-work-tree"], environment).trim() !== "true") throw new GitReceiptError("git-unavailable");
  if (runGit(cwd, ["rev-parse", "--is-bare-repository"], environment).trim() !== "false") throw new GitReceiptError("bare-repository");
  let headOid: string;
  try { headOid = runGit(cwd, ["rev-parse", "--verify", "HEAD"], environment).trim(); }
  catch { throw new GitReceiptError("unborn-head"); }
  if (!/^[0-9a-f]{40,64}$/i.test(headOid)) throw new GitReceiptError("unborn-head");
  if (runGit(cwd, ["ls-files", "-u"], environment).trim()) throw new GitReceiptError("unmerged-index");
  if (hasIntentToAdd(runGit(cwd, ["ls-files", "--debug"], environment))) throw new GitReceiptError("intent-to-add");
  const fields = splitNul(runGitBytes(cwd, ["diff", "--cached", "--raw", "-z", "--no-abbrev", "--no-renames", "HEAD", "--"], environment));
  const entries: ManifestEntry[] = [];
  for (let index = 0; index < fields.length; index += 2) {
    const [oldMode, newMode, , newOid, change] = fields[index].subarray(1).toString("ascii").split(" ");
    const rawPath = fields[index + 1];
    const entryPath = rawPath?.toString("utf8");
    if (!rawPath?.length || !entryPath || !oldMode || !newMode || !change || rawPath[0] === 0x2f || rawPath.toString("ascii").split("/").includes("..")) throw new GitReceiptError("git-unavailable");
    const entry = { path: entryPath, change, oldMode, newMode, ...(newOid !== "0000000000000000000000000000000000000000" && { blobOid: newOid }) } as ManifestEntry;
    Object.defineProperty(entry, "rawPath", { value: Buffer.from(rawPath), enumerable: false });
    entries.push(entry);
  }
  if (!entries.length) throw new GitReceiptError("empty-index-delta");
  entries.sort((left, right) => Buffer.compare(left.rawPath, right.rawPath));
  const common = runGit(cwd, ["rev-parse", "--git-common-dir"], environment).trim();
  const commonDir = resolveCommonDir(cwd, common);
  const digestEntries = entries.map(({ rawPath, change, oldMode, newMode, blobOid }) => ({ path: rawPath.toString("base64"), change, oldMode, newMode, ...(blobOid && { blobOid }) }));
  const scopeDigest = digest("afergon-ai/review-receipt/scope/v1", entries.map(({ rawPath, oldMode, newMode }) => ({ path: rawPath.toString("base64"), kind: (newMode === "000000" ? oldMode : newMode) === "120000" ? "symlink" : "file" })));
  return { commonDir, headOid, entries, scopeDigest, candidateDigest: digest("afergon-ai/review-receipt/candidate/v1", { headOid, entries: digestEntries }) };
}
