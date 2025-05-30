import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Folder, FolderSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListFoldersSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  parentId: z.string().optional(),
  includeSubfolders: z.boolean().default(false),
  depth: z.number().min(1).max(10).optional(),
  isSystem: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetFolderSchema = z.object({
  id: z.string().min(1, 'Folder ID is required'),
  includeAncestors: z.boolean().default(false),
  includeChildren: z.boolean().default(false),
  includeStats: z.boolean().default(false),
});

export const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  permissions: z.object({
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canCreateSubfolders: z.boolean().default(false),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateFolderSchema = z.object({
  id: z.string().min(1, 'Folder ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  permissions: z.object({
    canRead: z.boolean(),
    canWrite: z.boolean(),
    canDelete: z.boolean(),
    canCreateSubfolders: z.boolean(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const DeleteFolderSchema = z.object({
  id: z.string().min(1, 'Folder ID is required'),
  recursive: z.boolean().default(false),
  moveContentsTo: z.string().optional(),
});

export const MoveFolderSchema = z.object({
  id: z.string().min(1, 'Folder ID is required'),
  newParentId: z.string().optional(),
});

export const CopyFolderSchema = z.object({
  id: z.string().min(1, 'Source folder ID is required'),
  targetParentId: z.string().optional(),
  newName: z.string().optional(),
  includeContents: z.boolean().default(true),
  targetProjectId: z.string().optional(),
});

export const GetFolderTreeSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  rootFolderId: z.string().optional(),
  maxDepth: z.number().min(1).max(20).default(5),
  includeStats: z.boolean().default(false),
});

export const GetFolderPathSchema = z.object({
  id: z.string().min(1, 'Folder ID is required'),
});

export class FolderTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_folders',
        description: 'List folders with optional filtering and hierarchy options',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            parentId: {
              type: 'string',
              description: 'Parent folder ID (omit for root folders)',
            },
            includeSubfolders: {
              type: 'boolean',
              description: 'Include subfolders in results (default: false)',
            },
            depth: {
              type: 'number',
              description: 'Maximum depth for subfolder inclusion (1-10)',
              minimum: 1,
              maximum: 10,
            },
            isSystem: {
              type: 'boolean',
              description: 'Filter by system folder status',
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
            sortBy: {
              type: 'string',
              description: 'Field to sort by (e.g., "name", "createdDate", "level")',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order (default: asc)',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'iconect_get_folder',
        description: 'Get a specific folder with optional related data',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Folder ID',
            },
            includeAncestors: {
              type: 'boolean',
              description: 'Include parent folder hierarchy (default: false)',
            },
            includeChildren: {
              type: 'boolean',
              description: 'Include immediate child folders (default: false)',
            },
            includeStats: {
              type: 'boolean',
              description: 'Include folder statistics (record count, etc.) (default: false)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_folder',
        description: 'Create a new folder',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Folder name',
            },
            description: {
              type: 'string',
              description: 'Folder description',
            },
            parentId: {
              type: 'string',
              description: 'Parent folder ID (omit for root folder)',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            permissions: {
              type: 'object',
              properties: {
                canRead: { type: 'boolean', description: 'Read permission (default: true)' },
                canWrite: { type: 'boolean', description: 'Write permission (default: false)' },
                canDelete: { type: 'boolean', description: 'Delete permission (default: false)' },
                canCreateSubfolders: { type: 'boolean', description: 'Create subfolders permission (default: false)' },
              },
              description: 'Folder permissions',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
          },
          required: ['name', 'projectId'],
        },
      },
      {
        name: 'iconect_update_folder',
        description: 'Update an existing folder',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Folder ID',
            },
            name: {
              type: 'string',
              description: 'Updated folder name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            parentId: {
              type: 'string',
              description: 'Updated parent folder ID',
            },
            permissions: {
              type: 'object',
              properties: {
                canRead: { type: 'boolean' },
                canWrite: { type: 'boolean' },
                canDelete: { type: 'boolean' },
                canCreateSubfolders: { type: 'boolean' },
              },
              description: 'Updated permissions',
            },
            metadata: {
              type: 'object',
              description: 'Updated metadata',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_folder',
        description: 'Delete a folder with options for handling contents',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Folder ID',
            },
            recursive: {
              type: 'boolean',
              description: 'Delete subfolders recursively (default: false)',
            },
            moveContentsTo: {
              type: 'string',
              description: 'Folder ID to move contents to (if not deleting recursively)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_move_folder',
        description: 'Move a folder to a new parent location',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Folder ID to move',
            },
            newParentId: {
              type: 'string',
              description: 'New parent folder ID (omit to move to root)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_copy_folder',
        description: 'Copy a folder to a new location',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Source folder ID',
            },
            targetParentId: {
              type: 'string',
              description: 'Target parent folder ID (omit for root)',
            },
            newName: {
              type: 'string',
              description: 'New name for copied folder (optional)',
            },
            includeContents: {
              type: 'boolean',
              description: 'Include folder contents in copy (default: true)',
            },
            targetProjectId: {
              type: 'string',
              description: 'Target project ID (for cross-project copy)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_get_folder_tree',
        description: 'Get folder tree structure for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            rootFolderId: {
              type: 'string',
              description: 'Root folder ID (omit for project root)',
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum tree depth (1-20, default: 5)',
              minimum: 1,
              maximum: 20,
            },
            includeStats: {
              type: 'boolean',
              description: 'Include statistics for each folder (default: false)',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'iconect_get_folder_path',
        description: 'Get the full path from root to a specific folder',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Folder ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListFolders(args: unknown): Promise<unknown> {
    try {
      const options = ListFoldersSchema.parse(args);
      logger.info('Listing folders', { projectId: options.projectId, parentId: options.parentId });

      const queryParams = new URLSearchParams();
      queryParams.append('projectId', options.projectId);
      
      if (options.parentId) queryParams.append('parentId', options.parentId);
      if (options.includeSubfolders) queryParams.append('includeSubfolders', 'true');
      if (options.depth) queryParams.append('depth', options.depth.toString());
      if (options.isSystem !== undefined) queryParams.append('isSystem', options.isSystem.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/folders?${queryParams.toString()}`;
      const response = await this.httpClient.get<PaginatedResponse<Folder>>(url);

      return {
        success: true,
        message: 'Folders retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list folders', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list folders',
        'LIST_FOLDERS_FAILED'
      );
    }
  }

  async handleGetFolder(args: unknown): Promise<unknown> {
    try {
      const { id, includeAncestors, includeChildren, includeStats } = GetFolderSchema.parse(args);
      logger.info('Getting folder', { id, includeAncestors, includeChildren, includeStats });

      const queryParams = new URLSearchParams();
      if (includeAncestors) queryParams.append('includeAncestors', 'true');
      if (includeChildren) queryParams.append('includeChildren', 'true');
      if (includeStats) queryParams.append('includeStats', 'true');

      const url = `/folders/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<Folder & {
        ancestors?: Folder[];
        children?: Folder[];
        stats?: {
          recordCount: number;
          subfolderCount: number;
          fileCount: number;
          totalSize: number;
        };
      }>(url);

      return {
        success: true,
        message: 'Folder retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get folder', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get folder',
        'GET_FOLDER_FAILED'
      );
    }
  }

  async handleCreateFolder(args: unknown): Promise<unknown> {
    try {
      const folderData = CreateFolderSchema.parse(args);
      logger.info('Creating folder', { name: folderData.name, projectId: folderData.projectId, parentId: folderData.parentId });

      const response = await this.httpClient.post<Folder>('/folders', folderData);
      const folder = FolderSchema.parse(response);

      return {
        success: true,
        message: 'Folder created successfully',
        data: folder,
      };
    } catch (error) {
      logger.error('Failed to create folder', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create folder',
        'CREATE_FOLDER_FAILED'
      );
    }
  }

  async handleUpdateFolder(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateFolderSchema.parse(args);
      logger.info('Updating folder', { id });

      const response = await this.httpClient.put<Folder>(`/folders/${id}`, updateData);
      const folder = FolderSchema.parse(response);

      return {
        success: true,
        message: 'Folder updated successfully',
        data: folder,
      };
    } catch (error) {
      logger.error('Failed to update folder', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update folder',
        'UPDATE_FOLDER_FAILED'
      );
    }
  }

  async handleDeleteFolder(args: unknown): Promise<unknown> {
    try {
      const { id, recursive, moveContentsTo } = DeleteFolderSchema.parse(args);
      logger.info('Deleting folder', { id, recursive, moveContentsTo });

      const queryParams = new URLSearchParams();
      if (recursive) queryParams.append('recursive', 'true');
      if (moveContentsTo) queryParams.append('moveContentsTo', moveContentsTo);

      const url = `/folders/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      await this.httpClient.delete(url);

      return {
        success: true,
        message: 'Folder deleted successfully',
        data: { id, recursive, moveContentsTo },
      };
    } catch (error) {
      logger.error('Failed to delete folder', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete folder',
        'DELETE_FOLDER_FAILED'
      );
    }
  }

  async handleMoveFolder(args: unknown): Promise<unknown> {
    try {
      const { id, newParentId } = MoveFolderSchema.parse(args);
      logger.info('Moving folder', { id, newParentId });

      const response = await this.httpClient.post<Folder>(`/folders/${id}/move`, { newParentId });
      const folder = FolderSchema.parse(response);

      return {
        success: true,
        message: 'Folder moved successfully',
        data: folder,
      };
    } catch (error) {
      logger.error('Failed to move folder', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to move folder',
        'MOVE_FOLDER_FAILED'
      );
    }
  }

  async handleCopyFolder(args: unknown): Promise<unknown> {
    try {
      const copyData = CopyFolderSchema.parse(args);
      logger.info('Copying folder', { id: copyData.id, targetParentId: copyData.targetParentId });

      const response = await this.httpClient.post<Folder>(`/folders/${copyData.id}/copy`, {
        targetParentId: copyData.targetParentId,
        newName: copyData.newName,
        includeContents: copyData.includeContents,
        targetProjectId: copyData.targetProjectId,
      });
      const folder = FolderSchema.parse(response);

      return {
        success: true,
        message: 'Folder copied successfully',
        data: folder,
      };
    } catch (error) {
      logger.error('Failed to copy folder', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to copy folder',
        'COPY_FOLDER_FAILED'
      );
    }
  }

  async handleGetFolderTree(args: unknown): Promise<unknown> {
    try {
      const { projectId, rootFolderId, maxDepth, includeStats } = GetFolderTreeSchema.parse(args);
      logger.info('Getting folder tree', { projectId, rootFolderId, maxDepth });

      const queryParams = new URLSearchParams();
      queryParams.append('projectId', projectId);
      if (rootFolderId) queryParams.append('rootFolderId', rootFolderId);
      queryParams.append('maxDepth', maxDepth.toString());
      if (includeStats) queryParams.append('includeStats', 'true');

      const url = `/folders/tree?${queryParams.toString()}`;
      const response = await this.httpClient.get<{
        root: Folder & { children?: unknown[] };
        totalFolders: number;
        maxDepthReached: number;
      }>(url);

      return {
        success: true,
        message: 'Folder tree retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get folder tree', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get folder tree',
        'GET_FOLDER_TREE_FAILED'
      );
    }
  }

  async handleGetFolderPath(args: unknown): Promise<unknown> {
    try {
      const { id } = GetFolderPathSchema.parse(args);
      logger.info('Getting folder path', { id });

      const response = await this.httpClient.get<{
        folderId: string;
        path: string;
        pathSegments: Array<{
          id: string;
          name: string;
          level: number;
        }>;
      }>(`/folders/${id}/path`);

      return {
        success: true,
        message: 'Folder path retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get folder path', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get folder path',
        'GET_FOLDER_PATH_FAILED'
      );
    }
  }
}