import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { DataServer, DataServerSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListDataServersSchema = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filter: z.record(z.unknown()).optional(),
});

export const GetDataServerSchema = z.object({
  id: z.string().min(1, 'Data server ID is required'),
});

export const CreateDataServerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url('Valid URL is required'),
  version: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

export const UpdateDataServerSchema = z.object({
  id: z.string().min(1, 'Data server ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  version: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

export const DeleteDataServerSchema = z.object({
  id: z.string().min(1, 'Data server ID is required'),
});

export class DataServerTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_data_servers',
        description: 'List all data servers with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
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
              description: 'Field to sort by (e.g., "name", "createdDate")',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order (default: asc)',
            },
            filter: {
              type: 'object',
              description: 'Filter criteria as key-value pairs',
            },
          },
        },
      },
      {
        name: 'iconect_get_data_server',
        description: 'Get a specific data server by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Data server ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_data_server',
        description: 'Create a new data server',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Data server name',
            },
            description: {
              type: 'string',
              description: 'Data server description',
            },
            url: {
              type: 'string',
              description: 'Data server URL',
            },
            version: {
              type: 'string',
              description: 'Data server version',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              description: 'Data server status (default: active)',
            },
          },
          required: ['name', 'url'],
        },
      },
      {
        name: 'iconect_update_data_server',
        description: 'Update an existing data server',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Data server ID',
            },
            name: {
              type: 'string',
              description: 'Data server name',
            },
            description: {
              type: 'string',
              description: 'Data server description',
            },
            url: {
              type: 'string',
              description: 'Data server URL',
            },
            version: {
              type: 'string',
              description: 'Data server version',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              description: 'Data server status',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_data_server',
        description: 'Delete a data server',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Data server ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListDataServers(args: unknown): Promise<unknown> {
    try {
      const options = ListDataServersSchema.parse(args);
      logger.info('Listing data servers', { options });

      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          queryParams.append(`filter.${key}`, String(value));
        });
      }

      const url = `/dataservers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<DataServer>>(url);

      return {
        success: true,
        message: 'Data servers retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list data servers', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list data servers',
        'LIST_DATA_SERVERS_FAILED'
      );
    }
  }

  async handleGetDataServer(args: unknown): Promise<unknown> {
    try {
      const { id } = GetDataServerSchema.parse(args);
      logger.info('Getting data server', { id });

      const response = await this.httpClient.get<DataServer>(`/dataservers/${id}`);
      const dataServer = DataServerSchema.parse(response);

      return {
        success: true,
        message: 'Data server retrieved successfully',
        data: dataServer,
      };
    } catch (error) {
      logger.error('Failed to get data server', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get data server',
        'GET_DATA_SERVER_FAILED'
      );
    }
  }

  async handleCreateDataServer(args: unknown): Promise<unknown> {
    try {
      const serverData = CreateDataServerSchema.parse(args);
      logger.info('Creating data server', { name: serverData.name });

      const response = await this.httpClient.post<DataServer>('/dataservers', serverData);
      const dataServer = DataServerSchema.parse(response);

      return {
        success: true,
        message: 'Data server created successfully',
        data: dataServer,
      };
    } catch (error) {
      logger.error('Failed to create data server', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create data server',
        'CREATE_DATA_SERVER_FAILED'
      );
    }
  }

  async handleUpdateDataServer(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateDataServerSchema.parse(args);
      logger.info('Updating data server', { id });

      const response = await this.httpClient.put<DataServer>(`/dataservers/${id}`, updateData);
      const dataServer = DataServerSchema.parse(response);

      return {
        success: true,
        message: 'Data server updated successfully',
        data: dataServer,
      };
    } catch (error) {
      logger.error('Failed to update data server', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update data server',
        'UPDATE_DATA_SERVER_FAILED'
      );
    }
  }

  async handleDeleteDataServer(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteDataServerSchema.parse(args);
      logger.info('Deleting data server', { id });

      await this.httpClient.delete(`/dataservers/${id}`);

      return {
        success: true,
        message: 'Data server deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete data server', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete data server',
        'DELETE_DATA_SERVER_FAILED'
      );
    }
  }
}