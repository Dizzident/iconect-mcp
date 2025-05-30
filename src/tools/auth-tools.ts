import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { AuthService } from '../auth/auth-service.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const AuthPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const AuthCodeSchema = z.object({
  authCode: z.string().min(1, 'Authorization code is required'),
  codeVerifier: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const GenerateAuthUrlSchema = z.object({
  redirectUri: z.string().url('Valid redirect URI is required'),
  codeChallenge: z.string().optional(),
  state: z.string().optional(),
});

export class AuthTools {
  constructor(private authService: AuthService) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_auth_password',
        description: 'Authenticate with Iconect using username and password credentials',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Username for authentication',
            },
            password: {
              type: 'string',
              description: 'Password for authentication',
            },
          },
          required: ['username', 'password'],
        },
      },
      {
        name: 'iconect_auth_code',
        description: 'Authenticate with Iconect using OAuth 2.0 authorization code',
        inputSchema: {
          type: 'object',
          properties: {
            authCode: {
              type: 'string',
              description: 'Authorization code received from OAuth flow',
            },
            codeVerifier: {
              type: 'string',
              description: 'PKCE code verifier (optional)',
            },
          },
          required: ['authCode'],
        },
      },
      {
        name: 'iconect_refresh_token',
        description: 'Refresh the current access token using a refresh token',
        inputSchema: {
          type: 'object',
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token to use for obtaining new access token',
            },
          },
          required: ['refreshToken'],
        },
      },
      {
        name: 'iconect_generate_auth_url',
        description: 'Generate OAuth 2.0 authorization URL for authentication',
        inputSchema: {
          type: 'object',
          properties: {
            redirectUri: {
              type: 'string',
              description: 'Redirect URI for OAuth callback',
            },
            codeChallenge: {
              type: 'string',
              description: 'PKCE code challenge (optional)',
            },
            state: {
              type: 'string',
              description: 'State parameter for CSRF protection (optional)',
            },
          },
          required: ['redirectUri'],
        },
      },
      {
        name: 'iconect_logout',
        description: 'Logout and clear authentication tokens',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'iconect_get_auth_status',
        description: 'Get current authentication status and token information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async handleAuthPassword(args: unknown): Promise<unknown> {
    try {
      const { username, password } = AuthPasswordSchema.parse(args);
      logger.info('Processing password authentication request', { username });
      
      const tokens = await this.authService.authenticateWithPassword(username, password);
      
      return {
        success: true,
        message: 'Authentication successful',
        data: {
          tokenType: tokens.tokenType,
          expiresAt: tokens.expiresAt.toISOString(),
          scope: tokens.scope,
          hasRefreshToken: !!tokens.refreshToken,
        },
      };
    } catch (error) {
      logger.error('Password authentication failed', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Authentication failed',
        'AUTH_PASSWORD_FAILED'
      );
    }
  }

  async handleAuthCode(args: unknown): Promise<unknown> {
    try {
      const { authCode, codeVerifier } = AuthCodeSchema.parse(args);
      logger.info('Processing authorization code authentication request');
      
      const tokens = await this.authService.authenticateWithAuthCode(authCode, codeVerifier);
      
      return {
        success: true,
        message: 'Authentication successful',
        data: {
          tokenType: tokens.tokenType,
          expiresAt: tokens.expiresAt.toISOString(),
          scope: tokens.scope,
          hasRefreshToken: !!tokens.refreshToken,
        },
      };
    } catch (error) {
      logger.error('Authorization code authentication failed', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Authentication failed',
        'AUTH_CODE_FAILED'
      );
    }
  }

  async handleRefreshToken(args: unknown): Promise<unknown> {
    try {
      const { refreshToken } = RefreshTokenSchema.parse(args);
      logger.info('Processing token refresh request');
      
      const tokens = await this.authService.refreshToken(refreshToken);
      
      return {
        success: true,
        message: 'Token refresh successful',
        data: {
          tokenType: tokens.tokenType,
          expiresAt: tokens.expiresAt.toISOString(),
          scope: tokens.scope,
          hasRefreshToken: !!tokens.refreshToken,
        },
      };
    } catch (error) {
      logger.error('Token refresh failed', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Token refresh failed',
        'TOKEN_REFRESH_FAILED'
      );
    }
  }

  handleGenerateAuthUrl(args: unknown): unknown {
    try {
      const { redirectUri, codeChallenge, state } = GenerateAuthUrlSchema.parse(args);
      logger.info('Generating authorization URL', { redirectUri });
      
      const authUrl = this.authService.generateAuthUrl(redirectUri, codeChallenge, state);
      
      return {
        success: true,
        message: 'Authorization URL generated',
        data: {
          authUrl,
          redirectUri,
          state,
          usePKCE: !!codeChallenge,
        },
      };
    } catch (error) {
      logger.error('Failed to generate authorization URL', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to generate authorization URL',
        'AUTH_URL_GENERATION_FAILED'
      );
    }
  }

  handleLogout(): unknown {
    try {
      logger.info('Processing logout request');
      this.authService.logout();
      
      return {
        success: true,
        message: 'Logout successful',
        data: {},
      };
    } catch (error) {
      logger.error('Logout failed', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Logout failed',
        'LOGOUT_FAILED'
      );
    }
  }

  handleGetAuthStatus(): unknown {
    try {
      logger.info('Getting authentication status');
      const tokens = this.authService.getCurrentTokens();
      
      if (!tokens) {
        return {
          success: true,
          message: 'Not authenticated',
          data: {
            authenticated: false,
          },
        };
      }

      const isExpired = new Date() >= tokens.expiresAt;
      
      return {
        success: true,
        message: 'Authentication status retrieved',
        data: {
          authenticated: true,
          tokenType: tokens.tokenType,
          expiresAt: tokens.expiresAt.toISOString(),
          isExpired,
          scope: tokens.scope,
          hasRefreshToken: !!tokens.refreshToken,
        },
      };
    } catch (error) {
      logger.error('Failed to get authentication status', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get authentication status',
        'AUTH_STATUS_FAILED'
      );
    }
  }
}