import { IconectConfig, IconectConfigSchema } from '../types/index.js';

export class ConfigManager {
  private config: IconectConfig | null = null;

  load(configData: Partial<IconectConfig>): IconectConfig {
    const merged = {
      ...this.getDefaults(),
      ...configData,
    };

    const validated = IconectConfigSchema.parse(merged);
    this.config = validated;
    return validated;
  }

  get(): IconectConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  update(updates: Partial<IconectConfig>): IconectConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const merged = {
      ...this.config,
      ...updates,
    };

    const validated = IconectConfigSchema.parse(merged);
    this.config = validated;
    return validated;
  }

  private getDefaults(): Partial<IconectConfig> {
    return {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  clear(): void {
    this.config = null;
  }
}

export const configManager = new ConfigManager();