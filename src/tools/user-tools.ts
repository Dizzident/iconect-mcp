import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { User, UserSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListUsersSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  searchQuery: z.string().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  includePermissions: z.boolean().default(true),
});

export const GetCurrentUserSchema = z.object({
  includePermissions: z.boolean().default(true),
  includePreferences: z.boolean().default(true),
});

export const UpdateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export const UpdateCurrentUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  avatar: z.string().optional(),
});

export const UpdateUserPreferencesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    defaultPageSize: z.number().min(10).max(100).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      browser: z.boolean().optional(),
      mobile: z.boolean().optional(),
    }).optional(),
  }),
});

export const UpdateCurrentUserPreferencesSchema = z.object({
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    defaultPageSize: z.number().min(10).max(100).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      browser: z.boolean().optional(),
      mobile: z.boolean().optional(),
    }).optional(),
  }),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
});

export const ResetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  requirePasswordChange: z.boolean().default(true),
});

export const GetUserPermissionsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  resource: z.string().optional(),
  action: z.string().optional(),
});

export const UpdateUserRolesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
});

export const GetUserActivitySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  activityType: z.enum(['login', 'logout', 'action', 'error']).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export class UserTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_users',
        description: 'List users with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended', 'pending'],
              description: 'Filter by user status',
            },
            role: {
              type: 'string',
              description: 'Filter by user role',
            },
            department: {
              type: 'string',
              description: 'Filter by department',
            },
            searchQuery: {
              type: 'string',
              description: 'Search in name, email, or username',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
              minimum: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of items per page (default: 20, max: 100)',
              minimum: 1,
              maximum: 100,
            },
            sortBy: {
              type: 'string',
              description: 'Field to sort by (e.g., "displayName", "email", "lastLoginDate")',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order (default: asc)',
            },
          },
        },
      },
      {
        name: 'iconect_get_user',
        description: 'Get a specific user by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            includePermissions: {
              type: 'boolean',
              description: 'Include user permissions (default: true)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_get_current_user',
        description: 'Get current authenticated user information',
        inputSchema: {
          type: 'object',
          properties: {
            includePermissions: {
              type: 'boolean',
              description: 'Include user permissions (default: true)',
            },
            includePreferences: {
              type: 'boolean',
              description: 'Include user preferences (default: true)',
            },
          },
        },
      },
      {
        name: 'iconect_update_user',
        description: 'Update user information (admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            displayName: {
              type: 'string',
              description: 'Display name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            title: {
              type: 'string',
              description: 'Job title',
            },
            department: {
              type: 'string',
              description: 'Department',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
            timezone: {
              type: 'string',
              description: 'Timezone',
            },
            locale: {
              type: 'string',
              description: 'Locale',
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL or file ID',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended', 'pending'],
              description: 'User status',
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              description: 'User roles',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Direct permissions',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_update_current_user',
        description: 'Update current user profile information',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            displayName: {
              type: 'string',
              description: 'Display name',
            },
            title: {
              type: 'string',
              description: 'Job title',
            },
            department: {
              type: 'string',
              description: 'Department',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
            timezone: {
              type: 'string',
              description: 'Timezone',
            },
            locale: {
              type: 'string',
              description: 'Locale',
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL or file ID',
            },
          },
        },
      },
      {
        name: 'iconect_update_user_preferences',
        description: 'Update user preferences (admin or own preferences)',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID (admin only, optional for own preferences)',
            },
            preferences: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['light', 'dark', 'auto'],
                  description: 'UI theme preference',
                },
                language: {
                  type: 'string',
                  description: 'Language preference',
                },
                dateFormat: {
                  type: 'string',
                  description: 'Date format preference',
                },
                timeFormat: {
                  type: 'string',
                  enum: ['12h', '24h'],
                  description: 'Time format preference',
                },
                defaultPageSize: {
                  type: 'number',
                  minimum: 10,
                  maximum: 100,
                  description: 'Default page size for lists',
                },
                notifications: {
                  type: 'object',
                  properties: {
                    email: { type: 'boolean' },
                    browser: { type: 'boolean' },
                    mobile: { type: 'boolean' },
                  },
                  description: 'Notification preferences',
                },
              },
              description: 'User preferences',
            },
          },
          required: ['userId', 'preferences'],
        },
      },
      {
        name: 'iconect_update_current_user_preferences',
        description: 'Update current user preferences',
        inputSchema: {
          type: 'object',
          properties: {
            preferences: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['light', 'dark', 'auto'],
                  description: 'UI theme preference',
                },
                language: {
                  type: 'string',
                  description: 'Language preference',
                },
                dateFormat: {
                  type: 'string',
                  description: 'Date format preference',
                },
                timeFormat: {
                  type: 'string',
                  enum: ['12h', '24h'],
                  description: 'Time format preference',
                },
                defaultPageSize: {
                  type: 'number',
                  minimum: 10,
                  maximum: 100,
                  description: 'Default page size for lists',
                },
                notifications: {
                  type: 'object',
                  properties: {
                    email: { type: 'boolean' },
                    browser: { type: 'boolean' },
                    mobile: { type: 'boolean' },
                  },
                  description: 'Notification preferences',
                },
              },
              description: 'User preferences',
            },
          },
          required: ['preferences'],
        },
      },
      {
        name: 'iconect_change_password',
        description: 'Change current user password',
        inputSchema: {
          type: 'object',
          properties: {
            currentPassword: {
              type: 'string',
              description: 'Current password',
            },
            newPassword: {
              type: 'string',
              description: 'New password (minimum 8 characters)',
              minLength: 8,
            },
            confirmPassword: {
              type: 'string',
              description: 'Confirm new password',
            },
          },
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
        },
      },
      {
        name: 'iconect_reset_user_password',
        description: 'Reset user password (admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
            },
            newPassword: {
              type: 'string',
              description: 'New password (minimum 8 characters)',
              minLength: 8,
            },
            requirePasswordChange: {
              type: 'boolean',
              description: 'Require password change on next login (default: true)',
            },
          },
          required: ['userId', 'newPassword'],
        },
      },
      {
        name: 'iconect_get_user_permissions',
        description: 'Get user permissions with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
            },
            resource: {
              type: 'string',
              description: 'Filter by resource type',
            },
            action: {
              type: 'string',
              description: 'Filter by action type',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'iconect_update_user_roles',
        description: 'Update user roles (admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              description: 'New roles for the user',
              minItems: 1,
            },
          },
          required: ['userId', 'roles'],
        },
      },
      {
        name: 'iconect_get_user_activity',
        description: 'Get user activity logs with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for activity filter',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'End date for activity filter',
            },
            activityType: {
              type: 'string',
              enum: ['login', 'logout', 'action', 'error'],
              description: 'Filter by activity type',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
              minimum: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of items per page (default: 50, max: 100)',
              minimum: 1,
              maximum: 100,
            },
          },
          required: ['userId'],
        },
      },
    ];
  }

  async handleListUsers(args: unknown): Promise<unknown> {
    try {
      const options = ListUsersSchema.parse(args);
      logger.info('Listing users', { options });

      const queryParams = new URLSearchParams();
      if (options.status) queryParams.append('status', options.status);
      if (options.role) queryParams.append('role', options.role);
      if (options.department) queryParams.append('department', options.department);
      if (options.searchQuery) queryParams.append('q', options.searchQuery);
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<User>>(url);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list users', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list users',
        'LIST_USERS_FAILED'
      );
    }
  }

  async handleGetUser(args: unknown): Promise<unknown> {
    try {
      const { id, includePermissions } = GetUserSchema.parse(args);
      logger.info('Getting user', { id, includePermissions });

      const queryParams = new URLSearchParams();
      if (!includePermissions) queryParams.append('includePermissions', 'false');

      const url = `/users/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<User>(url);
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'User retrieved successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to get user', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get user',
        'GET_USER_FAILED'
      );
    }
  }

  async handleGetCurrentUser(args: unknown): Promise<unknown> {
    try {
      const { includePermissions, includePreferences } = GetCurrentUserSchema.parse(args);
      logger.info('Getting current user', { includePermissions, includePreferences });

      const queryParams = new URLSearchParams();
      if (!includePermissions) queryParams.append('includePermissions', 'false');
      if (!includePreferences) queryParams.append('includePreferences', 'false');

      const url = `/users/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<User>(url);
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'Current user retrieved successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to get current user', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get current user',
        'GET_CURRENT_USER_FAILED'
      );
    }
  }

  async handleUpdateUser(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateUserSchema.parse(args);
      logger.info('Updating user', { id });

      const response = await this.httpClient.put<User>(`/users/${id}`, updateData);
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'User updated successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to update user', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update user',
        'UPDATE_USER_FAILED'
      );
    }
  }

  async handleUpdateCurrentUser(args: unknown): Promise<unknown> {
    try {
      const updateData = UpdateCurrentUserSchema.parse(args);
      logger.info('Updating current user profile');

      const response = await this.httpClient.put<User>('/users/me', updateData);
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'User profile updated successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to update current user', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update current user',
        'UPDATE_CURRENT_USER_FAILED'
      );
    }
  }

  async handleUpdateUserPreferences(args: unknown): Promise<unknown> {
    try {
      const { userId, preferences } = UpdateUserPreferencesSchema.parse(args);
      logger.info('Updating user preferences', { userId });

      const response = await this.httpClient.put<User>(`/users/${userId}/preferences`, { preferences });
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'User preferences updated successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to update user preferences', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update user preferences',
        'UPDATE_USER_PREFERENCES_FAILED'
      );
    }
  }

  async handleUpdateCurrentUserPreferences(args: unknown): Promise<unknown> {
    try {
      const { preferences } = UpdateCurrentUserPreferencesSchema.parse(args);
      logger.info('Updating current user preferences');

      const response = await this.httpClient.put<User>('/users/me/preferences', { preferences });
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'User preferences updated successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to update current user preferences', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update current user preferences',
        'UPDATE_CURRENT_USER_PREFERENCES_FAILED'
      );
    }
  }

  async handleChangePassword(args: unknown): Promise<unknown> {
    try {
      const passwordData = ChangePasswordSchema.parse(args);
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new IconectError('New password and confirmation do not match', 'PASSWORD_MISMATCH');
      }

      logger.info('Changing user password');

      await this.httpClient.post('/users/me/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      return {
        success: true,
        message: 'Password changed successfully',
        data: null,
      };
    } catch (error) {
      logger.error('Failed to change password', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to change password',
        'CHANGE_PASSWORD_FAILED'
      );
    }
  }

  async handleResetUserPassword(args: unknown): Promise<unknown> {
    try {
      const resetData = ResetPasswordSchema.parse(args);
      logger.info('Resetting user password', { userId: resetData.userId });

      await this.httpClient.post(`/users/${resetData.userId}/reset-password`, {
        newPassword: resetData.newPassword,
        requirePasswordChange: resetData.requirePasswordChange,
      });

      return {
        success: true,
        message: 'User password reset successfully',
        data: { userId: resetData.userId },
      };
    } catch (error) {
      logger.error('Failed to reset user password', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to reset user password',
        'RESET_PASSWORD_FAILED'
      );
    }
  }

  async handleGetUserPermissions(args: unknown): Promise<unknown> {
    try {
      const { userId, resource, action } = GetUserPermissionsSchema.parse(args);
      logger.info('Getting user permissions', { userId, resource, action });

      const queryParams = new URLSearchParams();
      if (resource) queryParams.append('resource', resource);
      if (action) queryParams.append('action', action);

      const url = `/users/${userId}/permissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<{
        permissions: string[];
        roles: string[];
        effectivePermissions: Array<{
          resource: string;
          actions: string[];
          source: 'role' | 'direct';
        }>;
      }>(url);

      return {
        success: true,
        message: 'User permissions retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get user permissions', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get user permissions',
        'GET_USER_PERMISSIONS_FAILED'
      );
    }
  }

  async handleUpdateUserRoles(args: unknown): Promise<unknown> {
    try {
      const { userId, roles } = UpdateUserRolesSchema.parse(args);
      logger.info('Updating user roles', { userId, roles });

      const response = await this.httpClient.put<User>(`/users/${userId}/roles`, { roles });
      const user = UserSchema.parse(response);

      return {
        success: true,
        message: 'User roles updated successfully',
        data: user,
      };
    } catch (error) {
      logger.error('Failed to update user roles', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update user roles',
        'UPDATE_USER_ROLES_FAILED'
      );
    }
  }

  async handleGetUserActivity(args: unknown): Promise<unknown> {
    try {
      const options = GetUserActivitySchema.parse(args);
      logger.info('Getting user activity', { userId: options.userId });

      const queryParams = new URLSearchParams();
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.activityType) queryParams.append('type', options.activityType);
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());

      const url = `/users/${options.userId}/activity${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<{
        id: string;
        type: string;
        action: string;
        resource: string;
        timestamp: string;
        details: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
      }>>(url);

      return {
        success: true,
        message: 'User activity retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get user activity', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get user activity',
        'GET_USER_ACTIVITY_FAILED'
      );
    }
  }
}