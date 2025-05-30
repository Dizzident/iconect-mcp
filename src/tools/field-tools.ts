import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Field, FieldSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListFieldsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  fieldType: z.enum(['text', 'number', 'date', 'boolean', 'choice', 'multiChoice', 'file', 'user', 'lookup']).optional(),
  isRequired: z.boolean().optional(),
  isSystemField: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
});

export const CreateFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  fieldType: z.enum(['text', 'number', 'date', 'boolean', 'choice', 'multiChoice', 'file', 'user', 'lookup']),
  dataType: z.enum(['string', 'integer', 'decimal', 'datetime', 'boolean']),
  projectId: z.string().min(1, 'Project ID is required'),
  isRequired: z.boolean().default(false),
  isSearchable: z.boolean().default(true),
  maxLength: z.number().positive().optional(),
  defaultValue: z.unknown().optional(),
  choices: z.array(z.object({
    value: z.string(),
    label: z.string(),
    isDefault: z.boolean().default(false),
  })).optional(),
  validationRules: z.record(z.unknown()).optional(),
});

export const UpdateFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  maxLength: z.number().positive().optional(),
  defaultValue: z.unknown().optional(),
  choices: z.array(z.object({
    value: z.string(),
    label: z.string(),
    isDefault: z.boolean().default(false),
  })).optional(),
  validationRules: z.record(z.unknown()).optional(),
});

export const DeleteFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  force: z.boolean().default(false),
});

export const ValidateFieldValueSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  value: z.unknown(),
});

export const GetFieldUsageSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
});

export const DuplicateFieldSchema = z.object({
  sourceFieldId: z.string().min(1, 'Source field ID is required'),
  targetProjectId: z.string().min(1, 'Target project ID is required'),
  newName: z.string().optional(),
  newDisplayName: z.string().optional(),
});

