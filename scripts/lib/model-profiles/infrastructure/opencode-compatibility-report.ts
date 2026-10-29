import { OPENCODE_PIN_CATALOG_EVIDENCE } from "./opencode-capability-evidence.js";

const PIN = OPENCODE_PIN_CATALOG_EVIDENCE[0].pin;

/**
 * Source-evidence compatibility report. It identifies the inspected pin and its
 * provenance as SOURCE evidence and claims neither executed schema acceptance,
 * provider request acceptance, nor compatibility with any other version.
 * Untested versions are unverified, never inferred from the tested pin.
 */
export class OpencodeCompatibilityReport {
  sourceEvidence(): {
    pin: { version: string; commit: string };
    claimKind: "source-evidence";
    inspected: readonly string[];
    claims: { executedSchemaAcceptance: false; providerRequestAcceptance: false; otherVersionCompatibility: false };
  } {
    return {
      pin: { ...PIN },
      claimKind: "source-evidence",
      inspected: Object.freeze([
        "packages/opencode/test/tool/fixtures/models-api.json (/openai/models/gpt-5.1, /openai/npm)",
        "packages/opencode/test/preload.ts (committed catalog selection)",
        "packages/opencode/src/provider/provider.ts (transport/capability resolution, explicit reasoning options priority)",
        "packages/opencode/src/provider/transform.ts (declared effort options to OpenAI-shaped request options)",
      ]),
      claims: { executedSchemaAcceptance: false, providerRequestAcceptance: false, otherVersionCompatibility: false },
    };
  }

  compatibilityStatus(version: string): { version: string; status: "source-inspected" | "unverified" } {
    if (version === PIN.version) return { version, status: "source-inspected" };
    return { version, status: "unverified" };
  }
}
