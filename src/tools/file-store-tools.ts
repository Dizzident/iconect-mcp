import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { FileStore, FileStoreSchema, ListOptions, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListFileStoresSchema = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filter: z.record(z.unknown()).optional(),
});

export const GetFileStoreSchema = z.object({
  id: z.string().min(1, 'File store ID is required'),
});

export const CreateFileStoreSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  path: z.string().min(1, 'Path is required'),
  type: z.enum(['local', 's3', 'azure', 'gcp']),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  capacity: z.number().positive().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateFileStoreSchema = z.object({
  id: z.string().min(1, 'File store ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  path: z.string().optional(),
  type: z.enum(['local', 's3', 'azure', 'gcp']).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  capacity: z.number().positive().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const DeleteFileStoreSchema = z.object({
  id: z.string().min(1, 'File store ID is required'),
});

export const GetFileStoreStatsSchema = z.object({
  id: z.string().min(1, 'File store ID is required'),
});

export class FileStoreTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_file_stores',
        description: 'List all file stores with optional filtering and pagination',
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
        name: 'iconect_get_file_store',
        description: 'Get a specific file store by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File store ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_file_store',
        description: 'Create a new file store',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'File store name',
            },
            description: {
              type: 'string',
              description: 'File store description',
            },
            path: {
              type: 'string',
              description: 'File store path or connection string',
            },
            type: {
              type: 'string',
              enum: ['local', 's3', 'azure', 'gcp'],
              description: 'File store type',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              description: 'File store status (default: active)',
            },
            capacity: {
              type: 'number',
              description: 'Storage capacity in bytes',
              minimum: 1,
            },
            settings: {
              type: 'object',
              description: 'File store specific settings',
            },
          },
          required: ['name', 'path', 'type'],
        },
      },
      {
        name: 'iconect_update_file_store',
        description: 'Update an existing file store',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File store ID',
            },
            name: {
              type: 'string',
              description: 'File store name',
            },
            description: {
              type: 'string',
              description: 'File store description',
            },
            path: {
              type: 'string',
              description: 'File store path or connection string',
            },
            type: {
              type: 'string',
              enum: ['local', 's3', 'azure', 'gcp'],
              description: 'File store type',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              description: 'File store status',
            },
            capacity: {
              type: 'number',
              description: 'Storage capacity in bytes',
              minimum: 1,
            },
            settings: {
              type: 'object',
              description: 'File store specific settings',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_file_store',
        description: 'Delete a file store',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File store ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_get_file_store_stats',
        description: 'Get usage statistics for a file store',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File store ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListFileStores(args: unknown): Promise<unknown> {
    try {
      const options = ListFileStoresSchema.parse(args);
      logger.info('Listing file stores', { options });

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

      const url = `/filestores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<FileStore>>(url);

      return {
        success: true,
        message: 'File stores retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list file stores', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list file stores',
        'LIST_FILE_STORES_FAILED'
      );
    }
  }

  async handleGetFileStore(args: unknown): Promise<unknown> {
    try {
      const { id } = GetFileStoreSchema.parse(args);
      logger.info('Getting file store', { id });

      const response = await this.httpClient.get<FileStore>(`/filestores/${id}`);
      const fileStore = FileStoreSchema.parse(response);

      return {
        success: true,
        message: 'File store retrieved successfully',
        data: fileStore,
      };
    } catch (error) {
      logger.error('Failed to get file store', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get file store',
        'GET_FILE_STORE_FAILED'
      );
    }
  }

  async handleCreateFileStore(args: unknown): Promise<unknown> {
    try {
      const fileStoreData = CreateFileStoreSchema.parse(args);
      logger.info('Creating file store', { name: fileStoreData.name, type: fileStoreData.type });

      const response = await this.httpClient.post<FileStore>('/filestores', fileStoreData);
      const fileStore = FileStoreSchema.parse(response);

      return {
        success: true,
        message: 'File store created successfully',
        data: fileStore,
      };
    } catch (error) {
      logger.error('Failed to create file store', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create file store',
        'CREATE_FILE_STORE_FAILED'
      );
    }
  }

  async handleUpdateFileStore(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateFileStoreSchema.parse(args);
      logger.info('Updating file store', { id });

      const response = await this.httpClient.put<FileStore>(`/filestores/${id}`, updateData);
      const fileStore = FileStoreSchema.parse(response);

      return {
        success: true,
        message: 'File store updated successfully',
        data: fileStore,
      };
    } catch (error) {
      logger.error('Failed to update file store', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update file store',
        'UPDATE_FILE_STORE_FAILED'
      );
    }
  }

  async handleDeleteFileStore(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteFileStoreSchema.parse(args);
      logger.info('Deleting file store', { id });

      await this.httpClient.delete(`/filestores/${id}`);

      return {
        success: true,
        message: 'File store deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete file store', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete file store',
        'DELETE_FILE_STORE_FAILED'
      );
    }
  }

  async handleGetFileStoreStats(args: unknown): Promise<unknown> {
    try {
      const { id } = GetFileStoreStatsSchema.parse(args);
      logger.info('Getting file store statistics', { id });

      const response = await this.httpClient.get<{
        fileCount: number;
        totalSize: number;
        usedSpace: number;
        availableSpace: number;
        utilizationPercentage: number;
      }>(`/filestores/${id}/stats`);

      return {
        success: true,
        message: 'File store statistics retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get file store statistics', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get file store statistics',
        'GET_FILE_STORE_STATS_FAILED'
      );
    }
  }
}