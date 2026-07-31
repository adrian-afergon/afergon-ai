import type { EventParser, MetricsLifecycle, RecordStore } from "./ports.js";

export class ImportMetricsUseCase {
  public constructor(
    private readonly parser: EventParser,
    private readonly lifecycle: MetricsLifecycle,
    private readonly store: RecordStore,
  ) {}

  public execute(inputs: readonly unknown[]): number {
    this.lifecycle.requireEnabled();
    const records = inputs.map((input) => this.parser.parse(input));
    this.store.insert(records);
    return records.length;
  }
}
