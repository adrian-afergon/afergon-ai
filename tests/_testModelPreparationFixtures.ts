export function changingPatch(ownFields = true) {
  const reads = { model: 0, reasoningEffort: 0 };
  const patch = Object.create({
    get ignoredInherited(): never { throw new Error("Inherited unknown read"); },
    get model(): never { throw new Error("Inherited model read"); },
    get reasoningEffort(): never { throw new Error("Inherited effort read"); },
  });
  Object.defineProperties(patch, {
    ...(ownFields ? {
      model: { get: () => ++reads.model === 1 ? "custom/first" : undefined },
      reasoningEffort: { get: () => ++reads.reasoningEffort === 1 ? "high" : "inherit" },
    } : {}),
    unknown: { enumerable: true, get: (): never => { throw new Error("Own unknown read"); } },
  });
  return { patch, reads };
}

export const invalidFieldValues: readonly (readonly [string, unknown])[] = [
  ["undefined", undefined], ["null", null], ["array", Object.freeze([])], ["number", 7], ["empty", ""], ["whitespace", " \t"],
] as const;
export const invalidPatchFields = ["model", "reasoningEffort"].flatMap(field =>
  invalidFieldValues.map(([name, value]) => [`${field} ${name}`, field, value] as const),
).concat(["inherit", " InHerit ", "INHERIT"].map(value => [`reasoningEffort ${value}`, "reasoningEffort", value] as const));
export const editCases = [
  ["legacy edit amid structured slots", "old", { model: "new" }, "new", true, false],
  ["identical legacy", "old", { model: "old" }, "old", false, false],
  ["identical mixed-v1 structured", { model: "old" }, { model: "old" }, { model: "old" }, false, false],
  ["structured model without effort", { model: "old" }, { model: "new" }, { model: "new" }, true, true],
  ["effort preserves absent model", {}, { reasoningEffort: " Medium " }, { reasoningEffort: " Medium " }, true, true],
  ["effort preserves present model", { model: " InHerit " }, { reasoningEffort: "low" }, { model: " InHerit ", reasoningEffort: "low" }, true, true],
  ["model preserves absent effort", {}, { model: "inherit" }, { model: "inherit" }, true, true],
  ["both known fields ignore foreign patch", {}, { model: "x", reasoningEffort: "high", foreign: 9 }, { model: "x", reasoningEffort: "high" }, true, true],
] as const;
export const aliasCases = [
  ["exact duplicate", { review: "old", "afg-review": "other" }, "review", "review"],
  ["sole alias", { review: "old" }, "afg-review", "review"],
  ["canonical new", { foreign: { model: null } }, "REVIEW", "afg-review"],
] as const;
export const missingContainers = [
  {}, { models: {} }, { models: { profiles: {} } }, { version: 1, models: { activeProfile: null, profiles: {} } },
] as const;

export const domainProgramPrefix = `
import { AgentTargetPolicy } from './dist/scripts/lib/model-profiles/domain/agent-target-policy.js';
import { ProfileDocumentPolicy } from './dist/scripts/lib/model-profiles/domain/profile-document-policy.js';
import { RawProfileDocumentCloner } from './dist/scripts/lib/model-profiles/domain/raw-profile-document-cloner.js';
import { ProfileAssignmentPolicy } from './dist/scripts/lib/model-profiles/domain/profile-assignment-policy.js';
const agents = new AgentTargetPolicy();
const validator = new ProfileDocumentPolicy(agents);
const cloner = new RawProfileDocumentCloner();
const policy = new ProfileAssignmentPolicy(validator, agents, cloner);
`;
