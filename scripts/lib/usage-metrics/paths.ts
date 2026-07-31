import { homedir } from "node:os";
import path from "node:path";

export interface MetricsPaths {
  readonly configDirectory: string;
  readonly metricsDirectory: string;
  readonly databaseFile: string;
  readonly stateFile: string;
}

export class MetricsPathResolver {
  public constructor(
    private readonly environment: NodeJS.ProcessEnv = process.env,
    private readonly userHome: string = homedir(),
  ) {}

  public resolve(): MetricsPaths {
    const configuredDirectory = this.environment.AFERGON_AI_CONFIG_DIR
      || path.join(this.environment.XDG_CONFIG_HOME || path.join(this.userHome, ".config"), "afergon-ai");
    const configDirectory = path.resolve(configuredDirectory);
    const metricsDirectory = path.join(configDirectory, "metrics");
    return {
      configDirectory,
      metricsDirectory,
      databaseFile: path.join(metricsDirectory, "metrics.sqlite"),
      stateFile: path.join(metricsDirectory, "state.json"),
    };
  }
}
