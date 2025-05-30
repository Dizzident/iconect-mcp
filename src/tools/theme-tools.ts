import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Theme, ThemeSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListThemesSchema = z.object({
  type: z.enum(['light', 'dark', 'custom']).optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetThemeSchema = z.object({
  id: z.string().min(1, 'Theme ID is required'),
});

export const CreateThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  description: z.string().optional(),
  type: z.enum(['light', 'dark', 'custom']),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textSecondary: z.string(),
    border: z.string(),
    success: z.string(),
    warning: z.string(),
    error: z.string(),
    info: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.object({
      small: z.string(),
      medium: z.string(),
      large: z.string(),
      xlarge: z.string(),
    }),
    fontWeight: z.object({
      light: z.number(),
      normal: z.number(),
      medium: z.number(),
      bold: z.number(),
    }),
  }).optional(),
  spacing: z.object({
    xs: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }).optional(),
  borderRadius: z.object({
    small: z.string(),
    medium: z.string(),
    large: z.string(),
  }).optional(),
  shadows: z.object({
    small: z.string(),
    medium: z.string(),
    large: z.string(),
  }).optional(),
});

export const UpdateThemeSchema = z.object({
  id: z.string().min(1, 'Theme ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    surface: z.string().optional(),
    text: z.string().optional(),
    textSecondary: z.string().optional(),
    border: z.string().optional(),
    success: z.string().optional(),
    warning: z.string().optional(),
    error: z.string().optional(),
    info: z.string().optional(),
  }).optional(),
  typography: z.object({
    fontFamily: z.string().optional(),
    fontSize: z.object({
      small: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional(),
      xlarge: z.string().optional(),
    }).optional(),
    fontWeight: z.object({
      light: z.number().optional(),
      normal: z.number().optional(),
      medium: z.number().optional(),
      bold: z.number().optional(),
    }).optional(),
  }).optional(),
  spacing: z.object({
    xs: z.string().optional(),
    sm: z.string().optional(),
    md: z.string().optional(),
    lg: z.string().optional(),
    xl: z.string().optional(),
  }).optional(),
  borderRadius: z.object({
    small: z.string().optional(),
    medium: z.string().optional(),
    large: z.string().optional(),
  }).optional(),
  shadows: z.object({
    small: z.string().optional(),
    medium: z.string().optional(),
    large: z.string().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export const DeleteThemeSchema = z.object({
  id: z.string().min(1, 'Theme ID is required'),
});

export const DuplicateThemeSchema = z.object({
  id: z.string().min(1, 'Theme ID is required'),
  newName: z.string().min(1, 'New theme name is required'),
});

export const ApplyThemeSchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
  scope: z.enum(['global', 'user', 'project']).default('user'),
  targetId: z.string().optional(),
});

export const GetCurrentThemeSchema = z.object({
  scope: z.enum(['global', 'user', 'project']).optional(),
  targetId: z.string().optional(),
});

export const PreviewThemeSchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
  component: z.enum(['button', 'card', 'table', 'form', 'dashboard']).optional(),
});

export const ValidateThemeSchema = z.object({
  themeData: z.object({
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      surface: z.string(),
      text: z.string(),
      textSecondary: z.string(),
      border: z.string(),
      success: z.string(),
      warning: z.string(),
      error: z.string(),
      info: z.string(),
    }),
    typography: z.object({
      fontFamily: z.string(),
      fontSize: z.object({
        small: z.string(),
        medium: z.string(),
        large: z.string(),
        xlarge: z.string(),
      }),
    }).optional(),
  }),
});

export const ExportThemeSchema = z.object({
  id: z.string().min(1, 'Theme ID is required'),
  format: z.enum(['json', 'css', 'scss']),
});

export const ImportThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  format: z.enum(['json', 'css', 'scss']),
  data: z.string().min(1, 'Theme data is required'),
  overwrite: z.boolean().default(false),
});

