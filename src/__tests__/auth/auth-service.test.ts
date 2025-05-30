import { AuthService } from '../../auth/auth-service.js';
import { HttpClient } from '../../client/http-client.js';
import { IconectConfig, TokenResponse } from '../../types/index.js';
import { mockResponse, mockError } from '../setup.js';

jest.mock('../../client/http-client.js');

describe('AuthService', () => {
  let authService: AuthService;
  let httpClient: jest.Mocked<HttpClient>;
  let config: IconectConfig;

  beforeEach(() => {
    httpClient = new HttpClient({} as IconectConfig) as jest.Mocked<HttpClient>;
    config = {
      baseUrl: 'https://api.test.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };
    authService = new AuthService(httpClient, config);
  });

  describe('authenticateWithPassword', () => {
    it('should authenticate successfully with username and password', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'read write',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      httpClient.setTokens = jest.fn();

      const result = await authService.authenticateWithPassword('testuser', 'testpass');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'password',
          username: 'testuser',
          password: 'testpass',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        })
      );

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: expect.any(Date),
        tokenType: 'Bearer',
        scope: 'read write',
      });
    });

    it('should throw error on authentication failure', async () => {
      httpClient.post = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.authenticateWithPassword('testuser', 'wrongpass')
      ).rejects.toThrow('Password authentication failed');
    });
  });

  describe('authenticateWithAuthCode', () => {
    it('should authenticate successfully with authorization code', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      httpClient.setTokens = jest.fn();

      const result = await authService.authenticateWithAuthCode(
        'test-auth-code',
        'test-verifier'
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'authorization_code',
          code: 'test-auth-code',
          code_verifier: 'test-verifier',
          client_id: 'test-client-id',
        })
      );

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: expect.any(Date),
        tokenType: 'Bearer',
        scope: undefined,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      httpClient.setTokens = jest.fn();

      const result = await authService.refreshToken('old-refresh-token');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        })
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Date),
        tokenType: 'Bearer',
        scope: undefined,
      });
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate authorization URL with PKCE', () => {
      const result = authService.generateAuthUrl(
        'http://localhost:3000/callback',
        'test-challenge',
        'test-state'
      );

      expect(result).toContain(config.baseUrl);
      expect(result).toContain('response_type=code');
      expect(result).toContain(`client_id=${config.clientId}`);
      expect(result).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(result).toContain('state=test-state');
      expect(result).toContain('code_challenge=test-challenge');
      expect(result).toContain('code_challenge_method=S256');
    });

    it('should generate authorization URL without optional parameters', () => {
      const result = authService.generateAuthUrl(
        'http://localhost:3000/callback'
      );

      expect(result).toContain(config.baseUrl);
      expect(result).toContain('response_type=code');
      expect(result).toContain(`client_id=${config.clientId}`);
      expect(result).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(result).not.toContain('state=');
      expect(result).not.toContain('code_challenge=');
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', () => {
      httpClient.clearTokens = jest.fn();
      authService.logout();
      expect(httpClient.clearTokens).toHaveBeenCalled();
    });
  });

  describe('getCurrentTokens', () => {
    it('should return tokens when authenticated', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      httpClient.setTokens = jest.fn();
      httpClient.getTokens = jest.fn().mockReturnValue({
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        refreshToken: 'test-refresh-token',
      });

      await authService.authenticateWithPassword('testuser', 'testpass');
      const tokens = authService.getCurrentTokens();

      expect(tokens).toBeTruthy();
      expect(tokens?.accessToken).toBe('test-access-token');
    });

    it('should return null when no tokens are set', () => {
      httpClient.getTokens = jest.fn().mockReturnValue(null);
      const tokens = authService.getCurrentTokens();
      expect(tokens).toBeNull();
    });
  });
});