import type { RawProfileDocument } from "./profile-document.js";
import type { AgentTargetPolicy } from "./agent-target-policy.js";
import type { RawProfileDocumentCloner } from "./raw-profile-document-cloner.js";
import { StoredAssignment } from "./stored-assignment.js";

function childPath(base: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;
}

export interface ModelOnlyExportLoss {
  profileName: string;
  agentKey: string;
  omittedKeys: string[];
}

export interface ModelOnlyExport {
  document: RawProfileDocument;
  losses: ModelOnlyExportLoss[];
}

export class ModelOnlyExportPolicy {
  constructor(
    private readonly agents: AgentTargetPolicy,
    private readonly cloner: RawProfileDocumentCloner,
  ) {}

  export(document: RawProfileDocument): ModelOnlyExport {
    const exported = this.cloner.clone(document);
    const losses: ModelOnlyExportLoss[] = [];
    const models = exported.models as { profiles?: Record<string, Record<string, unknown>> } | undefined;
    for (const [profileName, profile] of Object.entries(models?.profiles ?? {})) {
      for (const [agentKey, value] of Object.entries(profile)) {
        if (!this.isManaged(agentKey)) continue;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const assignment = value as Record<string, unknown>;
          StoredAssignment.create(assignment, childPath(childPath("models.profiles", profileName), agentKey));
          const omittedKeys = Object.keys(assignment).filter((key) => key !== "model");
          if (Object.hasOwn(assignment, "model")) {
            Object.defineProperty(profile, agentKey, {
              value: assignment.model, enumerable: true, writable: true, configurable: true,
            });
          } else {
            delete profile[agentKey];
          }
          if (omittedKeys.length > 0) losses.push({ profileName, agentKey, omittedKeys });
        }
      }
    }
    return { document: exported, losses };
  }

  private isManaged(agentKey: string): boolean {
    try {
      this.agents.normalize(agentKey);
      return true;
    } catch {
      return false;
    }
  }
}