export class ThemeTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_themes',
        description: 'List themes with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['light', 'dark', 'custom'],
              description: 'Filter by theme type',
            },
            isSystem: {
              type: 'boolean',
              description: 'Filter by system theme status',
            },
            isActive: {
              type: 'boolean',
              description: 'Filter by active status',
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
              description: 'Field to sort by (e.g., "name", "type", "createdDate")',
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
        name: 'iconect_get_theme',
        description: 'Get a specific theme',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Theme ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_theme',
        description: 'Create a new theme',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Theme name',
            },
            description: {
              type: 'string',
              description: 'Theme description',
            },
            type: {
              type: 'string',
              enum: ['light', 'dark', 'custom'],
              description: 'Theme type',
            },
            colors: {
              type: 'object',
              properties: {
                primary: { type: 'string' },
                secondary: { type: 'string' },
                accent: { type: 'string' },
                background: { type: 'string' },
                surface: { type: 'string' },
                text: { type: 'string' },
                textSecondary: { type: 'string' },
                border: { type: 'string' },
                success: { type: 'string' },
                warning: { type: 'string' },
                error: { type: 'string' },
                info: { type: 'string' },
              },
              required: ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textSecondary', 'border', 'success', 'warning', 'error', 'info'],
              description: 'Theme color palette',
            },
            typography: {
              type: 'object',
              properties: {
                fontFamily: { type: 'string' },
                fontSize: {
                  type: 'object',
                  properties: {
                    small: { type: 'string' },
                    medium: { type: 'string' },
                    large: { type: 'string' },
                    xlarge: { type: 'string' },
                  },
                  required: ['small', 'medium', 'large', 'xlarge'],
                },
                fontWeight: {
                  type: 'object',
                  properties: {
                    light: { type: 'number' },
                    normal: { type: 'number' },
                    medium: { type: 'number' },
                    bold: { type: 'number' },
                  },
                  required: ['light', 'normal', 'medium', 'bold'],
                },
              },
              required: ['fontFamily', 'fontSize', 'fontWeight'],
              description: 'Typography settings',
            },
            spacing: {
              type: 'object',
              properties: {
                xs: { type: 'string' },
                sm: { type: 'string' },
                md: { type: 'string' },
                lg: { type: 'string' },
                xl: { type: 'string' },
              },
              required: ['xs', 'sm', 'md', 'lg', 'xl'],
              description: 'Spacing scale',
            },
            borderRadius: {
              type: 'object',
              properties: {
                small: { type: 'string' },
                medium: { type: 'string' },
                large: { type: 'string' },
              },
              required: ['small', 'medium', 'large'],
              description: 'Border radius values',
            },
            shadows: {
              type: 'object',
              properties: {
                small: { type: 'string' },
                medium: { type: 'string' },
                large: { type: 'string' },
              },
              required: ['small', 'medium', 'large'],
              description: 'Shadow definitions',
            },
          },
          required: ['name', 'type', 'colors'],
        },
      },
      {
        name: 'iconect_update_theme',
        description: 'Update an existing theme',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Theme ID',
            },
            name: {
              type: 'string',
              description: 'Updated theme name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            colors: {
              type: 'object',
              description: 'Updated color palette',
            },
            typography: {
              type: 'object',
              description: 'Updated typography settings',
            },
            spacing: {
              type: 'object',
              description: 'Updated spacing scale',
            },
            borderRadius: {
              type: 'object',
              description: 'Updated border radius values',
            },
            shadows: {
              type: 'object',
              description: 'Updated shadow definitions',
            },
            isActive: {
              type: 'boolean',
              description: 'Updated active status',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_theme',
        description: 'Delete a theme',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Theme ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_duplicate_theme',
        description: 'Duplicate a theme with new name',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Source theme ID',
            },
            newName: {
              type: 'string',
              description: 'New theme name',
            },
          },
          required: ['id', 'newName'],
        },
      },
      {
        name: 'iconect_apply_theme',
        description: 'Apply a theme to user, project, or globally',
        inputSchema: {
          type: 'object',
          properties: {
            themeId: {
              type: 'string',
              description: 'Theme ID to apply',
            },
            scope: {
              type: 'string',
              enum: ['global', 'user', 'project'],
              description: 'Application scope (default: user)',
            },
            targetId: {
              type: 'string',
              description: 'Target ID for project scope (optional)',
            },
          },
          required: ['themeId'],
        },
      },
      {
        name: 'iconect_get_current_theme',
        description: 'Get currently applied theme for scope',
        inputSchema: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              enum: ['global', 'user', 'project'],
              description: 'Theme scope to check',
            },
            targetId: {
              type: 'string',
              description: 'Target ID for project scope',
            },
          },
        },
      },
      {
        name: 'iconect_preview_theme',
        description: 'Preview a theme on specific components',
        inputSchema: {
          type: 'object',
          properties: {
            themeId: {
              type: 'string',
              description: 'Theme ID to preview',
            },
            component: {
              type: 'string',
              enum: ['button', 'card', 'table', 'form', 'dashboard'],
              description: 'Component to preview (optional)',
            },
          },
          required: ['themeId'],
        },
      },
      {
        name: 'iconect_validate_theme',
        description: 'Validate theme data for compliance',
        inputSchema: {
          type: 'object',
          properties: {
            themeData: {
              type: 'object',
              properties: {
                colors: {
                  type: 'object',
                  description: 'Color palette to validate',
                },
                typography: {
                  type: 'object',
                  description: 'Typography settings to validate',
                },
              },
              required: ['colors'],
              description: 'Theme data to validate',
            },
          },
          required: ['themeData'],
        },
      },
      {
        name: 'iconect_export_theme',
        description: 'Export theme in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Theme ID',
            },
            format: {
              type: 'string',
              enum: ['json', 'css', 'scss'],
              description: 'Export format',
            },
          },
          required: ['id', 'format'],
        },
      },
      {
        name: 'iconect_import_theme',
        description: 'Import theme from external source',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name for imported theme',
            },
            format: {
              type: 'string',
              enum: ['json', 'css', 'scss'],
              description: 'Import format',
            },
            data: {
              type: 'string',
              description: 'Theme data to import',
            },
            overwrite: {
              type: 'boolean',
              description: 'Overwrite existing theme with same name (default: false)',
            },
          },
          required: ['name', 'format', 'data'],
        },
      },
    ];
  }

  async handleListThemes(args: unknown): Promise<unknown> {
    try {
      const options = ListThemesSchema.parse(args);
      logger.info('Listing themes', { options });

      const queryParams = new URLSearchParams();
      if (options.type) queryParams.append('type', options.type);
      if (options.isSystem !== undefined) queryParams.append('isSystem', options.isSystem.toString());
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/themes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<Theme>>(url);

      return {
        success: true,
        message: 'Themes retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list themes', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list themes',
        'LIST_THEMES_FAILED'
      );
    }
  }

  async handleGetTheme(args: unknown): Promise<unknown> {
    try {
      const { id } = GetThemeSchema.parse(args);
      logger.info('Getting theme', { id });

      const response = await this.httpClient.get<Theme>(`/themes/${id}`);
      const theme = ThemeSchema.parse(response);

      return {
        success: true,
        message: 'Theme retrieved successfully',
        data: theme,
      };
    } catch (error) {
      logger.error('Failed to get theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get theme',
        'GET_THEME_FAILED'
      );
    }
  }

  async handleCreateTheme(args: unknown): Promise<unknown> {
    try {
      const themeData = CreateThemeSchema.parse(args);
      logger.info('Creating theme', { name: themeData.name, type: themeData.type });

      const response = await this.httpClient.post<Theme>('/themes', themeData);
      const theme = ThemeSchema.parse(response);

      return {
        success: true,
        message: 'Theme created successfully',
        data: theme,
      };
    } catch (error) {
      logger.error('Failed to create theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create theme',
        'CREATE_THEME_FAILED'
      );
    }
  }

  async handleUpdateTheme(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateThemeSchema.parse(args);
      logger.info('Updating theme', { id });

      const response = await this.httpClient.put<Theme>(`/themes/${id}`, updateData);
      const theme = ThemeSchema.parse(response);

      return {
        success: true,
        message: 'Theme updated successfully',
        data: theme,
      };
    } catch (error) {
      logger.error('Failed to update theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update theme',
        'UPDATE_THEME_FAILED'
      );
    }
  }

  async handleDeleteTheme(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteThemeSchema.parse(args);
      logger.info('Deleting theme', { id });

      await this.httpClient.delete(`/themes/${id}`);

      return {
        success: true,
        message: 'Theme deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete theme',
        'DELETE_THEME_FAILED'
      );
    }
  }

  async handleDuplicateTheme(args: unknown): Promise<unknown> {
    try {
      const duplicateData = DuplicateThemeSchema.parse(args);
      logger.info('Duplicating theme', { id: duplicateData.id, newName: duplicateData.newName });

      const response = await this.httpClient.post<Theme>(`/themes/${duplicateData.id}/duplicate`, {
        newName: duplicateData.newName,
      });
      const theme = ThemeSchema.parse(response);

      return {
        success: true,
        message: 'Theme duplicated successfully',
        data: theme,
      };
    } catch (error) {
      logger.error('Failed to duplicate theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to duplicate theme',
        'DUPLICATE_THEME_FAILED'
      );
    }
  }

  async handleApplyTheme(args: unknown): Promise<unknown> {
    try {
      const applyData = ApplyThemeSchema.parse(args);
      logger.info('Applying theme', { themeId: applyData.themeId, scope: applyData.scope });

      const requestBody: Record<string, unknown> = {
        scope: applyData.scope,
      };
      if (applyData.targetId) requestBody.targetId = applyData.targetId;

      await this.httpClient.post(`/themes/${applyData.themeId}/apply`, requestBody);

      return {
        success: true,
        message: 'Theme applied successfully',
        data: { themeId: applyData.themeId, scope: applyData.scope },
      };
    } catch (error) {
      logger.error('Failed to apply theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to apply theme',
        'APPLY_THEME_FAILED'
      );
    }
  }

  async handleGetCurrentTheme(args: unknown): Promise<unknown> {
    try {
      const options = GetCurrentThemeSchema.parse(args);
      logger.info('Getting current theme', { scope: options.scope });

      const queryParams = new URLSearchParams();
      if (options.scope) queryParams.append('scope', options.scope);
      if (options.targetId) queryParams.append('targetId', options.targetId);

      const url = `/themes/current${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<{
        theme: Theme;
        scope: string;
        appliedAt: string;
        appliedBy: string;
      }>(url);

      return {
        success: true,
        message: 'Current theme retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get current theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get current theme',
        'GET_CURRENT_THEME_FAILED'
      );
    }
  }

  async handlePreviewTheme(args: unknown): Promise<unknown> {
    try {
      const previewData = PreviewThemeSchema.parse(args);
      logger.info('Previewing theme', { themeId: previewData.themeId, component: previewData.component });

      const requestBody: Record<string, unknown> = {};
      if (previewData.component) requestBody.component = previewData.component;

      const response = await this.httpClient.post<{
        previewUrl: string;
        expiresAt: string;
        components: Array<{
          name: string;
          previewHtml: string;
        }>;
      }>(`/themes/${previewData.themeId}/preview`, requestBody);

      return {
        success: true,
        message: 'Theme preview generated successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to preview theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to preview theme',
        'PREVIEW_THEME_FAILED'
      );
    }
  }

  async handleValidateTheme(args: unknown): Promise<unknown> {
    try {
      const validateData = ValidateThemeSchema.parse(args);
      logger.info('Validating theme data');

      const response = await this.httpClient.post<{
        isValid: boolean;
        errors: Array<{
          field: string;
          message: string;
          code: string;
        }>;
        warnings: Array<{
          field: string;
          message: string;
          code: string;
        }>;
        suggestions: Array<{
          field: string;
          suggestion: string;
          reason: string;
        }>;
      }>('/themes/validate', validateData.themeData);

      return {
        success: true,
        message: 'Theme validation completed',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to validate theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to validate theme',
        'VALIDATE_THEME_FAILED'
      );
    }
  }

  async handleExportTheme(args: unknown): Promise<unknown> {
    try {
      const exportData = ExportThemeSchema.parse(args);
      logger.info('Exporting theme', { id: exportData.id, format: exportData.format });

      const response = await this.httpClient.post<{
        content: string;
        fileName: string;
        format: string;
        downloadUrl?: string;
      }>(`/themes/${exportData.id}/export`, {
        format: exportData.format,
      });

      return {
        success: true,
        message: 'Theme exported successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to export theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to export theme',
        'EXPORT_THEME_FAILED'
      );
    }
  }

  async handleImportTheme(args: unknown): Promise<unknown> {
    try {
      const importData = ImportThemeSchema.parse(args);
      logger.info('Importing theme', { name: importData.name, format: importData.format });

      const response = await this.httpClient.post<{
        theme: Theme;
        importedAt: string;
        warnings?: Array<{
          field: string;
          message: string;
        }>;
      }>('/themes/import', {
        name: importData.name,
        format: importData.format,
        data: importData.data,
        overwrite: importData.overwrite,
      });

      return {
        success: true,
        message: 'Theme imported successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to import theme', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to import theme',
        'IMPORT_THEME_FAILED'
      );
    }
  }
}