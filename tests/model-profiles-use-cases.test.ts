import fs from "node:fs";
import { expect, it, vi } from "vitest";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import type { ObservedProfile } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";

const validator = new ProfileDocumentPolicy(new AgentTargetPolicy());
function memory(observed: ObservedProfile) {
  const observe = vi.fn(() => observed);
  const validate = vi.spyOn(validator, "validate");
  return { observe, validate, reader: new ReadProfileDocumentUseCase({ observe }, validator) };
}
it("reader rejects malformed observed models with supplied identity", () => {
  const observed = { document: { models: null }, source: { sourceIdentity: "memory:invalid", exists: true, sourceBytes: new Uint8Array() } };
  const { reader, observe, validate } = memory(observed);
  try {
    expect(observe).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
    expect(() => reader.execute()).toThrow("Could not read model profile config at memory:invalid: models must be an object.");
    expect(observe).toHaveBeenCalledTimes(1); expect(validate.mock.calls).toEqual([[observed.document, "memory:invalid"]]);
  } finally { validate.mockRestore(); }
});
it("reader propagates exact port error without validation retry or fallback", () => {
  const error = new Error("producer refused");
  const observe = vi.fn(() => { throw error; });
  const validate = vi.spyOn(validator, "validate");
  try {
    const reader = new ReadProfileDocumentUseCase({ observe }, validator);
    let caught: unknown; try { reader.execute(); } catch (failure) { caught = failure; }
    expect(caught).toBe(error); expect(observe).toHaveBeenCalledTimes(1); expect(validate).not.toHaveBeenCalled();
  } finally { validate.mockRestore(); }
});
it("reader preserves second identity future raw document and original text", () => {
  const observed = { document: { version: 3, foreign: { keep: true }, models: { profiles: { work: { review: { reasoningEffort: " Custom ", note: [] } } } } },
    source: { sourceIdentity: "configured:second", exists: true, sourceBytes: new Uint8Array([32, 10]) }, originalText: " \n" };
  const { reader, observe, validate } = memory(observed);
  try {
    const loaded = reader.execute();
    expect(loaded.document).toBe(observed.document); expect(loaded.originalText).toBe(observed.originalText);
    expect(loaded.source).toEqual(observed.source); expect(observe).toHaveBeenCalledTimes(1);
    expect(validate.mock.calls).toEqual([[observed.document, "configured:second"]]);
  } finally { validate.mockRestore(); }
});
