import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Dashboard, DashboardSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListDashboardsSchema = z.object({
  projectId: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetDashboardSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
  includeWidgetData: z.boolean().default(false),
});

export const CreateDashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  layout: z.object({
    columns: z.number().min(1).max(12).default(12),
    rows: z.number().min(1).optional(),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.enum(['chart', 'metric', 'list', 'map', 'calendar', 'custom']),
      title: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      configuration: z.record(z.unknown()),
      refreshInterval: z.number().min(0).optional(),
    })),
  }),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canShare: z.array(z.string()).optional(),
  }).optional(),
  isDefault: z.boolean().default(false),
});

export const UpdateDashboardSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  layout: z.object({
    columns: z.number().min(1).max(12).optional(),
    rows: z.number().min(1).optional(),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.enum(['chart', 'metric', 'list', 'map', 'calendar', 'custom']),
      title: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      configuration: z.record(z.unknown()),
      refreshInterval: z.number().min(0).optional(),
    })).optional(),
  }).optional(),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canShare: z.array(z.string()).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const DeleteDashboardSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
});

export const DuplicateDashboardSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
  newName: z.string().min(1, 'New dashboard name is required'),
  targetProjectId: z.string().optional(),
});

export const AddWidgetSchema = z.object({
  dashboardId: z.string().min(1, 'Dashboard ID is required'),
  widget: z.object({
    type: z.enum(['chart', 'metric', 'list', 'map', 'calendar', 'custom']),
    title: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    configuration: z.record(z.unknown()),
    refreshInterval: z.number().min(0).optional(),
  }),
});

export const UpdateWidgetSchema = z.object({
  dashboardId: z.string().min(1, 'Dashboard ID is required'),
  widgetId: z.string().min(1, 'Widget ID is required'),
  title: z.string().optional(),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  configuration: z.record(z.unknown()).optional(),
  refreshInterval: z.number().min(0).optional(),
});

export const RemoveWidgetSchema = z.object({
  dashboardId: z.string().min(1, 'Dashboard ID is required'),
  widgetId: z.string().min(1, 'Widget ID is required'),
});

export const GetWidgetDataSchema = z.object({
  dashboardId: z.string().min(1, 'Dashboard ID is required'),
  widgetId: z.string().min(1, 'Widget ID is required'),
  filters: z.record(z.unknown()).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
});

export const RefreshWidgetSchema = z.object({
  dashboardId: z.string().min(1, 'Dashboard ID is required'),
  widgetId: z.string().min(1, 'Widget ID is required'),
});

export const ExportDashboardSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
  format: z.enum(['pdf', 'png', 'json']),
  includeData: z.boolean().default(true),
});

export const ShareDashboardSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
  shareType: z.enum(['public', 'private', 'token']),
  expiresAt: z.string().datetime().optional(),
  permissions: z.array(z.enum(['view', 'interact'])).default(['view']),
});

