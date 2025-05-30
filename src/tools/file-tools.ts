import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { File, FileSchema, UploadSession, UploadSessionSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListFilesSchema = z.object({
  projectId: z.string().optional(),
  folderId: z.string().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filter: z.record(z.unknown()).optional(),
});

export const GetFileSchema = z.object({
  id: z.string().min(1, 'File ID is required'),
});

export const UploadFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileContent: z.string().min(1, 'File content is required (base64 encoded)'),
  projectId: z.string().min(1, 'Project ID is required'),
  fileStoreId: z.string().min(1, 'File store ID is required'),
  folderId: z.string().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const InitiateChunkedUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  projectId: z.string().min(1, 'Project ID is required'),
  fileStoreId: z.string().min(1, 'File store ID is required'),
  folderId: z.string().optional(),
  mimeType: z.string().optional(),
  chunkSize: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UploadChunkSchema = z.object({
  uploadSessionId: z.string().min(1, 'Upload session ID is required'),
  chunkNumber: z.number().min(0, 'Chunk number must be non-negative'),
  chunkData: z.string().min(1, 'Chunk data is required (base64 encoded)'),
});

export const CompleteChunkedUploadSchema = z.object({
  uploadSessionId: z.string().min(1, 'Upload session ID is required'),
});

export const DownloadFileSchema = z.object({
  id: z.string().min(1, 'File ID is required'),
  responseType: z.enum(['stream', 'buffer', 'base64']).default('base64'),
  range: z.object({
    start: z.number().min(0),
    end: z.number().min(0),
  }).optional(),
});

export const DeleteFileSchema = z.object({
  id: z.string().min(1, 'File ID is required'),
});

export const GetUploadSessionSchema = z.object({
  id: z.string().min(1, 'Upload session ID is required'),
});

export class FileTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_files',
        description: 'List files with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            folderId: {
              type: 'string',
              description: 'Filter by folder ID',
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
              description: 'Field to sort by (e.g., "name", "size", "createdDate")',
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
        name: 'iconect_get_file',
        description: 'Get file metadata by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_upload_file',
        description: 'Upload a single file (for small files)',
        inputSchema: {
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              description: 'Name of the file',
            },
            fileContent: {
              type: 'string',
              description: 'File content encoded in base64',
            },
            projectId: {
              type: 'string',
              description: 'Project ID where file will be stored',
            },
            fileStoreId: {
              type: 'string',
              description: 'File store ID for storage',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID (optional)',
            },
            mimeType: {
              type: 'string',
              description: 'MIME type of the file',
            },
            metadata: {
              type: 'object',
              description: 'Additional file metadata',
            },
          },
          required: ['fileName', 'fileContent', 'projectId', 'fileStoreId'],
        },
      },
      {
        name: 'iconect_initiate_chunked_upload',
        description: 'Initiate a chunked upload session for large files',
        inputSchema: {
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              description: 'Name of the file',
            },
            fileSize: {
              type: 'number',
              description: 'Total size of the file in bytes',
              minimum: 1,
            },
            projectId: {
              type: 'string',
              description: 'Project ID where file will be stored',
            },
            fileStoreId: {
              type: 'string',
              description: 'File store ID for storage',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID (optional)',
            },
            mimeType: {
              type: 'string',
              description: 'MIME type of the file',
            },
            chunkSize: {
              type: 'number',
              description: 'Size of each chunk in bytes (default: 1MB)',
              minimum: 1,
            },
            metadata: {
              type: 'object',
              description: 'Additional file metadata',
            },
          },
          required: ['fileName', 'fileSize', 'projectId', 'fileStoreId'],
        },
      },
      {
        name: 'iconect_upload_chunk',
        description: 'Upload a chunk as part of a chunked upload session',
        inputSchema: {
          type: 'object',
          properties: {
            uploadSessionId: {
              type: 'string',
              description: 'Upload session ID',
            },
            chunkNumber: {
              type: 'number',
              description: 'Chunk number (0-based)',
              minimum: 0,
            },
            chunkData: {
              type: 'string',
              description: 'Chunk data encoded in base64',
            },
          },
          required: ['uploadSessionId', 'chunkNumber', 'chunkData'],
        },
      },
      {
        name: 'iconect_complete_chunked_upload',
        description: 'Complete a chunked upload session',
        inputSchema: {
          type: 'object',
          properties: {
            uploadSessionId: {
              type: 'string',
              description: 'Upload session ID',
            },
          },
          required: ['uploadSessionId'],
        },
      },
      {
        name: 'iconect_get_upload_session',
        description: 'Get upload session status and progress',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Upload session ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_download_file',
        description: 'Download file content',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File ID',
            },
            responseType: {
              type: 'string',
              enum: ['stream', 'buffer', 'base64'],
              description: 'Response format (default: base64)',
            },
            range: {
              type: 'object',
              properties: {
                start: {
                  type: 'number',
                  description: 'Start byte position',
                  minimum: 0,
                },
                end: {
                  type: 'number',
                  description: 'End byte position',
                  minimum: 0,
                },
              },
              description: 'Byte range for partial download',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_file',
        description: 'Delete a file',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'File ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListFiles(args: unknown): Promise<unknown> {
    try {
      const options = ListFilesSchema.parse(args);
      logger.info('Listing files', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.folderId) queryParams.append('folderId', options.folderId);
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          queryParams.append(`filter.${key}`, String(value));
        });
      }

      const url = `/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<File>>(url);

      return {
        success: true,
        message: 'Files retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list files', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list files',
        'LIST_FILES_FAILED'
      );
    }
  }

  async handleGetFile(args: unknown): Promise<unknown> {
    try {
      const { id } = GetFileSchema.parse(args);
      logger.info('Getting file metadata', { id });

      const response = await this.httpClient.get<File>(`/files/${id}`);
      const file = FileSchema.parse(response);

      return {
        success: true,
        message: 'File metadata retrieved successfully',
        data: file,
      };
    } catch (error) {
      logger.error('Failed to get file metadata', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get file metadata',
        'GET_FILE_FAILED'
      );
    }
  }

  async handleUploadFile(args: unknown): Promise<unknown> {
    try {
      const uploadData = UploadFileSchema.parse(args);
      logger.info('Uploading file', { fileName: uploadData.fileName, projectId: uploadData.projectId });

      const formData = {
        fileName: uploadData.fileName,
        projectId: uploadData.projectId,
        fileStoreId: uploadData.fileStoreId,
        folderId: uploadData.folderId,
        mimeType: uploadData.mimeType,
        metadata: uploadData.metadata,
        fileContent: uploadData.fileContent,
      };

      const response = await this.httpClient.post<File>('/files/upload', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const file = FileSchema.parse(response);

      return {
        success: true,
        message: 'File uploaded successfully',
        data: file,
      };
    } catch (error) {
      logger.error('Failed to upload file', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to upload file',
        'UPLOAD_FILE_FAILED'
      );
    }
  }

  async handleInitiateChunkedUpload(args: unknown): Promise<unknown> {
    try {
      const uploadData = InitiateChunkedUploadSchema.parse(args);
      logger.info('Initiating chunked upload', { 
        fileName: uploadData.fileName, 
        fileSize: uploadData.fileSize,
        projectId: uploadData.projectId 
      });

      const response = await this.httpClient.post<UploadSession>('/files/upload/chunked/initiate', uploadData);
      const session = UploadSessionSchema.parse(response);

      return {
        success: true,
        message: 'Chunked upload session initiated',
        data: session,
      };
    } catch (error) {
      logger.error('Failed to initiate chunked upload', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to initiate chunked upload',
        'INITIATE_CHUNKED_UPLOAD_FAILED'
      );
    }
  }

  async handleUploadChunk(args: unknown): Promise<unknown> {
    try {
      const chunkData = UploadChunkSchema.parse(args);
      logger.info('Uploading chunk', { 
        uploadSessionId: chunkData.uploadSessionId, 
        chunkNumber: chunkData.chunkNumber 
      });

      const response = await this.httpClient.post<{
        chunkNumber: number;
        uploaded: boolean;
        totalUploaded: number;
        totalChunks: number;
      }>(`/files/upload/chunked/${chunkData.uploadSessionId}/chunks/${chunkData.chunkNumber}`, {
        chunkData: chunkData.chunkData,
      });

      return {
        success: true,
        message: 'Chunk uploaded successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to upload chunk', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to upload chunk',
        'UPLOAD_CHUNK_FAILED'
      );
    }
  }

  async handleCompleteChunkedUpload(args: unknown): Promise<unknown> {
    try {
      const { uploadSessionId } = CompleteChunkedUploadSchema.parse(args);
      logger.info('Completing chunked upload', { uploadSessionId });

      const response = await this.httpClient.post<File>(`/files/upload/chunked/${uploadSessionId}/complete`, {});
      const file = FileSchema.parse(response);

      return {
        success: true,
        message: 'Chunked upload completed successfully',
        data: file,
      };
    } catch (error) {
      logger.error('Failed to complete chunked upload', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to complete chunked upload',
        'COMPLETE_CHUNKED_UPLOAD_FAILED'
      );
    }
  }

  async handleGetUploadSession(args: unknown): Promise<unknown> {
    try {
      const { id } = GetUploadSessionSchema.parse(args);
      logger.info('Getting upload session', { id });

      const response = await this.httpClient.get<UploadSession>(`/files/upload/chunked/${id}`);
      const session = UploadSessionSchema.parse(response);

      return {
        success: true,
        message: 'Upload session retrieved successfully',
        data: session,
      };
    } catch (error) {
      logger.error('Failed to get upload session', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get upload session',
        'GET_UPLOAD_SESSION_FAILED'
      );
    }
  }

  async handleDownloadFile(args: unknown): Promise<unknown> {
    try {
      const { id, responseType, range } = DownloadFileSchema.parse(args);
      logger.info('Downloading file', { id, responseType });

      const headers: Record<string, string> = {};
      if (range) {
        headers.Range = `bytes=${range.start}-${range.end}`;
      }

      const response = await this.httpClient.get<string | Buffer>(`/files/${id}/download`, {
        headers,
        responseType: responseType === 'buffer' ? 'arraybuffer' : 'text',
      });

      let content: string;
      if (responseType === 'base64' || responseType === 'stream') {
        content = typeof response === 'string' ? response : Buffer.from(response).toString('base64');
      } else {
        content = Buffer.from(response).toString('base64');
      }

      return {
        success: true,
        message: 'File downloaded successfully',
        data: {
          content,
          responseType,
          contentLength: typeof response === 'string' ? response.length : response.byteLength,
        },
      };
    } catch (error) {
      logger.error('Failed to download file', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to download file',
        'DOWNLOAD_FILE_FAILED'
      );
    }
  }

  async handleDeleteFile(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteFileSchema.parse(args);
      logger.info('Deleting file', { id });

      await this.httpClient.delete(`/files/${id}`);

      return {
        success: true,
        message: 'File deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete file', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete file',
        'DELETE_FILE_FAILED'
      );
    }
  }
}