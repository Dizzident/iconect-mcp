import { IconectConfig, IconectConfigSchema } from '../types/index.js';
import { IconectError } from '../utils/errors.js';

export class ConfigManager {
  private config: IconectConfig | null = null;

  load(configData: Partial<IconectConfig>): IconectConfig {
    try {
      const merged = {
        ...this.getDefaults(),
        ...configData,
      };

      const validated = IconectConfigSchema.parse(merged);
      this.config = validated;
      return validated;
    } catch (error: any) {
      if (error.errors) {
        const errorMessages = error.errors.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new IconectError(`Configuration validation failed: ${errorMessages}`, 'CONFIG_VALIDATION_ERROR');
      }
      throw new IconectError('Configuration validation failed', 'CONFIG_VALIDATION_ERROR');
    }
  }

  get(): IconectConfig | null {
    return this.config;
  }

  update(updates: Partial<IconectConfig>): IconectConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    try {
      const merged = {
        ...this.config,
        ...updates,
      };

      const validated = IconectConfigSchema.parse(merged);
      this.config = validated;
      return validated;
    } catch (error: any) {
      if (error.errors) {
        const errorMessages = error.errors.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new IconectError(`Configuration validation failed: ${errorMessages}`, 'CONFIG_VALIDATION_ERROR');
      }
      throw new IconectError('Configuration validation failed', 'CONFIG_VALIDATION_ERROR');
    }
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

  reset(): void {
    this.config = null;
  }

  validate(configData: any): { isValid: boolean; errors: string[] } {
    try {
      const merged = {
        ...this.getDefaults(),
        ...configData,
      };
      IconectConfigSchema.parse(merged);
      return { isValid: true, errors: [] };
    } catch (error: any) {
      const errors: string[] = [];
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }
      return { isValid: false, errors };
    }
  }

  updatePartial(updates: Partial<IconectConfig>): IconectConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.update(updates);
  }
}

export const configManager = new ConfigManager();