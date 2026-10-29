export const UNKNOWN_EFFORT_ACK_KEY = "unknownEffortAck";

export const UNKNOWN_EFFORT_ACK_MARKER = "afergon-ai.unknown-effort-acknowledgement";
export const UNKNOWN_EFFORT_ACK_VERSION = 1;

export type AckScope = "resolved-pair" | "runtime-default";

export interface UnknownEffortAcknowledgementData {
  readonly ackKind: string;
  readonly ackVersion: number;
  readonly scope: AckScope;
  readonly provider: string | null;
  readonly model: string | null;
  readonly transport: string | null;
  readonly effort: string;
}

export class UnknownEffortAcknowledgement {
  private constructor(private readonly data: UnknownEffortAcknowledgementData) {}

  static create(data: unknown, path: string): UnknownEffortAcknowledgement {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`${path} must be an unknown-effort acknowledgement object.`);
    }
    const value = data as Record<string, unknown>;
    const scope = value.scope;
    if (
      value.ackKind !== UNKNOWN_EFFORT_ACK_MARKER ||
      value.ackVersion !== UNKNOWN_EFFORT_ACK_VERSION ||
      (scope !== "resolved-pair" && scope !== "runtime-default") ||
      typeof value.effort !== "string" || !value.effort.trim()
    ) {
      throw new Error(`${path} is not a valid versioned unknown-effort acknowledgement.`);
    }
    if (scope === "resolved-pair") {
      if (typeof value.model !== "string" || !value.model.trim() ||
        typeof value.provider !== "string" || !value.provider ||
        typeof value.transport !== "string" || !value.transport) {
        throw new Error(`${path} must bind the exact resolved model identity, provider and transport.`);
      }
      return new UnknownEffortAcknowledgement({
        ackKind: UNKNOWN_EFFORT_ACK_MARKER,
        ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
        scope,
        provider: value.provider,
        model: value.model,
        transport: value.transport,
        effort: value.effort,
      });
    }
    if (value.model !== null || value.provider !== null || value.transport !== null) {
      throw new Error(`${path} runtime-default acknowledgements bind the exact null model state only.`);
    }
    return new UnknownEffortAcknowledgement({
      ackKind: UNKNOWN_EFFORT_ACK_MARKER,
      ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
      scope,
      provider: null,
      model: null,
      transport: null,
      effort: value.effort,
    });
  }

  matches(pair: { readonly model: string | null; readonly effort: string | null }): boolean {
    return this.data.model === pair.model && this.data.effort === pair.effort;
  }

  static readOwn(entry: Record<string, unknown>, path: string): AckRead {
    if (!Object.hasOwn(entry, UNKNOWN_EFFORT_ACK_KEY)) return { kind: "absent" };
    try {
      return { kind: "owned", ack: UnknownEffortAcknowledgement.create(entry[UNKNOWN_EFFORT_ACK_KEY], path) };
    } catch {
      return { kind: "foreign" };
    }
  }

  applyTo(entry: Record<string, unknown>, path: string): boolean {
    const read = UnknownEffortAcknowledgement.readOwn(entry, path);
    if (read.kind === "foreign") {
      throw new Error(`${path} holds foreign acknowledgement metadata; refusing to overwrite user data.`);
    }
    if (read.kind === "owned" && read.ack.equals(this)) return false;
    Object.defineProperty(entry, UNKNOWN_EFFORT_ACK_KEY, {
      value: deepFreeze({ ...this.data }),
      enumerable: true,
      writable: true,
      configurable: true,
    });
    return true;
  }

  equals(other: UnknownEffortAcknowledgement): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }

  removeFrom(entry: Record<string, unknown>): boolean {
    const read = UnknownEffortAcknowledgement.readOwn(entry, "removeFrom");
    if (read.kind !== "owned") return false;
    delete entry[UNKNOWN_EFFORT_ACK_KEY];
    return true;
  }
}

export type AckRead =
  | { readonly kind: "absent" }
  | { readonly kind: "owned"; readonly ack: UnknownEffortAcknowledgement }
  | { readonly kind: "foreign" };

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const key of Object.keys(value as object)) deepFreeze((value as Record<string, unknown>)[key]);
    Object.freeze(value);
  }
  return value;
}

export class UnknownEffortAcknowledgementPolicy {
  authorizes(
    stored: readonly UnknownEffortAcknowledgement[],
    pair: { readonly model: string | null; readonly effort: string | null },
    verdictKind: "supported" | "known-unsupported" | "unknown",
  ): boolean {
    return verdictKind === "unknown" && stored.some((ack) => ack.matches(pair));
  }
}