export class DashboardTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_dashboards',
        description: 'List dashboards with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            isDefault: {
              type: 'boolean',
              description: 'Filter by default dashboard status',
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
              description: 'Field to sort by (e.g., "name", "createdDate", "modifiedDate")',
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
        name: 'iconect_get_dashboard',
        description: 'Get a specific dashboard with optional widget data',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dashboard ID',
            },
            includeWidgetData: {
              type: 'boolean',
              description: 'Include widget data in response (default: false)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_dashboard',
        description: 'Create a new dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Dashboard name',
            },
            description: {
              type: 'string',
              description: 'Dashboard description',
            },
            projectId: {
              type: 'string',
              description: 'Project ID (optional)',
            },
            layout: {
              type: 'object',
              properties: {
                columns: {
                  type: 'number',
                  minimum: 1,
                  maximum: 12,
                  default: 12,
                  description: 'Grid columns (1-12)',
                },
                rows: {
                  type: 'number',
                  minimum: 1,
                  description: 'Grid rows (optional)',
                },
                widgets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string', enum: ['chart', 'metric', 'list', 'map', 'calendar', 'custom'] },
                      title: { type: 'string' },
                      position: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                          width: { type: 'number' },
                          height: { type: 'number' },
                        },
                        required: ['x', 'y', 'width', 'height'],
                      },
                      configuration: { type: 'object' },
                      refreshInterval: { type: 'number', minimum: 0 },
                    },
                    required: ['id', 'type', 'title', 'position', 'configuration'],
                  },
                  description: 'Dashboard widgets',
                },
              },
              required: ['widgets'],
              description: 'Dashboard layout configuration',
            },
            permissions: {
              type: 'object',
              properties: {
                canView: { type: 'array', items: { type: 'string' } },
                canEdit: { type: 'array', items: { type: 'string' } },
                canShare: { type: 'array', items: { type: 'string' } },
              },
              description: 'Dashboard permissions',
            },
            isDefault: {
              type: 'boolean',
              description: 'Set as default dashboard (default: false)',
            },
          },
          required: ['name', 'layout'],
        },
      },
      {
        name: 'iconect_update_dashboard',
        description: 'Update an existing dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dashboard ID',
            },
            name: {
              type: 'string',
              description: 'Updated dashboard name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            layout: {
              type: 'object',
              description: 'Updated layout configuration',
            },
            permissions: {
              type: 'object',
              description: 'Updated permissions',
            },
            isDefault: {
              type: 'boolean',
              description: 'Updated default status',
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
        name: 'iconect_delete_dashboard',
        description: 'Delete a dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dashboard ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_duplicate_dashboard',
        description: 'Duplicate a dashboard with new configuration',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Source dashboard ID',
            },
            newName: {
              type: 'string',
              description: 'New dashboard name',
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
        name: 'iconect_add_widget',
        description: 'Add a widget to a dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            dashboardId: {
              type: 'string',
              description: 'Dashboard ID',
            },
            widget: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['chart', 'metric', 'list', 'map', 'calendar', 'custom'] },
                title: { type: 'string' },
                position: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                  },
                  required: ['x', 'y', 'width', 'height'],
                },
                configuration: { type: 'object' },
                refreshInterval: { type: 'number', minimum: 0 },
              },
              required: ['type', 'title', 'position', 'configuration'],
              description: 'Widget configuration',
            },
          },
          required: ['dashboardId', 'widget'],
        },
      },
      {
        name: 'iconect_update_widget',
        description: 'Update a widget in a dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            dashboardId: {
              type: 'string',
              description: 'Dashboard ID',
            },
            widgetId: {
              type: 'string',
              description: 'Widget ID',
            },
            title: {
              type: 'string',
              description: 'Updated widget title',
            },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
              },
              description: 'Updated widget position',
            },
            configuration: {
              type: 'object',
              description: 'Updated widget configuration',
            },
            refreshInterval: {
              type: 'number',
              minimum: 0,
              description: 'Updated refresh interval in seconds',
            },
          },
          required: ['dashboardId', 'widgetId'],
        },
      },
      {
        name: 'iconect_remove_widget',
        description: 'Remove a widget from a dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            dashboardId: {
              type: 'string',
              description: 'Dashboard ID',
            },
            widgetId: {
              type: 'string',
              description: 'Widget ID',
            },
          },
          required: ['dashboardId', 'widgetId'],
        },
      },
      {
        name: 'iconect_get_widget_data',
        description: 'Get data for a specific widget',
        inputSchema: {
          type: 'object',
          properties: {
            dashboardId: {
              type: 'string',
              description: 'Dashboard ID',
            },
            widgetId: {
              type: 'string',
              description: 'Widget ID',
            },
            filters: {
              type: 'object',
              description: 'Additional filters for widget data',
            },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' },
              },
              required: ['start', 'end'],
              description: 'Date range for widget data',
            },
          },
          required: ['dashboardId', 'widgetId'],
        },
      },
      {
        name: 'iconect_refresh_widget',
        description: 'Force refresh a widget data',
        inputSchema: {
          type: 'object',
          properties: {
            dashboardId: {
              type: 'string',
              description: 'Dashboard ID',
            },
            widgetId: {
              type: 'string',
              description: 'Widget ID',
            },
          },
          required: ['dashboardId', 'widgetId'],
        },
      },
      {
        name: 'iconect_export_dashboard',
        description: 'Export dashboard in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dashboard ID',
            },
            format: {
              type: 'string',
              enum: ['pdf', 'png', 'json'],
              description: 'Export format',
            },
            includeData: {
              type: 'boolean',
              description: 'Include widget data in export (default: true)',
            },
          },
          required: ['id', 'format'],
        },
      },
      {
        name: 'iconect_share_dashboard',
        description: 'Configure dashboard sharing settings',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dashboard ID',
            },
            shareType: {
              type: 'string',
              enum: ['public', 'private', 'token'],
              description: 'Share type',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Share expiration date (optional)',
            },
            permissions: {
              type: 'array',
              items: { type: 'string', enum: ['view', 'interact'] },
              description: 'Share permissions (default: ["view"])',
            },
          },
          required: ['id', 'shareType'],
        },
      },
    ];
  }

  async handleListDashboards(args: unknown): Promise<unknown> {
    try {
      const options = ListDashboardsSchema.parse(args);
      logger.info('Listing dashboards', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.isDefault !== undefined) queryParams.append('isDefault', options.isDefault.toString());
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/dashboards${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<Dashboard>>(url);

      return {
        success: true,
        message: 'Dashboards retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list dashboards', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list dashboards',
        'LIST_DASHBOARDS_FAILED'
      );
    }
  }

  async handleGetDashboard(args: unknown): Promise<unknown> {
    try {
      const { id, includeWidgetData } = GetDashboardSchema.parse(args);
      logger.info('Getting dashboard', { id, includeWidgetData });

      const queryParams = new URLSearchParams();
      if (includeWidgetData) queryParams.append('includeWidgetData', 'true');

      const url = `/dashboards/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<Dashboard>(url);
      const dashboard = DashboardSchema.parse(response);

      return {
        success: true,
        message: 'Dashboard retrieved successfully',
        data: dashboard,
      };
    } catch (error) {
      logger.error('Failed to get dashboard', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get dashboard',
        'GET_DASHBOARD_FAILED'
      );
    }
  }

  async handleCreateDashboard(args: unknown): Promise<unknown> {
    try {
      const dashboardData = CreateDashboardSchema.parse(args);
      logger.info('Creating dashboard', { name: dashboardData.name });

      const response = await this.httpClient.post<Dashboard>('/dashboards', dashboardData);
      const dashboard = DashboardSchema.parse(response);

      return {
        success: true,
        message: 'Dashboard created successfully',
        data: dashboard,
      };
    } catch (error) {
      logger.error('Failed to create dashboard', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create dashboard',
        'CREATE_DASHBOARD_FAILED'
      );
    }
  }

  async handleUpdateDashboard(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateDashboardSchema.parse(args);
      logger.info('Updating dashboard', { id });

      const response = await this.httpClient.put<Dashboard>(`/dashboards/${id}`, updateData);
      const dashboard = DashboardSchema.parse(response);

      return {
        success: true,
        message: 'Dashboard updated successfully',
        data: dashboard,
      };
    } catch (error) {
      logger.error('Failed to update dashboard', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update dashboard',
        'UPDATE_DASHBOARD_FAILED'
      );
    }
  }

  async handleDeleteDashboard(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteDashboardSchema.parse(args);
      logger.info('Deleting dashboard', { id });

      await this.httpClient.delete(`/dashboards/${id}`);

      return {
        success: true,
        message: 'Dashboard deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete dashboard', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete dashboard',
        'DELETE_DASHBOARD_FAILED'
      );
    }
  }

  async handleDuplicateDashboard(args: unknown): Promise<unknown> {
    try {
      const duplicateData = DuplicateDashboardSchema.parse(args);
      logger.info('Duplicating dashboard', { 
        id: duplicateData.id, 
        newName: duplicateData.newName,
        targetProjectId: duplicateData.targetProjectId 
      });

      const response = await this.httpClient.post<Dashboard>(`/dashboards/${duplicateData.id}/duplicate`, {
        newName: duplicateData.newName,
        targetProjectId: duplicateData.targetProjectId,
      });
      const dashboard = DashboardSchema.parse(response);

      return {
        success: true,
        message: 'Dashboard duplicated successfully',
        data: dashboard,
      };
    } catch (error) {
      logger.error('Failed to duplicate dashboard', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to duplicate dashboard',
        'DUPLICATE_DASHBOARD_FAILED'
      );
    }
  }

  async handleAddWidget(args: unknown): Promise<unknown> {
    try {
      const { dashboardId, widget } = AddWidgetSchema.parse(args);
      logger.info('Adding widget to dashboard', { dashboardId, widgetType: widget.type });

      const response = await this.httpClient.post<{
        widgetId: string;
        dashboard: Dashboard;
      }>(`/dashboards/${dashboardId}/widgets`, widget);

      return {
        success: true,
        message: 'Widget added successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to add widget', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to add widget',
        'ADD_WIDGET_FAILED'
      );
    }
  }

  async handleUpdateWidget(args: unknown): Promise<unknown> {
    try {
      const { dashboardId, widgetId, ...updateData } = UpdateWidgetSchema.parse(args);
      logger.info('Updating widget', { dashboardId, widgetId });

      const response = await this.httpClient.put<Dashboard>(`/dashboards/${dashboardId}/widgets/${widgetId}`, updateData);
      const dashboard = DashboardSchema.parse(response);

      return {
        success: true,
        message: 'Widget updated successfully',
        data: dashboard,
      };
    } catch (error) {
      logger.error('Failed to update widget', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update widget',
        'UPDATE_WIDGET_FAILED'
      );
    }
  }

  async handleRemoveWidget(args: unknown): Promise<unknown> {
    try {
      const { dashboardId, widgetId } = RemoveWidgetSchema.parse(args);
      logger.info('Removing widget', { dashboardId, widgetId });

      const response = await this.httpClient.delete<Dashboard>(`/dashboards/${dashboardId}/widgets/${widgetId}`);
      const dashboard = DashboardSchema.parse(response);

      return {
        success: true,
        message: 'Widget removed successfully',
        data: dashboard,
      };
    } catch (error) {
      logger.error('Failed to remove widget', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to remove widget',
        'REMOVE_WIDGET_FAILED'
      );
    }
  }

  async handleGetWidgetData(args: unknown): Promise<unknown> {
    try {
      const dataOptions = GetWidgetDataSchema.parse(args);
      logger.info('Getting widget data', { dashboardId: dataOptions.dashboardId, widgetId: dataOptions.widgetId });

      const requestBody: Record<string, unknown> = {};
      if (dataOptions.filters) requestBody.filters = dataOptions.filters;
      if (dataOptions.dateRange) requestBody.dateRange = dataOptions.dateRange;

      const response = await this.httpClient.post<{
        data: unknown;
        metadata: {
          lastUpdated: string;
          dataSource: string;
          recordCount?: number;
        };
      }>(`/dashboards/${dataOptions.dashboardId}/widgets/${dataOptions.widgetId}/data`, requestBody);

      return {
        success: true,
        message: 'Widget data retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get widget data', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get widget data',
        'GET_WIDGET_DATA_FAILED'
      );
    }
  }

  async handleRefreshWidget(args: unknown): Promise<unknown> {
    try {
      const { dashboardId, widgetId } = RefreshWidgetSchema.parse(args);
      logger.info('Refreshing widget', { dashboardId, widgetId });

      const response = await this.httpClient.post<{
        data: unknown;
        metadata: {
          lastUpdated: string;
          dataSource: string;
          recordCount?: number;
        };
      }>(`/dashboards/${dashboardId}/widgets/${widgetId}/refresh`, {});

      return {
        success: true,
        message: 'Widget refreshed successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to refresh widget', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to refresh widget',
        'REFRESH_WIDGET_FAILED'
      );
    }
  }

  async handleExportDashboard(args: unknown): Promise<unknown> {
    try {
      const exportData = ExportDashboardSchema.parse(args);
      logger.info('Exporting dashboard', { id: exportData.id, format: exportData.format });

      const response = await this.httpClient.post<{
        downloadUrl: string;
        fileName: string;
        fileSize: number;
        expiresAt: string;
      }>(`/dashboards/${exportData.id}/export`, {
        format: exportData.format,
        includeData: exportData.includeData,
      });

      return {
        success: true,
        message: 'Dashboard export initiated successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to export dashboard', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to export dashboard',
        'EXPORT_DASHBOARD_FAILED'
      );
    }
  }

  async handleShareDashboard(args: unknown): Promise<unknown> {
    try {
      const shareData = ShareDashboardSchema.parse(args);
      logger.info('Configuring dashboard sharing', { id: shareData.id, shareType: shareData.shareType });

      const response = await this.httpClient.post<{
        shareToken?: string;
        shareUrl?: string;
        expiresAt?: string;
        shareType: string;
        permissions: string[];
      }>(`/dashboards/${shareData.id}/share`, {
        shareType: shareData.shareType,
        expiresAt: shareData.expiresAt,
        permissions: shareData.permissions,
      });

      return {
        success: true,
        message: 'Dashboard sharing configured successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to configure dashboard sharing', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to configure dashboard sharing',
        'SHARE_DASHBOARD_FAILED'
      );
    }
  }
}