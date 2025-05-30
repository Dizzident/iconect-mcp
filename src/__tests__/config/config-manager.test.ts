import { ConfigManager } from '../../config/config-manager';
import { IconectConfig } from '../../types';
import { IconectError } from '../../utils/errors';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('load', () => {
    it('should load valid configuration', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        timeout: 60000,
        maxRetries: 5,
        retryDelay: 2000,
      };

      const config = configManager.load(configData);

      expect(config).toEqual(configData);
      expect(configManager.isConfigured()).toBe(true);
    });

    it('should load configuration with defaults', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
      };

      const config = configManager.load(configData);

      expect(config).toEqual({
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
        clientSecret: undefined,
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
      });
    });

    it('should throw error for invalid baseUrl', () => {
      const configData = {
        baseUrl: 'not-a-url',
        clientId: 'test-client-id',
      };

      expect(() => configManager.load(configData)).toThrow(IconectError);
    });

    it('should throw error for missing required fields', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
      };

      expect(() => configManager.load(configData)).toThrow();
    });

    it('should throw error for invalid timeout', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
        timeout: -1000,
      };

      expect(() => configManager.load(configData)).toThrow();
    });
  });

  describe('get', () => {
    it('should return loaded configuration', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
      };

      configManager.load(configData);
      const config = configManager.get();

      expect(config).toBeDefined();
      expect(config?.baseUrl).toBe('https://api.test.com');
      expect(config?.clientId).toBe('test-client-id');
    });

    it('should return null when not configured', () => {
      const config = configManager.get();
      expect(config).toBeNull();
    });
  });

  describe('isConfigured', () => {
    it('should return false initially', () => {
      expect(configManager.isConfigured()).toBe(false);
    });

    it('should return true after loading configuration', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
      };

      configManager.load(configData);
      expect(configManager.isConfigured()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset configuration', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
      };

      configManager.load(configData);
      expect(configManager.isConfigured()).toBe(true);

      configManager.reset();
      expect(configManager.isConfigured()).toBe(false);
      expect(configManager.get()).toBeNull();
    });
  });

  describe('validate', () => {
    it('should validate correct configuration', () => {
      const configData = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
      };

      const validation = configManager.validate(configData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid configuration', () => {
      const configData = {
        baseUrl: 'not-a-url',
        clientId: '',
        timeout: -1,
        maxRetries: 0,
        retryDelay: -100,
      };

      const validation = configManager.validate(configData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain(expect.stringContaining('baseUrl'));
      expect(validation.errors).toContain(expect.stringContaining('clientId'));
      expect(validation.errors).toContain(expect.stringContaining('timeout'));
    });
  });

  describe('updatePartial', () => {
    it('should update partial configuration', () => {
      const initialConfig = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
      };

      configManager.load(initialConfig);

      const updates = {
        clientSecret: 'new-secret',
        timeout: 45000,
      };

      const updated = configManager.updatePartial(updates);

      expect(updated.clientSecret).toBe('new-secret');
      expect(updated.timeout).toBe(45000);
      expect(updated.baseUrl).toBe('https://api.test.com');
      expect(updated.clientId).toBe('test-client-id');
    });

    it('should throw error when not configured', () => {
      expect(() => configManager.updatePartial({ timeout: 45000 }))
        .toThrow('Configuration not loaded');
    });

    it('should validate partial updates', () => {
      const initialConfig = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
      };

      configManager.load(initialConfig);

      expect(() => configManager.updatePartial({ baseUrl: 'not-a-url' }))
        .toThrow(IconectError);
    });
  });
});