import { AuthService } from '../../auth/auth-service';
import { HttpClient } from '../../client/http-client';
import { IconectConfig, TokenResponse } from '../../types';
import { mockResponse, mockError } from '../setup';

jest.mock('../../client/http-client');

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

      const result = await authService.authenticateWithPassword('testuser', 'testpass');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'password',
          username: 'testuser',
          password: 'testpass',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('authenticateWithCode', () => {
    it('should authenticate successfully with authorization code', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);

      const result = await authService.authenticateWithCode(
        'test-auth-code',
        'http://localhost:3000/callback',
        'test-verifier'
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'authorization_code',
          code: 'test-auth-code',
          redirect_uri: 'http://localhost:3000/callback',
          code_verifier: 'test-verifier',
          client_id: 'test-client-id',
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);

      const result = await authService.refreshAccessToken('old-refresh-token');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  describe('generateAuthorizationUrl', () => {
    it('should generate authorization URL with PKCE', () => {
      const result = authService.generateAuthorizationUrl(
        'http://localhost:3000/callback',
        'test-state',
        'read write',
        'test-challenge'
      );

      expect(result).toContain(config.baseUrl);
      expect(result).toContain('response_type=code');
      expect(result).toContain(`client_id=${config.clientId}`);
      expect(result).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(result).toContain('state=test-state');
      expect(result).toContain('scope=read%20write');
      expect(result).toContain('code_challenge=test-challenge');
      expect(result).toContain('code_challenge_method=S256');
    });

    it('should generate authorization URL without optional parameters', () => {
      const result = authService.generateAuthorizationUrl(
        'http://localhost:3000/callback'
      );

      expect(result).toContain(config.baseUrl);
      expect(result).toContain('response_type=code');
      expect(result).toContain(`client_id=${config.clientId}`);
      expect(result).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(result).not.toContain('state=');
      expect(result).not.toContain('scope=');
      expect(result).not.toContain('code_challenge=');
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', () => {
      authService.logout();
      const tokens = authService.getTokens();
      expect(tokens).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when tokens are valid', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      await authService.authenticateWithPassword('testuser', 'testpass');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no tokens are set', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when tokens are expired', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: -1, // Already expired
        refresh_token: 'test-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      await authService.authenticateWithPassword('testuser', 'testpass');

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAuthStatus', () => {
    it('should return authenticated status with user info', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      httpClient.post = jest.fn().mockResolvedValue(tokenResponse);
      await authService.authenticateWithPassword('testuser', 'testpass');

      const status = authService.getAuthStatus();

      expect(status).toEqual({
        isAuthenticated: true,
        tokenType: 'Bearer',
        expiresAt: expect.any(Date),
        scope: undefined,
      });
    });

    it('should return unauthenticated status when no tokens', () => {
      const status = authService.getAuthStatus();

      expect(status).toEqual({
        isAuthenticated: false,
      });
    });
  });
});