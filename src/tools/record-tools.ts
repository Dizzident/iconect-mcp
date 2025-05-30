import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Record, RecordSchema, BulkOperationResult, RecordRelationship, RecordRelationshipSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const SearchRecordsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  query: z.string().optional(),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.unknown()).optional(),
  dateRange: z.object({
    field: z.string(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  status: z.array(z.enum(['active', 'deleted', 'archived', 'processing'])).optional(),
  assignedTo: z.array(z.string()).optional(),
  folderId: z.string().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(1000).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetRecordSchema = z.object({
  id: z.string().min(1, 'Record ID is required'),
  includeFiles: z.boolean().default(false),
  includeRelationships: z.boolean().default(false),
});

export const CreateRecordSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  folderId: z.string().optional(),
  fields: z.record(z.unknown()),
  fileIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  assignedTo: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateRecordSchema = z.object({
  id: z.string().min(1, 'Record ID is required'),
  fields: z.record(z.unknown()).optional(),
  fileIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  folderId: z.string().optional(),
  reviewStatus: z.enum(['pending', 'in_review', 'approved', 'rejected']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const DeleteRecordSchema = z.object({
  id: z.string().min(1, 'Record ID is required'),
  permanent: z.boolean().default(false),
});

export const BulkUpdateRecordsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  action: z.enum(['update', 'delete', 'move', 'tag', 'assign']),
  recordIds: z.array(z.string()).min(1, 'At least one record ID is required'),
  parameters: z.record(z.unknown()).optional(),
});

export const CreateRecordRelationshipSchema = z.object({
  sourceRecordId: z.string().min(1, 'Source record ID is required'),
  targetRecordId: z.string().min(1, 'Target record ID is required'),
  relationshipType: z.enum(['parent', 'child', 'related', 'duplicate', 'reference']),
  description: z.string().optional(),
});

export const GetRecordRelationshipsSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  relationshipType: z.enum(['parent', 'child', 'related', 'duplicate', 'reference']).optional(),
});

export const DeleteRecordRelationshipSchema = z.object({
  id: z.string().min(1, 'Relationship ID is required'),
});

export const GetBulkOperationStatusSchema = z.object({
  operationId: z.string().min(1, 'Operation ID is required'),
});

export class RecordTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_search_records',
        description: 'Search and filter records with advanced criteria',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID to search within',
            },
            query: {
              type: 'string',
              description: 'Full-text search query',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific fields to search in',
            },
            filters: {
              type: 'object',
              description: 'Field-specific filters as key-value pairs',
            },
            dateRange: {
              type: 'object',
              properties: {
                field: { type: 'string', description: 'Date field name' },
                from: { type: 'string', description: 'Start date (ISO format)' },
                to: { type: 'string', description: 'End date (ISO format)' },
              },
              description: 'Date range filter',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
            status: {
              type: 'array',
              items: { type: 'string', enum: ['active', 'deleted', 'archived', 'processing'] },
              description: 'Filter by record status',
            },
            assignedTo: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by assigned users',
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
              description: 'Number of items per page (default: 50, max: 1000)',
              minimum: 1,
              maximum: 1000,
            },
            sortBy: {
              type: 'string',
              description: 'Field to sort by',
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
        name: 'iconect_get_record',
        description: 'Get a specific record with optional related data',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Record ID',
            },
            includeFiles: {
              type: 'boolean',
              description: 'Include associated file information (default: false)',
            },
            includeRelationships: {
              type: 'boolean',
              description: 'Include record relationships (default: false)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_record',
        description: 'Create a new record',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Document identifier',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID (optional)',
            },
            fields: {
              type: 'object',
              description: 'Record field values as key-value pairs',
            },
            fileIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Associated file IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Record tags',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Record priority (default: normal)',
            },
            assignedTo: {
              type: 'string',
              description: 'User ID to assign record to',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
          },
          required: ['documentId', 'projectId', 'fields'],
        },
      },
      {
        name: 'iconect_update_record',
        description: 'Update an existing record',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Record ID',
            },
            fields: {
              type: 'object',
              description: 'Updated field values as key-value pairs',
            },
            fileIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Updated associated file IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Updated tags',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Updated priority',
            },
            assignedTo: {
              type: 'string',
              description: 'Updated assigned user ID',
            },
            folderId: {
              type: 'string',
              description: 'Updated folder ID',
            },
            reviewStatus: {
              type: 'string',
              enum: ['pending', 'in_review', 'approved', 'rejected'],
              description: 'Review status',
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
        name: 'iconect_delete_record',
        description: 'Delete a record (soft delete by default)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Record ID',
            },
            permanent: {
              type: 'boolean',
              description: 'Permanently delete record (default: false for soft delete)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_bulk_update_records',
        description: 'Perform bulk operations on multiple records',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            action: {
              type: 'string',
              enum: ['update', 'delete', 'move', 'tag', 'assign'],
              description: 'Bulk operation to perform',
            },
            recordIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of record IDs to update',
              minItems: 1,
            },
            parameters: {
              type: 'object',
              description: 'Operation-specific parameters',
            },
          },
          required: ['projectId', 'action', 'recordIds'],
        },
      },
      {
        name: 'iconect_create_record_relationship',
        description: 'Create a relationship between two records',
        inputSchema: {
          type: 'object',
          properties: {
            sourceRecordId: {
              type: 'string',
              description: 'Source record ID',
            },
            targetRecordId: {
              type: 'string',
              description: 'Target record ID',
            },
            relationshipType: {
              type: 'string',
              enum: ['parent', 'child', 'related', 'duplicate', 'reference'],
              description: 'Type of relationship',
            },
            description: {
              type: 'string',
              description: 'Optional description of the relationship',
            },
          },
          required: ['sourceRecordId', 'targetRecordId', 'relationshipType'],
        },
      },
      {
        name: 'iconect_get_record_relationships',
        description: 'Get relationships for a specific record',
        inputSchema: {
          type: 'object',
          properties: {
            recordId: {
              type: 'string',
              description: 'Record ID',
            },
            relationshipType: {
              type: 'string',
              enum: ['parent', 'child', 'related', 'duplicate', 'reference'],
              description: 'Filter by relationship type (optional)',
            },
          },
          required: ['recordId'],
        },
      },
      {
        name: 'iconect_delete_record_relationship',
        description: 'Delete a record relationship',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Relationship ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_get_bulk_operation_status',
        description: 'Get the status of a bulk operation',
        inputSchema: {
          type: 'object',
          properties: {
            operationId: {
              type: 'string',
              description: 'Bulk operation ID',
            },
          },
          required: ['operationId'],
        },
      },
    ];
  }

  async handleSearchRecords(args: unknown): Promise<unknown> {
    try {
      const criteria = SearchRecordsSchema.parse(args);
      logger.info('Searching records', { projectId: criteria.projectId, query: criteria.query });

      const queryParams = new URLSearchParams();
      queryParams.append('projectId', criteria.projectId);
      
      if (criteria.query) queryParams.append('query', criteria.query);
      if (criteria.fields) queryParams.append('fields', criteria.fields.join(','));
      if (criteria.folderId) queryParams.append('folderId', criteria.folderId);
      if (criteria.page) queryParams.append('page', criteria.page.toString());
      if (criteria.pageSize) queryParams.append('pageSize', criteria.pageSize.toString());
      if (criteria.sortBy) queryParams.append('sortBy', criteria.sortBy);
      if (criteria.sortOrder) queryParams.append('sortOrder', criteria.sortOrder);

      if (criteria.filters) {
        Object.entries(criteria.filters).forEach(([key, value]) => {
          queryParams.append(`filter.${key}`, String(value));
        });
      }

      if (criteria.tags) {
        criteria.tags.forEach(tag => queryParams.append('tags', tag));
      }

      if (criteria.status) {
        criteria.status.forEach(status => queryParams.append('status', status));
      }

      if (criteria.assignedTo) {
        criteria.assignedTo.forEach(user => queryParams.append('assignedTo', user));
      }

      if (criteria.dateRange) {
        queryParams.append('dateRange.field', criteria.dateRange.field);
        if (criteria.dateRange.from) queryParams.append('dateRange.from', criteria.dateRange.from);
        if (criteria.dateRange.to) queryParams.append('dateRange.to', criteria.dateRange.to);
      }

      const url = `/records/search?${queryParams.toString()}`;
      const response = await this.httpClient.get<PaginatedResponse<Record>>(url);

      return {
        success: true,
        message: 'Records search completed successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to search records', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to search records',
        'SEARCH_RECORDS_FAILED'
      );
    }
  }

  async handleGetRecord(args: unknown): Promise<unknown> {
    try {
      const { id, includeFiles, includeRelationships } = GetRecordSchema.parse(args);
      logger.info('Getting record', { id, includeFiles, includeRelationships });

      const queryParams = new URLSearchParams();
      if (includeFiles) queryParams.append('includeFiles', 'true');
      if (includeRelationships) queryParams.append('includeRelationships', 'true');

      const url = `/records/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<Record>(url);
      const record = RecordSchema.parse(response);

      return {
        success: true,
        message: 'Record retrieved successfully',
        data: record,
      };
    } catch (error) {
      logger.error('Failed to get record', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get record',
        'GET_RECORD_FAILED'
      );
    }
  }

  async handleCreateRecord(args: unknown): Promise<unknown> {
    try {
      const recordData = CreateRecordSchema.parse(args);
      logger.info('Creating record', { documentId: recordData.documentId, projectId: recordData.projectId });

      const response = await this.httpClient.post<Record>('/records', recordData);
      const record = RecordSchema.parse(response);

      return {
        success: true,
        message: 'Record created successfully',
        data: record,
      };
    } catch (error) {
      logger.error('Failed to create record', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create record',
        'CREATE_RECORD_FAILED'
      );
    }
  }

  async handleUpdateRecord(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateRecordSchema.parse(args);
      logger.info('Updating record', { id });

      const response = await this.httpClient.put<Record>(`/records/${id}`, updateData);
      const record = RecordSchema.parse(response);

      return {
        success: true,
        message: 'Record updated successfully',
        data: record,
      };
    } catch (error) {
      logger.error('Failed to update record', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update record',
        'UPDATE_RECORD_FAILED'
      );
    }
  }

  async handleDeleteRecord(args: unknown): Promise<unknown> {
    try {
      const { id, permanent } = DeleteRecordSchema.parse(args);
      logger.info('Deleting record', { id, permanent });

      const queryParams = new URLSearchParams();
      if (permanent) queryParams.append('permanent', 'true');

      const url = `/records/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      await this.httpClient.delete(url);

      return {
        success: true,
        message: permanent ? 'Record permanently deleted' : 'Record deleted (soft delete)',
        data: { id, permanent },
      };
    } catch (error) {
      logger.error('Failed to delete record', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete record',
        'DELETE_RECORD_FAILED'
      );
    }
  }

  async handleBulkUpdateRecords(args: unknown): Promise<unknown> {
    try {
      const bulkData = BulkUpdateRecordsSchema.parse(args);
      logger.info('Starting bulk operation', { 
        action: bulkData.action, 
        recordCount: bulkData.recordIds.length,
        projectId: bulkData.projectId 
      });

      const response = await this.httpClient.post<BulkOperationResult>('/records/bulk', bulkData);

      return {
        success: true,
        message: 'Bulk operation initiated successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to perform bulk operation', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to perform bulk operation',
        'BULK_UPDATE_RECORDS_FAILED'
      );
    }
  }

  async handleCreateRecordRelationship(args: unknown): Promise<unknown> {
    try {
      const relationshipData = CreateRecordRelationshipSchema.parse(args);
      logger.info('Creating record relationship', { 
        sourceRecordId: relationshipData.sourceRecordId,
        targetRecordId: relationshipData.targetRecordId,
        relationshipType: relationshipData.relationshipType 
      });

      const response = await this.httpClient.post<RecordRelationship>('/records/relationships', relationshipData);
      const relationship = RecordRelationshipSchema.parse(response);

      return {
        success: true,
        message: 'Record relationship created successfully',
        data: relationship,
      };
    } catch (error) {
      logger.error('Failed to create record relationship', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create record relationship',
        'CREATE_RECORD_RELATIONSHIP_FAILED'
      );
    }
  }

  async handleGetRecordRelationships(args: unknown): Promise<unknown> {
    try {
      const { recordId, relationshipType } = GetRecordRelationshipsSchema.parse(args);
      logger.info('Getting record relationships', { recordId, relationshipType });

      const queryParams = new URLSearchParams();
      if (relationshipType) queryParams.append('type', relationshipType);

      const url = `/records/${recordId}/relationships${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<RecordRelationship[]>(url);

      return {
        success: true,
        message: 'Record relationships retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get record relationships', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get record relationships',
        'GET_RECORD_RELATIONSHIPS_FAILED'
      );
    }
  }

  async handleDeleteRecordRelationship(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteRecordRelationshipSchema.parse(args);
      logger.info('Deleting record relationship', { id });

      await this.httpClient.delete(`/records/relationships/${id}`);

      return {
        success: true,
        message: 'Record relationship deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete record relationship', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete record relationship',
        'DELETE_RECORD_RELATIONSHIP_FAILED'
      );
    }
  }

  async handleGetBulkOperationStatus(args: unknown): Promise<unknown> {
    try {
      const { operationId } = GetBulkOperationStatusSchema.parse(args);
      logger.info('Getting bulk operation status', { operationId });

      const response = await this.httpClient.get<BulkOperationResult>(`/records/bulk/${operationId}`);

      return {
        success: true,
        message: 'Bulk operation status retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get bulk operation status', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get bulk operation status',
        'GET_BULK_OPERATION_STATUS_FAILED'
      );
    }
  }
}