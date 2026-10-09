export const invalidReads: Array<[string, unknown, string]> = [
  ["non-object root", [], "root value must be an object"],
  ["models container", { version: 1, models: null }, "models must be an object"],
  ["profiles container", { models: { profiles: [] } }, "models.profiles must be an object"],
  ["profile value", { models: { profiles: { work: null } } }, "models.profiles.work must be an object"],
  ["active profile shape", { models: { activeProfile: [], profiles: {} } }, "models.activeProfile must be a string or null"],
  ["dangling active profile", { models: { activeProfile: "missing", profiles: {} } }, "models.activeProfile 'missing' does not exist"],
  ["invalid version", { version: 0, models: { profiles: {} } }, "version must be a positive safe integer"],
  ["unsafe version", { version: Number.MAX_SAFE_INTEGER + 1, models: { profiles: {} } }, "version must be a positive safe integer"],
  ["escaped quote/backslash keys", { models: { profiles: { ['bad.name"\\folder']: { " afg-review ": { model: 1 } } } } }, `models.profiles[${JSON.stringify('bad.name"\\folder')}][${JSON.stringify(" afg-review ")}].model`],
  ["empty model", { models: { profiles: { work: { "afg-review": "" } } } }, 'models.profiles.work["afg-review"]'],
  ["structured model", { models: { profiles: { work: { "afg-review": { model: 42 } } } } }, 'models.profiles.work["afg-review"].model'],
  ["legacy assignment", { models: { profiles: { work: { "afg-review": 42 } } } }, 'models.profiles.work["afg-review"]'],
  ["null assignment", { models: { profiles: { work: { "afg-review": null } } } }, 'models.profiles.work["afg-review"]'],
  ["array assignment", { models: { profiles: { work: { "afg-review": [] } } } }, 'models.profiles.work["afg-review"]'],
];

export const readableDocuments: Array<[string, Record<string, unknown>]> = [
  ["structured inheritance", { version: 1, models: { activeProfile: "work", profiles: { work: { "afg-specify": {} } } } }],
  ["future schema", { version: 3, models: { activeProfile: null, profiles: {} }, futureField: true }],
  ["legacy omitted containers", { version: 1, foreign: { retain: true } }],
  ["prototype-like profile and opaque foreign agent", JSON.parse('{"version":9007199254740991,"models":{"activeProfile":"__proto__","profiles":{"__proto__":{"afg-review":"inherit","constructor":{"model":null}}}}}')],
  ["structured model only", { version: 1, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5" } } } } }],
];
