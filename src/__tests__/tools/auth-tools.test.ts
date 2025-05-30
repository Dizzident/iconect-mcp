import { AuthTools } from '../../tools/auth-tools';
import { AuthService } from '../../auth/auth-service';
import { AuthTokens } from '../../types';

jest.mock('../../auth/auth-service');

describe('AuthTools', () => {
  let authTools: AuthTools;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      authenticateWithPassword: jest.fn(),
      authenticateWithCode: jest.fn(),
      refreshAccessToken: jest.fn(),
      generateAuthorizationUrl: jest.fn(),
      logout: jest.fn(),
      getAuthStatus: jest.fn(),
      isAuthenticated: jest.fn(),
      getTokens: jest.fn(),
      setTokens: jest.fn(),
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
          accessToken: 'test-access-token',
          tokenType: 'Bearer',
          expiresAt: mockTokens.expiresAt.toISOString(),
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
      };

      authService.authenticateWithCode.mockResolvedValue(mockTokens);

      const result = await authTools.handleAuthCode({
        code: 'test-auth-code',
        redirectUri: 'http://localhost:3000/callback',
        codeVerifier: 'test-verifier',
      });

      expect(authService.authenticateWithCode).toHaveBeenCalledWith(
        'test-auth-code',
        'http://localhost:3000/callback',
        'test-verifier'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('handleRefreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
      };

      authService.refreshAccessToken.mockResolvedValue(mockTokens);

      const result = await authTools.handleRefreshToken({
        refreshToken: 'old-refresh-token',
      });

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('old-refresh-token');
      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('new-access-token');
    });
  });

  describe('handleGenerateAuthUrl', () => {
    it('should generate authorization URL', () => {
      authService.generateAuthorizationUrl.mockReturnValue('https://auth.test.com/authorize?...');

      const result = authTools.handleGenerateAuthUrl({
        redirectUri: 'http://localhost:3000/callback',
        state: 'test-state',
        scope: 'read write',
        codeChallenge: 'test-challenge',
      });

      expect(authService.generateAuthorizationUrl).toHaveBeenCalledWith(
        'http://localhost:3000/callback',
        'test-state',
        'read write',
        'test-challenge'
      );
      expect(result.success).toBe(true);
      expect(result.data.authUrl).toBe('https://auth.test.com/authorize?...');
    });
  });

  describe('handleLogout', () => {
    it('should logout successfully', () => {
      const result = authTools.handleLogout();

      expect(authService.logout).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
        data: null,
      });
    });
  });

  describe('handleGetAuthStatus', () => {
    it('should return authenticated status', () => {
      authService.getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: 'read write',
      });

      const result = authTools.handleGetAuthStatus();

      expect(authService.getAuthStatus).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.isAuthenticated).toBe(true);
      expect(result.data.tokenType).toBe('Bearer');
    });

    it('should return unauthenticated status', () => {
      authService.getAuthStatus.mockReturnValue({
        isAuthenticated: false,
      });

      const result = authTools.handleGetAuthStatus();

      expect(result.data.isAuthenticated).toBe(false);
    });
  });
});