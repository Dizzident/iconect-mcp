import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IconectConfig, ApiError, AuthTokens } from '../types/index.js';

export class HttpClient {
  private client: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(private config: IconectConfig) {
    this.client = axios.create({
      baseURL: `${config.baseUrl}/v1`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        if (this.tokens && this.isTokenValid()) {
          config.headers.Authorization = `${this.tokens.tokenType} ${this.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          if (this.tokens?.refreshToken) {
            try {
              await this.refreshTokens();
              return this.client(originalRequest);
            } catch (refreshError) {
              this.clearTokens();
              throw this.createApiError(refreshError);
            }
          }
        }
        
        throw this.createApiError(error);
      }
    );
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
  }

  clearTokens(): void {
    this.tokens = null;
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  private isTokenValid(): boolean {
    if (!this.tokens) return false;
    return new Date() < new Date(this.tokens.expiresAt.getTime() - 30000); // 30s buffer
  }

  private async refreshTokens(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const response = await axios.post(`${this.config.baseUrl}/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: this.tokens?.refreshToken,
      client_id: this.config.clientId,
    });

    const tokenData = response.data;
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    this.tokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || this.tokens?.refreshToken,
      expiresAt,
      tokenType: tokenData.token_type || 'Bearer',
      scope: tokenData.scope,
    };
  }

  private createApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      return {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.message || error.message,
        details: error.response?.data || undefined,
        statusCode: error.response?.status || undefined,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: undefined,
        statusCode: undefined,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
      statusCode: undefined,
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}