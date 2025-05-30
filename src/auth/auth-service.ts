import { HttpClient } from '../client/http-client.js';
import { TokenResponse, TokenResponseSchema, AuthTokens, IconectConfig } from '../types/index.js';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  constructor(private httpClient: HttpClient, private config: IconectConfig) {}

  async authenticateWithPassword(username: string, password: string): Promise<AuthTokens> {
    logger.info('Attempting password authentication', { username });
    
    try {
      const response = await this.httpClient.post<unknown>('/oauth/token', {
        grant_type: 'password',
        username,
        password,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const tokenData = TokenResponseSchema.parse(response);
      const tokens = this.createAuthTokens(tokenData);
      
      this.httpClient.setTokens(tokens);
      logger.info('Password authentication successful', { username });
      
      return tokens;
    } catch (error) {
      logger.error('Password authentication failed', error as Error, { username });
      throw new AuthenticationError('Password authentication failed', error);
    }
  }

  async authenticateWithAuthCode(authCode: string, codeVerifier?: string): Promise<AuthTokens> {
    logger.info('Attempting authorization code authentication');
    
    try {
      const requestBody: Record<string, string> = {
        grant_type: 'authorization_code',
        code: authCode,
        client_id: this.config.clientId,
      };

      if (this.config.clientSecret) {
        requestBody.client_secret = this.config.clientSecret;
      }

      if (codeVerifier) {
        requestBody.code_verifier = codeVerifier;
      }

      const response = await this.httpClient.post<unknown>('/oauth/token', requestBody);

      const tokenData = TokenResponseSchema.parse(response);
      const tokens = this.createAuthTokens(tokenData);
      
      this.httpClient.setTokens(tokens);
      logger.info('Authorization code authentication successful');
      
      return tokens;
    } catch (error) {
      logger.error('Authorization code authentication failed', error as Error);
      throw new AuthenticationError('Authorization code authentication failed', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    logger.info('Attempting token refresh');
    
    try {
      const response = await this.httpClient.post<unknown>('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const tokenData = TokenResponseSchema.parse(response);
      const tokens = this.createAuthTokens(tokenData);
      
      this.httpClient.setTokens(tokens);
      logger.info('Token refresh successful');
      
      return tokens;
    } catch (error) {
      logger.error('Token refresh failed', error as Error);
      throw new AuthenticationError('Token refresh failed', error);
    }
  }

  generateAuthUrl(redirectUri: string, codeChallenge?: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
    });

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    if (state) {
      params.append('state', state);
    }

    return `${this.config.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  logout(): void {
    logger.info('Logging out user');
    this.httpClient.clearTokens();
  }

  getCurrentTokens(): AuthTokens | null {
    return this.httpClient.getTokens();
  }

  private createAuthTokens(tokenResponse: TokenResponse): AuthTokens {
    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    
    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || undefined,
      expiresAt,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope || undefined,
    };
  }
}