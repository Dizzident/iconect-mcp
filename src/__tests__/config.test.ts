import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../config/index.js';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should load valid configuration', () => {
    const config = configManager.load({
      baseUrl: 'https://api.example.com',
      clientId: 'test-client-id',
    });

    expect(config.baseUrl).toBe('https://api.example.com');
    expect(config.clientId).toBe('test-client-id');
    expect(config.timeout).toBe(30000); // default value
  });

  it('should throw error for invalid configuration', () => {
    expect(() => {
      configManager.load({
        baseUrl: 'not-a-valid-url',
        clientId: '',
      });
    }).toThrow();
  });

  it('should update existing configuration', () => {
    configManager.load({
      baseUrl: 'https://api.example.com',
      clientId: 'test-client-id',
    });

    const updated = configManager.update({
      timeout: 60000,
    });

    expect(updated.timeout).toBe(60000);
    expect(updated.baseUrl).toBe('https://api.example.com');
  });

  it('should track configuration state', () => {
    expect(configManager.isConfigured()).toBe(false);

    configManager.load({
      baseUrl: 'https://api.example.com',
      clientId: 'test-client-id',
    });

    expect(configManager.isConfigured()).toBe(true);

    configManager.clear();

    expect(configManager.isConfigured()).toBe(false);
  });
});