export class FieldTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_fields',
        description: 'List project fields with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            fieldType: {
              type: 'string',
              enum: ['text', 'number', 'date', 'boolean', 'choice', 'multiChoice', 'file', 'user', 'lookup'],
              description: 'Filter by field type',
            },
            isRequired: {
              type: 'boolean',
              description: 'Filter by required status',
            },
            isSystemField: {
              type: 'boolean',
              description: 'Filter by system field status',
            },
            isSearchable: {
              type: 'boolean',
              description: 'Filter by searchable status',
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
              description: 'Field to sort by (e.g., "name", "displayName", "createdDate")',
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
        name: 'iconect_get_field',
        description: 'Get a specific field by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Field ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_field',
        description: 'Create a new custom field',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Internal field name (unique within project)',
            },
            displayName: {
              type: 'string',
              description: 'Display name for the field',
            },
            description: {
              type: 'string',
              description: 'Field description',
            },
            fieldType: {
              type: 'string',
              enum: ['text', 'number', 'date', 'boolean', 'choice', 'multiChoice', 'file', 'user', 'lookup'],
              description: 'Type of field',
            },
            dataType: {
              type: 'string',
              enum: ['string', 'integer', 'decimal', 'datetime', 'boolean'],
              description: 'Data type for storage',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            isRequired: {
              type: 'boolean',
              description: 'Whether field is required (default: false)',
            },
            isSearchable: {
              type: 'boolean',
              description: 'Whether field is searchable (default: true)',
            },
            maxLength: {
              type: 'number',
              description: 'Maximum length for text fields',
              minimum: 1,
            },
            defaultValue: {
              description: 'Default value for the field',
            },
            choices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  value: { type: 'string' },
                  label: { type: 'string' },
                  isDefault: { type: 'boolean' },
                },
                required: ['value', 'label'],
              },
              description: 'Available choices for choice/multiChoice fields',
            },
            validationRules: {
              type: 'object',
              description: 'Validation rules as key-value pairs',
            },
          },
          required: ['name', 'displayName', 'fieldType', 'dataType', 'projectId'],
        },
      },
      {
        name: 'iconect_update_field',
        description: 'Update an existing field (limited updates for system fields)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Field ID',
            },
            displayName: {
              type: 'string',
              description: 'Updated display name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            isRequired: {
              type: 'boolean',
              description: 'Updated required status',
            },
            isSearchable: {
              type: 'boolean',
              description: 'Updated searchable status',
            },
            maxLength: {
              type: 'number',
              description: 'Updated maximum length',
              minimum: 1,
            },
            defaultValue: {
              description: 'Updated default value',
            },
            choices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  value: { type: 'string' },
                  label: { type: 'string' },
                  isDefault: { type: 'boolean' },
                },
                required: ['value', 'label'],
              },
              description: 'Updated choices for choice/multiChoice fields',
            },
            validationRules: {
              type: 'object',
              description: 'Updated validation rules',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_field',
        description: 'Delete a custom field (system fields cannot be deleted)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Field ID',
            },
            force: {
              type: 'boolean',
              description: 'Force deletion even if field has data (default: false)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_validate_field_value',
        description: 'Validate a value against field constraints',
        inputSchema: {
          type: 'object',
          properties: {
            fieldId: {
              type: 'string',
              description: 'Field ID',
            },
            value: {
              description: 'Value to validate',
            },
          },
          required: ['fieldId', 'value'],
        },
      },
      {
        name: 'iconect_get_field_usage',
        description: 'Get usage statistics for a field',
        inputSchema: {
          type: 'object',
          properties: {
            fieldId: {
              type: 'string',
              description: 'Field ID',
            },
          },
          required: ['fieldId'],
        },
      },
      {
        name: 'iconect_duplicate_field',
        description: 'Duplicate a field to another project',
        inputSchema: {
          type: 'object',
          properties: {
            sourceFieldId: {
              type: 'string',
              description: 'Source field ID to duplicate',
            },
            targetProjectId: {
              type: 'string',
              description: 'Target project ID',
            },
            newName: {
              type: 'string',
              description: 'New internal name (optional, will auto-generate if not provided)',
            },
            newDisplayName: {
              type: 'string',
              description: 'New display name (optional, will copy from source)',
            },
          },
          required: ['sourceFieldId', 'targetProjectId'],
        },
      },
    ];
  }

  async handleListFields(args: unknown): Promise<unknown> {
    try {
      const options = ListFieldsSchema.parse(args);
      logger.info('Listing fields', { projectId: options.projectId });

      const queryParams = new URLSearchParams();
      queryParams.append('projectId', options.projectId);
      
      if (options.fieldType) queryParams.append('fieldType', options.fieldType);
      if (options.isRequired !== undefined) queryParams.append('isRequired', options.isRequired.toString());
      if (options.isSystemField !== undefined) queryParams.append('isSystemField', options.isSystemField.toString());
      if (options.isSearchable !== undefined) queryParams.append('isSearchable', options.isSearchable.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/fields?${queryParams.toString()}`;
      const response = await this.httpClient.get<PaginatedResponse<Field>>(url);

      return {
        success: true,
        message: 'Fields retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list fields', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list fields',
        'LIST_FIELDS_FAILED'
      );
    }
  }

  async handleGetField(args: unknown): Promise<unknown> {
    try {
      const { id } = GetFieldSchema.parse(args);
      logger.info('Getting field', { id });

      const response = await this.httpClient.get<Field>(`/fields/${id}`);
      const field = FieldSchema.parse(response);

      return {
        success: true,
        message: 'Field retrieved successfully',
        data: field,
      };
    } catch (error) {
      logger.error('Failed to get field', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get field',
        'GET_FIELD_FAILED'
      );
    }
  }

  async handleCreateField(args: unknown): Promise<unknown> {
    try {
      const fieldData = CreateFieldSchema.parse(args);
      logger.info('Creating field', { name: fieldData.name, fieldType: fieldData.fieldType, projectId: fieldData.projectId });

      const response = await this.httpClient.post<Field>('/fields', fieldData);
      const field = FieldSchema.parse(response);

      return {
        success: true,
        message: 'Field created successfully',
        data: field,
      };
    } catch (error) {
      logger.error('Failed to create field', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create field',
        'CREATE_FIELD_FAILED'
      );
    }
  }

  async handleUpdateField(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateFieldSchema.parse(args);
      logger.info('Updating field', { id });

      const response = await this.httpClient.put<Field>(`/fields/${id}`, updateData);
      const field = FieldSchema.parse(response);

      return {
        success: true,
        message: 'Field updated successfully',
        data: field,
      };
    } catch (error) {
      logger.error('Failed to update field', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update field',
        'UPDATE_FIELD_FAILED'
      );
    }
  }

  async handleDeleteField(args: unknown): Promise<unknown> {
    try {
      const { id, force } = DeleteFieldSchema.parse(args);
      logger.info('Deleting field', { id, force });

      const queryParams = new URLSearchParams();
      if (force) queryParams.append('force', 'true');

      const url = `/fields/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      await this.httpClient.delete(url);

      return {
        success: true,
        message: 'Field deleted successfully',
        data: { id, force },
      };
    } catch (error) {
      logger.error('Failed to delete field', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete field',
        'DELETE_FIELD_FAILED'
      );
    }
  }

  async handleValidateFieldValue(args: unknown): Promise<unknown> {
    try {
      const { fieldId, value } = ValidateFieldValueSchema.parse(args);
      logger.info('Validating field value', { fieldId });

      const response = await this.httpClient.post<{
        isValid: boolean;
        errors: string[];
        normalizedValue?: unknown;
      }>(`/fields/${fieldId}/validate`, { value });

      return {
        success: true,
        message: 'Field value validation completed',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to validate field value', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to validate field value',
        'VALIDATE_FIELD_VALUE_FAILED'
      );
    }
  }

  async handleGetFieldUsage(args: unknown): Promise<unknown> {
    try {
      const { fieldId } = GetFieldUsageSchema.parse(args);
      logger.info('Getting field usage statistics', { fieldId });

      const response = await this.httpClient.get<{
        recordCount: number;
        populatedCount: number;
        emptyCount: number;
        uniqueValueCount: number;
        mostCommonValues: Array<{
          value: unknown;
          count: number;
        }>;
        lastUsed?: string;
      }>(`/fields/${fieldId}/usage`);

      return {
        success: true,
        message: 'Field usage statistics retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get field usage', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get field usage',
        'GET_FIELD_USAGE_FAILED'
      );
    }
  }

  async handleDuplicateField(args: unknown): Promise<unknown> {
    try {
      const duplicateData = DuplicateFieldSchema.parse(args);
      logger.info('Duplicating field', { 
        sourceFieldId: duplicateData.sourceFieldId,
        targetProjectId: duplicateData.targetProjectId 
      });

      const response = await this.httpClient.post<Field>('/fields/duplicate', duplicateData);
      const field = FieldSchema.parse(response);

      return {
        success: true,
        message: 'Field duplicated successfully',
        data: field,
      };
    } catch (error) {
      logger.error('Failed to duplicate field', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to duplicate field',
        'DUPLICATE_FIELD_FAILED'
      );
    }
  }
}