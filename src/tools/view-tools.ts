import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { View, ViewSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListViewsSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['list', 'grid', 'card', 'timeline', 'calendar', 'chart', 'map', 'custom']).optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  includeData: z.boolean().default(false),
  dataLimit: z.number().min(1).max(1000).optional(),
});

export const CreateViewSchema = z.object({
  name: z.string().min(1, 'View name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  type: z.enum(['list', 'grid', 'card', 'timeline', 'calendar', 'chart', 'map', 'custom']),
  projectId: z.string().min(1, 'Project ID is required'),
  baseQuery: z.object({
    filters: z.record(z.unknown()).optional(),
    sorting: z.array(z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    })).optional(),
    grouping: z.array(z.string()).optional(),
    aggregations: z.array(z.object({
      field: z.string(),
      function: z.enum(['count', 'sum', 'avg', 'min', 'max']),
      alias: z.string().optional(),
    })).optional(),
  }),
  displayOptions: z.object({
    fields: z.array(z.object({
      fieldId: z.string(),
      label: z.string().optional(),
      visible: z.boolean().default(true),
      width: z.number().optional(),
      format: z.string().optional(),
      alignment: z.enum(['left', 'center', 'right']).default('left'),
    })),
    pageSize: z.number().min(1).max(1000).default(25),
    showFilters: z.boolean().default(true),
    showSearch: z.boolean().default(true),
    showExport: z.boolean().default(true),
    theme: z.string().optional(),
    customCss: z.string().optional(),
  }),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canDelete: z.array(z.string()).optional(),
    canShare: z.array(z.string()).optional(),
  }).optional(),
  sharing: z.object({
    isPublic: z.boolean().default(false),
    shareToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    allowAnonymous: z.boolean().default(false),
  }).optional(),
});

export const UpdateViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  name: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  baseQuery: z.object({
    filters: z.record(z.unknown()).optional(),
    sorting: z.array(z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    })).optional(),
    grouping: z.array(z.string()).optional(),
    aggregations: z.array(z.object({
      field: z.string(),
      function: z.enum(['count', 'sum', 'avg', 'min', 'max']),
      alias: z.string().optional(),
    })).optional(),
  }).optional(),
  displayOptions: z.object({
    fields: z.array(z.object({
      fieldId: z.string(),
      label: z.string().optional(),
      visible: z.boolean().default(true),
      width: z.number().optional(),
      format: z.string().optional(),
      alignment: z.enum(['left', 'center', 'right']).default('left'),
    })).optional(),
    pageSize: z.number().min(1).max(1000).optional(),
    showFilters: z.boolean().optional(),
    showSearch: z.boolean().optional(),
    showExport: z.boolean().optional(),
    theme: z.string().optional(),
    customCss: z.string().optional(),
  }).optional(),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canDelete: z.array(z.string()).optional(),
    canShare: z.array(z.string()).optional(),
  }).optional(),
  sharing: z.object({
    isPublic: z.boolean().optional(),
    shareToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    allowAnonymous: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export const DeleteViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
});

export const DuplicateViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  newName: z.string().min(1, 'New view name is required'),
  newDisplayName: z.string().optional(),
  targetProjectId: z.string().optional(),
});

export const ShareViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  isPublic: z.boolean(),
  expiresAt: z.string().datetime().optional(),
  allowAnonymous: z.boolean().default(false),
});

export const GetViewDataSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  filters: z.record(z.unknown()).optional(),
  sorting: z.array(z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(1000).optional(),
});

export const ExportViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  filters: z.record(z.unknown()).optional(),
  limit: z.number().min(1).max(10000).optional(),
});

