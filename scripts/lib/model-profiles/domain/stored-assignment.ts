export class StoredAssignment {
  private constructor(readonly raw: string | Record<string, unknown>) {}

  static create(value: unknown, path: string): StoredAssignment {
    if (typeof value === "string") {
      if (!value.trim()) {
        throw new Error(`${path} must be a nonempty model string.`);
      }
      return new StoredAssignment(value);
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`${path} must be a model string or assignment object.`);
    }

    const assignment = value as Record<string, unknown>;
    if (Object.hasOwn(assignment, "model")) {
      const model = assignment.model;
      if (typeof model !== "string" || !model.trim()) {
        throw new Error(`${path}.model must be a nonempty model string.`);
      }
    }

    if (Object.hasOwn(assignment, "reasoningEffort")) {
      const effort = assignment.reasoningEffort;
      if (typeof effort !== "string" || !effort.trim() || effort.trim().toLowerCase() === "inherit") {
        throw new Error(`${path}.reasoningEffort must be a nonempty explicit effort string.`);
      }
    }

    return new StoredAssignment(assignment);
  }
}
