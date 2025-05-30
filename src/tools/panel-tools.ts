import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Panel, PanelSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListPanelsSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['grid', 'form', 'chart', 'report', 'dashboard', 'custom']).optional(),
  folderId: z.string().optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetPanelSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
  includeData: z.boolean().default(false),
  dataLimit: z.number().min(1).max(1000).optional(),
});

export const CreatePanelSchema = z.object({
  name: z.string().min(1, 'Panel name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  type: z.enum(['grid', 'form', 'chart', 'report', 'dashboard', 'custom']),
  projectId: z.string().min(1, 'Project ID is required'),
  folderId: z.string().optional(),
  layout: z.object({
    columns: z.array(z.object({
      id: z.string(),
      name: z.string(),
      fieldId: z.string().optional(),
      width: z.number().optional(),
      sortable: z.boolean().default(true),
      filterable: z.boolean().default(true),
      visible: z.boolean().default(true),
      alignment: z.enum(['left', 'center', 'right']).default('left'),
      format: z.string().optional(),
    })),
    pagination: z.object({
      enabled: z.boolean().default(true),
      pageSize: z.number().min(1).max(1000).default(25),
      pageSizeOptions: z.array(z.number()).optional(),
    }).optional(),
    sorting: z.object({
      defaultSort: z.string().optional(),
      defaultOrder: z.enum(['asc', 'desc']).default('asc'),
      multiSort: z.boolean().default(false),
    }).optional(),
    filtering: z.object({
      enabled: z.boolean().default(true),
      quickSearch: z.boolean().default(true),
      advancedFilters: z.boolean().default(false),
    }).optional(),
  }),
  configuration: z.object({
    theme: z.string().optional(),
    responsive: z.boolean().default(true),
    exportOptions: z.array(z.enum(['csv', 'xlsx', 'pdf', 'json'])).optional(),
    refreshInterval: z.number().min(0).optional(),
    cacheTimeout: z.number().min(0).optional(),
  }).optional(),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canDelete: z.array(z.string()).optional(),
    canExport: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdatePanelSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
  name: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  folderId: z.string().optional(),
  layout: z.object({
    columns: z.array(z.object({
      id: z.string(),
      name: z.string(),
      fieldId: z.string().optional(),
      width: z.number().optional(),
      sortable: z.boolean().default(true),
      filterable: z.boolean().default(true),
      visible: z.boolean().default(true),
      alignment: z.enum(['left', 'center', 'right']).default('left'),
      format: z.string().optional(),
    })),
    pagination: z.object({
      enabled: z.boolean().default(true),
      pageSize: z.number().min(1).max(1000).default(25),
      pageSizeOptions: z.array(z.number()).optional(),
    }).optional(),
    sorting: z.object({
      defaultSort: z.string().optional(),
      defaultOrder: z.enum(['asc', 'desc']).default('asc'),
      multiSort: z.boolean().default(false),
    }).optional(),
    filtering: z.object({
      enabled: z.boolean().default(true),
      quickSearch: z.boolean().default(true),
      advancedFilters: z.boolean().default(false),
    }).optional(),
  }).optional(),
  configuration: z.object({
    theme: z.string().optional(),
    responsive: z.boolean().default(true),
    exportOptions: z.array(z.enum(['csv', 'xlsx', 'pdf', 'json'])).optional(),
    refreshInterval: z.number().min(0).optional(),
    cacheTimeout: z.number().min(0).optional(),
  }).optional(),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canDelete: z.array(z.string()).optional(),
    canExport: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const DeletePanelSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
});

export const DuplicatePanelSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
  newName: z.string().min(1, 'New panel name is required'),
  newDisplayName: z.string().optional(),
  targetProjectId: z.string().optional(),
  targetFolderId: z.string().optional(),
});

export const ExportPanelSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  includeData: z.boolean().default(true),
  filters: z.record(z.unknown()).optional(),
  limit: z.number().min(1).max(10000).optional(),
});

export const GetPanelDataSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
  filters: z.record(z.unknown()).optional(),
  sorting: z.array(z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(1000).optional(),
});

