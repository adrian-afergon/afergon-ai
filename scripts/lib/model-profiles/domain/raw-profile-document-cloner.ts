function asPlainObject<T>(value: T): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export class RawProfileDocumentCloner {
  clone<T extends Record<string, unknown>>(assignments: T = {} as T): T {
    return JSON.parse(JSON.stringify(asPlainObject(assignments))) as T;
  }
}
