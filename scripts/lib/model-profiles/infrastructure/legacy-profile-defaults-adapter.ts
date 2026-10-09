export class LegacyProfileDefaultsAdapter {
  constructor(private readonly factory: () => unknown) {}

  create(): unknown {
    return this.factory();
  }
}