export class PanelTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_panels',
        description: 'List panels with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            type: {
              type: 'string',
              enum: ['grid', 'form', 'chart', 'report', 'dashboard', 'custom'],
              description: 'Filter by panel type',
            },
            folderId: {
              type: 'string',
              description: 'Filter by folder ID',
            },
            isSystem: {
              type: 'boolean',
              description: 'Filter by system panel status',
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
        name: 'iconect_get_panel',
        description: 'Get a specific panel with optional data',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Panel ID',
            },
            includeData: {
              type: 'boolean',
              description: 'Include panel data in response (default: false)',
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
        name: 'iconect_create_panel',
        description: 'Create a new panel',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Panel internal name',
            },
            displayName: {
              type: 'string',
              description: 'Panel display name',
            },
            description: {
              type: 'string',
              description: 'Panel description',
            },
            type: {
              type: 'string',
              enum: ['grid', 'form', 'chart', 'report', 'dashboard', 'custom'],
              description: 'Panel type',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID (optional)',
            },
            layout: {
              type: 'object',
              properties: {
                columns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      fieldId: { type: 'string' },
                      width: { type: 'number' },
                      sortable: { type: 'boolean', default: true },
                      filterable: { type: 'boolean', default: true },
                      visible: { type: 'boolean', default: true },
                      alignment: { type: 'string', enum: ['left', 'center', 'right'], default: 'left' },
                      format: { type: 'string' },
                    },
                    required: ['id', 'name'],
                  },
                  description: 'Panel columns configuration',
                },
                pagination: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean', default: true },
                    pageSize: { type: 'number', minimum: 1, maximum: 1000, default: 25 },
                    pageSizeOptions: { type: 'array', items: { type: 'number' } },
                  },
                  description: 'Pagination settings',
                },
                sorting: {
                  type: 'object',
                  properties: {
                    defaultSort: { type: 'string' },
                    defaultOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
                    multiSort: { type: 'boolean', default: false },
                  },
                  description: 'Sorting configuration',
                },
                filtering: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean', default: true },
                    quickSearch: { type: 'boolean', default: true },
                    advancedFilters: { type: 'boolean', default: false },
                  },
                  description: 'Filtering options',
                },
              },
              required: ['columns'],
              description: 'Panel layout configuration',
            },
            configuration: {
              type: 'object',
              properties: {
                theme: { type: 'string' },
                responsive: { type: 'boolean', default: true },
                exportOptions: { type: 'array', items: { type: 'string', enum: ['csv', 'xlsx', 'pdf', 'json'] } },
                refreshInterval: { type: 'number', minimum: 0 },
                cacheTimeout: { type: 'number', minimum: 0 },
              },
              description: 'Panel configuration',
            },
            permissions: {
              type: 'object',
              properties: {
                canView: { type: 'array', items: { type: 'string' } },
                canEdit: { type: 'array', items: { type: 'string' } },
                canDelete: { type: 'array', items: { type: 'string' } },
                canExport: { type: 'array', items: { type: 'string' } },
              },
              description: 'Panel permissions',
            },
            metadata: {
              type: 'object',
              description: 'Additional panel metadata',
            },
          },
          required: ['name', 'displayName', 'type', 'projectId', 'layout'],
        },
      },
      {
        name: 'iconect_update_panel',
        description: 'Update an existing panel',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Panel ID',
            },
            name: {
              type: 'string',
              description: 'Updated panel name',
            },
            displayName: {
              type: 'string',
              description: 'Updated display name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            folderId: {
              type: 'string',
              description: 'Updated folder ID',
            },
            layout: {
              type: 'object',
              description: 'Updated layout configuration',
            },
            configuration: {
              type: 'object',
              description: 'Updated panel configuration',
            },
            permissions: {
              type: 'object',
              description: 'Updated permissions',
            },
            metadata: {
              type: 'object',
              description: 'Updated metadata',
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
        name: 'iconect_delete_panel',
        description: 'Delete a panel',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Panel ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_duplicate_panel',
        description: 'Duplicate a panel with new configuration',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Source panel ID',
            },
            newName: {
              type: 'string',
              description: 'New panel name',
            },
            newDisplayName: {
              type: 'string',
              description: 'New display name (optional)',
            },
            targetProjectId: {
              type: 'string',
              description: 'Target project ID (optional, defaults to source project)',
            },
            targetFolderId: {
              type: 'string',
              description: 'Target folder ID (optional)',
            },
          },
          required: ['id', 'newName'],
        },
      },
      {
        name: 'iconect_export_panel',
        description: 'Export panel data in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Panel ID',
            },
            format: {
              type: 'string',
              enum: ['csv', 'xlsx', 'pdf', 'json'],
              description: 'Export format',
            },
            includeData: {
              type: 'boolean',
              description: 'Include panel data (default: true)',
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
      {
        name: 'iconect_get_panel_data',
        description: 'Get data for a specific panel with filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Panel ID',
            },
            filters: {
              type: 'object',
              description: 'Filters to apply',
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
              description: 'Sorting configuration',
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
    ];
  }

  async handleListPanels(args: unknown): Promise<unknown> {
    try {
      const options = ListPanelsSchema.parse(args);
      logger.info('Listing panels', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.type) queryParams.append('type', options.type);
      if (options.folderId) queryParams.append('folderId', options.folderId);
      if (options.isSystem !== undefined) queryParams.append('isSystem', options.isSystem.toString());
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/panels${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<Panel>>(url);

      return {
        success: true,
        message: 'Panels retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list panels', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list panels',
        'LIST_PANELS_FAILED'
      );
    }
  }

  async handleGetPanel(args: unknown): Promise<unknown> {
    try {
      const { id, includeData, dataLimit } = GetPanelSchema.parse(args);
      logger.info('Getting panel', { id, includeData, dataLimit });

      const queryParams = new URLSearchParams();
      if (includeData) queryParams.append('includeData', 'true');
      if (dataLimit) queryParams.append('dataLimit', dataLimit.toString());

      const url = `/panels/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<Panel>(url);
      const panel = PanelSchema.parse(response);

      return {
        success: true,
        message: 'Panel retrieved successfully',
        data: panel,
      };
    } catch (error) {
      logger.error('Failed to get panel', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get panel',
        'GET_PANEL_FAILED'
      );
    }
  }

  async handleCreatePanel(args: unknown): Promise<unknown> {
    try {
      const panelData = CreatePanelSchema.parse(args);
      logger.info('Creating panel', { name: panelData.name, type: panelData.type, projectId: panelData.projectId });

      const response = await this.httpClient.post<Panel>('/panels', panelData);
      const panel = PanelSchema.parse(response);

      return {
        success: true,
        message: 'Panel created successfully',
        data: panel,
      };
    } catch (error) {
      logger.error('Failed to create panel', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create panel',
        'CREATE_PANEL_FAILED'
      );
    }
  }

  async handleUpdatePanel(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdatePanelSchema.parse(args);
      logger.info('Updating panel', { id });

      const response = await this.httpClient.put<Panel>(`/panels/${id}`, updateData);
      const panel = PanelSchema.parse(response);

      return {
        success: true,
        message: 'Panel updated successfully',
        data: panel,
      };
    } catch (error) {
      logger.error('Failed to update panel', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update panel',
        'UPDATE_PANEL_FAILED'
      );
    }
  }

  async handleDeletePanel(args: unknown): Promise<unknown> {
    try {
      const { id } = DeletePanelSchema.parse(args);
      logger.info('Deleting panel', { id });

      await this.httpClient.delete(`/panels/${id}`);

      return {
        success: true,
        message: 'Panel deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete panel', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete panel',
        'DELETE_PANEL_FAILED'
      );
    }
  }

  async handleDuplicatePanel(args: unknown): Promise<unknown> {
    try {
      const duplicateData = DuplicatePanelSchema.parse(args);
      logger.info('Duplicating panel', { 
        id: duplicateData.id, 
        newName: duplicateData.newName,
        targetProjectId: duplicateData.targetProjectId 
      });

      const response = await this.httpClient.post<Panel>(`/panels/${duplicateData.id}/duplicate`, {
        newName: duplicateData.newName,
        newDisplayName: duplicateData.newDisplayName,
        targetProjectId: duplicateData.targetProjectId,
        targetFolderId: duplicateData.targetFolderId,
      });
      const panel = PanelSchema.parse(response);

      return {
        success: true,
        message: 'Panel duplicated successfully',
        data: panel,
      };
    } catch (error) {
      logger.error('Failed to duplicate panel', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to duplicate panel',
        'DUPLICATE_PANEL_FAILED'
      );
    }
  }

  async handleExportPanel(args: unknown): Promise<unknown> {
    try {
      const exportData = ExportPanelSchema.parse(args);
      logger.info('Exporting panel', { id: exportData.id, format: exportData.format });

      const response = await this.httpClient.post<{
        downloadUrl: string;
        fileName: string;
        fileSize: number;
        expiresAt: string;
      }>(`/panels/${exportData.id}/export`, {
        format: exportData.format,
        includeData: exportData.includeData,
        filters: exportData.filters,
        limit: exportData.limit,
      });

      return {
        success: true,
        message: 'Panel export initiated successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to export panel', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to export panel',
        'EXPORT_PANEL_FAILED'
      );
    }
  }

  async handleGetPanelData(args: unknown): Promise<unknown> {
    try {
      const dataOptions = GetPanelDataSchema.parse(args);
      logger.info('Getting panel data', { id: dataOptions.id });

      const queryParams = new URLSearchParams();
      if (dataOptions.page) queryParams.append('page', dataOptions.page.toString());
      if (dataOptions.pageSize) queryParams.append('pageSize', dataOptions.pageSize.toString());

      const requestBody: Record<string, unknown> = {};
      if (dataOptions.filters) requestBody.filters = dataOptions.filters;
      if (dataOptions.sorting) requestBody.sorting = dataOptions.sorting;

      const url = `/panels/${dataOptions.id}/data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.post<PaginatedResponse<Record<string, unknown>>>(url, requestBody);

      return {
        success: true,
        message: 'Panel data retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get panel data', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get panel data',
        'GET_PANEL_DATA_FAILED'
      );
    }
  }
}