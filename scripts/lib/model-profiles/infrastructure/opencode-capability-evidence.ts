export interface OpencodeCapabilityEvidenceRecord {
  readonly pin: { readonly version: string; readonly commit: string };
  readonly sourceRoot: string;
  readonly claimKind: string;
  readonly provider: string;
  readonly model: string;
  readonly resolvedModelIdentity: string;
  readonly transport: string;
  readonly reasoning: boolean;
  readonly effortOptions: readonly string[];
  readonly modelOverride: null;
  readonly catalogPointer: string;
  readonly npmPointer: string;
  readonly blobs: { readonly catalog: string; readonly preload: string; readonly provider: string; readonly transform: string };
  readonly capability: "supported" | "unsupported";
}

/**
 * Immutable production evidence seed for the candidate OpenCode pin.
 *
 * This is SOURCE-DECLARED mapping for the pinned TEST CATALOG, not a
 * production-release catalog and not live-provider acceptance. The record
 * below was extracted read-only from the pinned upstream sources:
 *
 * - `test/tool/fixtures/models-api.json`, JSON pointer `/openai/models/gpt-5.1`
 *   (reasoning enabled, explicit effort options none/low/medium/high) and
 *   `/openai/npm` (`@ai-sdk/openai` transport, no model override).
 * - `test/preload.ts` explicitly selects that committed catalog for upstream tests.
 * - `src/provider/provider.ts` resolves transport/capabilities and prioritizes
 *   explicit reasoning options over fallback variants.
 * - `src/provider/transform.ts` maps the declared effort options to
 *   OpenAI-shaped request options.
 *
 * `resolvedModelIdentity` is the explicit `provider + "/" + catalog model`
 * construction used by afergon-ai model IDs — never a runtime heuristic.
 */
export const OPENCODE_PIN_CATALOG_EVIDENCE: readonly OpencodeCapabilityEvidenceRecord[] = Object.freeze([
  Object.freeze({
    pin: Object.freeze({ version: "1.18.34", commit: "e9f8a210b9e2b1e13d375b84906069886eb3b767" }),
    sourceRoot: "packages/opencode",
    claimKind: "source-declared-test-catalog",
    provider: "openai",
    model: "gpt-5.1",
    resolvedModelIdentity: "openai/gpt-5.1",
    transport: "@ai-sdk/openai",
    reasoning: true,
    effortOptions: Object.freeze(["none", "low", "medium", "high"]),
    modelOverride: null,
    catalogPointer: "/openai/models/gpt-5.1",
    npmPointer: "/openai/npm",
    blobs: Object.freeze({
      catalog: "8ead8c2a9ab7b2758137f4b20299f8b8be97026d",
      preload: "16b4789b0725b50cd9056f0ff9b9885bcb9139b3",
      provider: "97f83bb51d1c6ffb6eca2605b40fcfd6116fb774",
      transform: "8ae8b4d9f16b73aa5fad0da2a19c48d59958a737",
    }),
    capability: "supported",
  }),
]);
