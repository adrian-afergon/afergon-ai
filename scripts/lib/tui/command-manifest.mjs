const MANIFEST_ENTRIES = [
  { id: "init", label: "afergon-ai init", argv: ["init"] },
  { id: "doctor", label: "afergon-ai doctor", argv: ["doctor"] },
  { id: "update", label: "afergon-ai update", argv: ["update"] },
  { id: "models", label: "afergon-ai models", argv: ["models"] },
];

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach((item) => deepFreeze(item));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => deepFreeze(item));
  }

  return Object.freeze(value);
}

function cloneEntry(entry) {
  return {
    ...entry,
    argv: [...entry.argv],
  };
}

function cloneFrozenEntry(entry) {
  return deepFreeze(cloneEntry(entry));
}

export const COMMAND_MANIFEST = Object.freeze(MANIFEST_ENTRIES.map((entry) => cloneFrozenEntry(entry)));

export function getCommandManifest() {
  return Object.freeze(COMMAND_MANIFEST.map((entry) => cloneFrozenEntry(entry)));
}

export function getCommandManifestEntry(id) {
  const entry = COMMAND_MANIFEST.find((candidate) => candidate.id === id);
  return entry ? cloneFrozenEntry(entry) : undefined;
}