export class ViewTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_views',
        description: 'List views with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            type: {
              type: 'string',
              enum: ['list', 'grid', 'card', 'timeline', 'calendar', 'chart', 'map', 'custom'],
              description: 'Filter by view type',
            },
            isSystem: {
              type: 'boolean',
              description: 'Filter by system view status',
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
        name: 'iconect_get_view',
        description: 'Get a specific view with optional data',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'View ID',
            },
            includeData: {
              type: 'boolean',
              description: 'Include view data in response (default: false)',
            },
            dataLimit: {
              type: 'number',
              description: 'Limit number of data rows returned (max: 1000)',
              minimum: 1,
              maximum: 1000,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_view',
        description: 'Create a new view',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'View internal name',
            },
            displayName: {
              type: 'string',
              description: 'View display name',
            },
            description: {
              type: 'string',
              description: 'View description',
            },
            type: {
              type: 'string',
              enum: ['list', 'grid', 'card', 'timeline', 'calendar', 'chart', 'map', 'custom'],
              description: 'View type',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            baseQuery: {
              type: 'object',
              properties: {
                filters: {
                  type: 'object',
                  description: 'Base filters for the view',
                },
                sorting: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      order: { type: 'string', enum: ['asc', 'desc'] },
                    },
                    required: ['field', 'order'],
                  },
                  description: 'Default sorting configuration',
                },
                grouping: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Grouping fields',
                },
                aggregations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      function: { type: 'string', enum: ['count', 'sum', 'avg', 'min', 'max'] },
                      alias: { type: 'string' },
                    },
                    required: ['field', 'function'],
                  },
                  description: 'Aggregation configuration',
                },
              },
              description: 'Base query configuration',
            },
            displayOptions: {
              type: 'object',
              properties: {
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fieldId: { type: 'string' },
                      label: { type: 'string' },
                      visible: { type: 'boolean', default: true },
                      width: { type: 'number' },
                      format: { type: 'string' },
                      alignment: { type: 'string', enum: ['left', 'center', 'right'], default: 'left' },
                    },
                    required: ['fieldId'],
                  },
                  description: 'Field display configuration',
                },
                pageSize: { type: 'number', minimum: 1, maximum: 1000, default: 25 },
                showFilters: { type: 'boolean', default: true },
                showSearch: { type: 'boolean', default: true },
                showExport: { type: 'boolean', default: true },
                theme: { type: 'string' },
                customCss: { type: 'string' },
              },
              required: ['fields'],
              description: 'Display options configuration',
            },
            permissions: {
              type: 'object',
              properties: {
                canView: { type: 'array', items: { type: 'string' } },
                canEdit: { type: 'array', items: { type: 'string' } },
                canDelete: { type: 'array', items: { type: 'string' } },
                canShare: { type: 'array', items: { type: 'string' } },
              },
              description: 'View permissions',
            },
            sharing: {
              type: 'object',
              properties: {
                isPublic: { type: 'boolean', default: false },
                shareToken: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' },
                allowAnonymous: { type: 'boolean', default: false },
              },
              description: 'Sharing configuration',
            },
          },
          required: ['name', 'displayName', 'type', 'projectId', 'baseQuery', 'displayOptions'],
        },
      },
      {
        name: 'iconect_update_view',
        description: 'Update an existing view',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'View ID',
            },
            name: {
              type: 'string',
              description: 'Updated view name',
            },
            displayName: {
              type: 'string',
              description: 'Updated display name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            baseQuery: {
              type: 'object',
              description: 'Updated base query configuration',
            },
            displayOptions: {
              type: 'object',
              description: 'Updated display options',
            },
            permissions: {
              type: 'object',
              description: 'Updated permissions',
            },
            sharing: {
              type: 'object',
              description: 'Updated sharing configuration',
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
        name: 'iconect_delete_view',
        description: 'Delete a view',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'View ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_duplicate_view',
        description: 'Duplicate a view with new configuration',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Source view ID',
            },
            newName: {
              type: 'string',
              description: 'New view name',
            },
            newDisplayName: {
              type: 'string',
              description: 'New display name (optional)',
            },
            targetProjectId: {
              type: 'string',
              description: 'Target project ID (optional)',
            },
          },
          required: ['id', 'newName'],
        },
      },
      {
        name: 'iconect_share_view',
        description: 'Configure view sharing settings',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'View ID',
            },
            isPublic: {
              type: 'boolean',
              description: 'Make view public',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Share expiration date (optional)',
            },
            allowAnonymous: {
              type: 'boolean',
              description: 'Allow anonymous access (default: false)',
            },
          },
          required: ['id', 'isPublic'],
        },
      },
      {
        name: 'iconect_get_view_data',
        description: 'Get data for a specific view with filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'View ID',
            },
            filters: {
              type: 'object',
              description: 'Additional filters to apply',
            },
            sorting: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  order: { type: 'string', enum: ['asc', 'desc'] },
                },
                required: ['field', 'order'],
              },
              description: 'Sorting override',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
              minimum: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of items per page (default: 25, max: 1000)',
              minimum: 1,
              maximum: 1000,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_export_view',
        description: 'Export view data in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'View ID',
            },
            format: {
              type: 'string',
              enum: ['csv', 'xlsx', 'pdf', 'json'],
              description: 'Export format',
            },
            filters: {
              type: 'object',
              description: 'Filters to apply before export',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to export (max: 10000)',
              minimum: 1,
              maximum: 10000,
            },
          },
          required: ['id', 'format'],
        },
      },
    ];
  }

  async handleListViews(args: unknown): Promise<unknown> {
    try {
      const options = ListViewsSchema.parse(args);
      logger.info('Listing views', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.type) queryParams.append('type', options.type);
      if (options.isSystem !== undefined) queryParams.append('isSystem', options.isSystem.toString());
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/views${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<View>>(url);

      return {
        success: true,
        message: 'Views retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list views', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list views',
        'LIST_VIEWS_FAILED'
      );
    }
  }

  async handleGetView(args: unknown): Promise<unknown> {
    try {
      const { id, includeData, dataLimit } = GetViewSchema.parse(args);
      logger.info('Getting view', { id, includeData, dataLimit });

      const queryParams = new URLSearchParams();
      if (includeData) queryParams.append('includeData', 'true');
      if (dataLimit) queryParams.append('dataLimit', dataLimit.toString());

      const url = `/views/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<View>(url);
      const view = ViewSchema.parse(response);

      return {
        success: true,
        message: 'View retrieved successfully',
        data: view,
      };
    } catch (error) {
      logger.error('Failed to get view', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get view',
        'GET_VIEW_FAILED'
      );
    }
  }

  async handleCreateView(args: unknown): Promise<unknown> {
    try {
      const viewData = CreateViewSchema.parse(args);
      logger.info('Creating view', { name: viewData.name, type: viewData.type, projectId: viewData.projectId });

      const response = await this.httpClient.post<View>('/views', viewData);
      const view = ViewSchema.parse(response);

      return {
        success: true,
        message: 'View created successfully',
        data: view,
      };
    } catch (error) {
      logger.error('Failed to create view', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create view',
        'CREATE_VIEW_FAILED'
      );
    }
  }

  async handleUpdateView(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateViewSchema.parse(args);
      logger.info('Updating view', { id });

      const response = await this.httpClient.put<View>(`/views/${id}`, updateData);
      const view = ViewSchema.parse(response);

      return {
        success: true,
        message: 'View updated successfully',
        data: view,
      };
    } catch (error) {
      logger.error('Failed to update view', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update view',
        'UPDATE_VIEW_FAILED'
      );
    }
  }

  async handleDeleteView(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteViewSchema.parse(args);
      logger.info('Deleting view', { id });

      await this.httpClient.delete(`/views/${id}`);

      return {
        success: true,
        message: 'View deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete view', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete view',
        'DELETE_VIEW_FAILED'
      );
    }
  }

  async handleDuplicateView(args: unknown): Promise<unknown> {
    try {
      const duplicateData = DuplicateViewSchema.parse(args);
      logger.info('Duplicating view', { 
        id: duplicateData.id, 
        newName: duplicateData.newName,
        targetProjectId: duplicateData.targetProjectId 
      });

      const response = await this.httpClient.post<View>(`/views/${duplicateData.id}/duplicate`, {
        newName: duplicateData.newName,
        newDisplayName: duplicateData.newDisplayName,
        targetProjectId: duplicateData.targetProjectId,
      });
      const view = ViewSchema.parse(response);

      return {
        success: true,
        message: 'View duplicated successfully',
        data: view,
      };
    } catch (error) {
      logger.error('Failed to duplicate view', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to duplicate view',
        'DUPLICATE_VIEW_FAILED'
      );
    }
  }

  async handleShareView(args: unknown): Promise<unknown> {
    try {
      const shareData = ShareViewSchema.parse(args);
      logger.info('Configuring view sharing', { id: shareData.id, isPublic: shareData.isPublic });

      const response = await this.httpClient.post<{
        shareToken?: string;
        shareUrl?: string;
        expiresAt?: string;
        isPublic: boolean;
        allowAnonymous: boolean;
      }>(`/views/${shareData.id}/share`, {
        isPublic: shareData.isPublic,
        expiresAt: shareData.expiresAt,
        allowAnonymous: shareData.allowAnonymous,
      });

      return {
        success: true,
        message: 'View sharing configured successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to configure view sharing', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to configure view sharing',
        'SHARE_VIEW_FAILED'
      );
    }
  }

  async handleGetViewData(args: unknown): Promise<unknown> {
    try {
      const dataOptions = GetViewDataSchema.parse(args);
      logger.info('Getting view data', { id: dataOptions.id });

      const queryParams = new URLSearchParams();
      if (dataOptions.page) queryParams.append('page', dataOptions.page.toString());
      if (dataOptions.pageSize) queryParams.append('pageSize', dataOptions.pageSize.toString());

      const requestBody: Record<string, unknown> = {};
      if (dataOptions.filters) requestBody.filters = dataOptions.filters;
      if (dataOptions.sorting) requestBody.sorting = dataOptions.sorting;

      const url = `/views/${dataOptions.id}/data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.post<PaginatedResponse<Record<string, unknown>>>(url, requestBody);

      return {
        success: true,
        message: 'View data retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get view data', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get view data',
        'GET_VIEW_DATA_FAILED'
      );
    }
  }

  async handleExportView(args: unknown): Promise<unknown> {
    try {
      const exportData = ExportViewSchema.parse(args);
      logger.info('Exporting view', { id: exportData.id, format: exportData.format });

      const response = await this.httpClient.post<{
        downloadUrl: string;
        fileName: string;
        fileSize: number;
        expiresAt: string;
      }>(`/views/${exportData.id}/export`, {
        format: exportData.format,
        filters: exportData.filters,
        limit: exportData.limit,
      });

      return {
        success: true,
        message: 'View export initiated successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to export view', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to export view',
        'EXPORT_VIEW_FAILED'
      );
    }
  }
}