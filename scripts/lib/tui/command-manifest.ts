type CommandManifestId = "init" | "doctor" | "update" | "models";

export interface CommandManifestEntry {
  readonly id: CommandManifestId;
  readonly label: string;
  readonly argv: readonly string[];
}

const MANIFEST_ENTRIES: ReadonlyArray<CommandManifestEntry> = [
  { id: "init", label: "afergon-ai init", argv: ["init"] },
  { id: "doctor", label: "afergon-ai doctor", argv: ["doctor"] },
  { id: "update", label: "afergon-ai update", argv: ["update"] },
  { id: "models", label: "afergon-ai models", argv: ["models"] },
];

const MANIFEST_ARGV_MARKER = Symbol("manifest-command-argv");

export type ManifestCommandArgv = ReadonlyArray<string> & {
  readonly [MANIFEST_ARGV_MARKER]: true;
};

function deepFreeze<T>(value: T): Readonly<T> {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      deepFreeze(item);
    });
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => {
      deepFreeze(item);
    });
  }

  return Object.freeze(value) as Readonly<T>;
}

function cloneEntry(entry: CommandManifestEntry): { id: CommandManifestId; label: string; argv: string[] } {
  return {
    ...entry,
    argv: [...entry.argv],
  };
}

function cloneFrozenEntry(entry: CommandManifestEntry): Readonly<CommandManifestEntry> {
  return deepFreeze(cloneEntry(entry)) as Readonly<CommandManifestEntry>;
}

function markManifestArgv(argv: string[]): ManifestCommandArgv {
  Object.defineProperty(argv, MANIFEST_ARGV_MARKER, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return Object.freeze(argv) as ManifestCommandArgv;
}

export const COMMAND_MANIFEST: ReadonlyArray<Readonly<CommandManifestEntry>> = Object.freeze(
  MANIFEST_ENTRIES.map((entry) => cloneFrozenEntry(entry)),
);

export function getCommandManifest(): ReadonlyArray<Readonly<CommandManifestEntry>> {
  return Object.freeze(COMMAND_MANIFEST.map((entry) => cloneFrozenEntry(entry)));
}

export function getCommandManifestEntry(id: CommandManifestId | string): Readonly<CommandManifestEntry> | undefined {
  const entry = COMMAND_MANIFEST.find((candidate) => candidate.id === id);

  return entry ? cloneFrozenEntry(entry) : undefined;
}

export function buildCommandArgv(id: CommandManifestId | string, extraArgv: readonly string[] = []): ManifestCommandArgv {
  if (!Array.isArray(extraArgv) || extraArgv.some((entry) => typeof entry !== "string")) {
    throw new Error("buildCommandArgv requires an argv array of strings.");
  }

  const entry = getCommandManifestEntry(id);
  if (!entry) {
    throw new Error(`Unknown command manifest entry: ${id}`);
  }

  return markManifestArgv([...entry.argv, ...extraArgv]);
}

export function isManifestCommandArgv(argv: unknown): argv is ManifestCommandArgv {
  return Array.isArray(argv) && Object.getOwnPropertyDescriptor(argv, MANIFEST_ARGV_MARKER)?.value === true;
}
