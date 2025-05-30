import { AuthTools } from '../../tools/auth-tools.js';
import { AuthService } from '../../auth/auth-service.js';
import { AuthTokens } from '../../types/index.js';

jest.mock('../../auth/auth-service.js');

describe('AuthTools', () => {
  let authTools: AuthTools;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      authenticateWithPassword: jest.fn(),
      authenticateWithAuthCode: jest.fn(),
      refreshToken: jest.fn(),
      generateAuthUrl: jest.fn(),
      logout: jest.fn(),
      getCurrentTokens: jest.fn(),
    } as any;

    authTools = new AuthTools(authService);
  });

  describe('getTools', () => {
    it('should return all auth tools', () => {
      const tools = authTools.getTools();

      expect(tools).toHaveLength(6);
      expect(tools.map(t => t.name)).toEqual([
        'iconect_auth_password',
        'iconect_auth_code',
        'iconect_refresh_token',
        'iconect_generate_auth_url',
        'iconect_logout',
        'iconect_get_auth_status',
      ]);
    });
  });

  describe('handleAuthPassword', () => {
    it('should authenticate with password successfully', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
        scope: 'read write',
      };

      authService.authenticateWithPassword.mockResolvedValue(mockTokens);

      const result = await authTools.handleAuthPassword({
        username: 'testuser',
        password: 'testpass',
      });

      expect(authService.authenticateWithPassword).toHaveBeenCalledWith('testuser', 'testpass');
      expect(result).toEqual({
        success: true,
        message: 'Authentication successful',
        data: {
          tokenType: 'Bearer',
          expiresAt: mockTokens.expiresAt.toISOString(),
          scope: 'read write',
          hasRefreshToken: true,
        },
      });
    });

    it('should handle authentication failure', async () => {
      authService.authenticateWithPassword.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authTools.handleAuthPassword({
        username: 'testuser',
        password: 'wrongpass',
      })).rejects.toThrow('Invalid credentials');
    });

    it('should validate required fields', async () => {
      await expect(authTools.handleAuthPassword({
        username: 'testuser',
      })).rejects.toThrow();
    });
  });

  describe('handleAuthCode', () => {
    it('should authenticate with authorization code', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
        scope: 'read write',
      };

      authService.authenticateWithAuthCode.mockResolvedValue(mockTokens);

      const result = await authTools.handleAuthCode({
        authCode: 'test-auth-code',
        codeVerifier: 'test-verifier',
      });

      expect(authService.authenticateWithAuthCode).toHaveBeenCalledWith(
        'test-auth-code',
        'test-verifier'
      );
      expect((result as any).success).toBe(true);
    });
  });

  describe('handleRefreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
        scope: 'read write',
      };

      authService.refreshToken.mockResolvedValue(mockTokens);

      const result = await authTools.handleRefreshToken({
        refreshToken: 'old-refresh-token',
      });

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect((result as any).success).toBe(true);
    });
  });

  describe('handleGenerateAuthUrl', () => {
    it('should generate authorization URL', () => {
      authService.generateAuthUrl.mockReturnValue('https://auth.test.com/authorize?...');

      const result = authTools.handleGenerateAuthUrl({
        redirectUri: 'http://localhost:3000/callback',
        state: 'test-state',
        codeChallenge: 'test-challenge',
      });

      expect(authService.generateAuthUrl).toHaveBeenCalledWith(
        'http://localhost:3000/callback',
        'test-challenge',
        'test-state'
      );
      expect((result as any).success).toBe(true);
      expect((result as any).data.authUrl).toBe('https://auth.test.com/authorize?...');
    });
  });

  describe('handleLogout', () => {
    it('should logout successfully', () => {
      const result = authTools.handleLogout();

      expect(authService.logout).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        data: {},
      });
    });
  });

  describe('handleGetAuthStatus', () => {
    it('should return authenticated status', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
        scope: 'read write',
      };

      authService.getCurrentTokens.mockReturnValue(mockTokens);

      const result = authTools.handleGetAuthStatus();

      expect(authService.getCurrentTokens).toHaveBeenCalled();
      expect((result as any).success).toBe(true);
      expect((result as any).data.authenticated).toBe(true);
      expect((result as any).data.tokenType).toBe('Bearer');
    });

    it('should return unauthenticated status', () => {
      authService.getCurrentTokens.mockReturnValue(null);

      const result = authTools.handleGetAuthStatus();

      expect((result as any).data.authenticated).toBe(false);
    });
  });
});