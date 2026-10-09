import fs from "node:fs";
import { expect, it, vi } from "vitest";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import type { ObservedProfile } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";

const validator = new ProfileDocumentPolicy(new AgentTargetPolicy());
it.each(["Uint8Array", "Buffer"])("reader keeps %s capture independent in both directions without ambient I/O", (kind) => {
  const bytes = kind === "Buffer" ? Buffer.from([7, 8]) : new Uint8Array([7, 8]);
  const observed = { document: {}, source: { sourceIdentity: "configured:token", exists: true, sourceBytes: bytes }, originalText: "unchanged" };
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  const { reader, observe, validate } = memory(observed);
  try {
    expect(observe).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
    const loaded = reader.execute(); expect(loaded).not.toBe(observed); expect(loaded.source).not.toBe(observed.source);
    expect(loaded.source.sourceBytes).not.toBe(bytes); expect(loaded.source.sourceBytes?.constructor).toBe(Uint8Array);
    loaded.source.sourceBytes![0] = 1; expect(bytes[0]).toBe(7);
    bytes[1] = 2; expect(loaded.source.sourceBytes![1]).toBe(8);
    observed.source.sourceIdentity = "producer:new"; observed.source.exists = false; observed.source.sourceBytes = new Uint8Array();
    expect(loaded.source.sourceIdentity).toBe("configured:token"); expect(loaded.source.exists).toBe(true);
    loaded.source.sourceIdentity = "consumer:new"; expect(observed.source.sourceIdentity).toBe("producer:new");
    expect(loaded.originalText).toBe("unchanged"); expect(observe).toHaveBeenCalledTimes(1);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  } finally { validate.mockRestore(); for (const spy of spies) spy.mockRestore(); }
});
it("reader detaches captured bytes from producer mutation", () => {
  const observed = { document: {}, source: { sourceIdentity: "memory:bytes", exists: true, sourceBytes: new Uint8Array([1, 2]) } };
  const { reader, validate } = memory(observed);
  try {
    const loaded = reader.execute(); observed.source.sourceBytes[0] = 9;
    expect(loaded.source.sourceBytes).toEqual(new Uint8Array([1, 2]));
  } finally { validate.mockRestore(); }
});
it("reader refuses prototype-only byte impostor with consistency diagnostic", () => {
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:impostor", exists: true, sourceBytes: Object.create(Uint8Array.prototype) } });
  try { expect(() => reader.execute()).toThrow("Present observation requires Uint8Array source bytes"); }
  finally { validate.mockRestore(); }
});
it("reader refuses array masquerading as captured Uint8Array", () => {
  const sourceBytes = [1, 2] as unknown as Uint8Array;
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:fake", exists: true, sourceBytes } });
  try { expect(() => reader.execute()).toThrow("Present observation requires Uint8Array source bytes"); }
  finally { validate.mockRestore(); }
});
it("reader retains absent capture without manufacturing byte payload", () => {
  const observed = { document: {}, source: { sourceIdentity: "memory:absent", exists: false } };
  const { reader, validate } = memory(observed);
  try {
    const loaded = reader.execute(); expect(loaded.document).toBe(observed.document);
    expect(loaded.source.sourceBytes).toBeUndefined(); expect(loaded.originalText).toBeUndefined();
    expect(loaded.source).not.toBe(observed.source);
  } finally { validate.mockRestore(); }
});
it("reader rejects absent observation carrying bytes", () => {
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:contradiction", exists: false, sourceBytes: new Uint8Array() } });
  try { expect(() => reader.execute()).toThrow("Absent observation must not carry source bytes"); }
  finally { validate.mockRestore(); }
});
function memory(observed: ObservedProfile) {
  const observe = vi.fn(() => observed);
  const validate = vi.spyOn(validator, "validate");
  return { observe, validate, reader: new ReadProfileDocumentUseCase({ observe }, validator) };
}
it("reader rejects present observation without captured bytes", () => {
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:missing-bytes", exists: true } });
  try { expect(() => reader.execute()).toThrow("Present observation requires Uint8Array source bytes"); }
  finally { validate.mockRestore(); }
});
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
