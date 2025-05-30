import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Template, TemplateSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListTemplatesSchema = z.object({
  type: z.enum(['document', 'email', 'report', 'form', 'workflow', 'notification']).optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  includeContent: z.boolean().default(true),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  type: z.enum(['document', 'email', 'report', 'form', 'workflow', 'notification']),
  category: z.string().optional(),
  projectId: z.string().optional(),
  content: z.object({
    format: z.enum(['html', 'markdown', 'text', 'json', 'xml']),
    template: z.string().min(1, 'Template content is required'),
    variables: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'date', 'boolean', 'list', 'object']),
      required: z.boolean().default(false),
      defaultValue: z.unknown().optional(),
      description: z.string().optional(),
    })).optional(),
    styles: z.string().optional(),
    scripts: z.string().optional(),
  }),
  settings: z.object({
    outputFormat: z.enum(['pdf', 'html', 'docx', 'txt', 'email']).optional(),
    paperSize: z.enum(['a4', 'a3', 'letter', 'legal', 'custom']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    margins: z.object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number(),
    }).optional(),
    headers: z.boolean().default(false),
    footers: z.boolean().default(false),
    watermark: z.string().optional(),
  }).optional(),
  validation: z.object({
    required: z.array(z.string()).optional(),
    schema: z.record(z.unknown()).optional(),
  }).optional(),
});

export const UpdateTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  name: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  content: z.object({
    format: z.enum(['html', 'markdown', 'text', 'json', 'xml']).optional(),
    template: z.string().optional(),
    variables: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'date', 'boolean', 'list', 'object']),
      required: z.boolean().default(false),
      defaultValue: z.unknown().optional(),
      description: z.string().optional(),
    })).optional(),
    styles: z.string().optional(),
    scripts: z.string().optional(),
  }).optional(),
  settings: z.object({
    outputFormat: z.enum(['pdf', 'html', 'docx', 'txt', 'email']).optional(),
    paperSize: z.enum(['a4', 'a3', 'letter', 'legal', 'custom']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    margins: z.object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number(),
    }).optional(),
    headers: z.boolean().optional(),
    footers: z.boolean().optional(),
    watermark: z.string().optional(),
  }).optional(),
  validation: z.object({
    required: z.array(z.string()).optional(),
    schema: z.record(z.unknown()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export const DeleteTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
});

export const DuplicateTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  newName: z.string().min(1, 'New template name is required'),
  newDisplayName: z.string().optional(),
  targetProjectId: z.string().optional(),
});

export const RenderTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  variables: z.record(z.unknown()).default({}),
  outputFormat: z.enum(['pdf', 'html', 'docx', 'txt', 'email']).optional(),
});

export const ValidateTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  variables: z.record(z.unknown()).default({}),
});

export const GetTemplateVariablesSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
});

export class TemplateTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_templates',
        description: 'List templates with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['document', 'email', 'report', 'form', 'workflow', 'notification'],
              description: 'Filter by template type',
            },
            category: {
              type: 'string',
              description: 'Filter by category',
            },
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            isSystem: {
              type: 'boolean',
              description: 'Filter by system template status',
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
        name: 'iconect_get_template',
        description: 'Get a specific template with optional content',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Template ID',
            },
            includeContent: {
              type: 'boolean',
              description: 'Include template content (default: true)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_template',
        description: 'Create a new template',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Template internal name',
            },
            displayName: {
              type: 'string',
              description: 'Template display name',
            },
            description: {
              type: 'string',
              description: 'Template description',
            },
            type: {
              type: 'string',
              enum: ['document', 'email', 'report', 'form', 'workflow', 'notification'],
              description: 'Template type',
            },
            category: {
              type: 'string',
              description: 'Template category',
            },
            projectId: {
              type: 'string',
              description: 'Project ID (optional)',
            },
            content: {
              type: 'object',
              properties: {
                format: {
                  type: 'string',
                  enum: ['html', 'markdown', 'text', 'json', 'xml'],
                  description: 'Content format',
                },
                template: {
                  type: 'string',
                  description: 'Template content',
                },
                variables: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string', enum: ['string', 'number', 'date', 'boolean', 'list', 'object'] },
                      required: { type: 'boolean', default: false },
                      defaultValue: { description: 'Default value for the variable' },
                      description: { type: 'string' },
                    },
                    required: ['name', 'type'],
                  },
                  description: 'Template variables',
                },
                styles: {
                  type: 'string',
                  description: 'CSS styles',
                },
                scripts: {
                  type: 'string',
                  description: 'JavaScript code',
                },
              },
              required: ['format', 'template'],
              description: 'Template content configuration',
            },
            settings: {
              type: 'object',
              properties: {
                outputFormat: { type: 'string', enum: ['pdf', 'html', 'docx', 'txt', 'email'] },
                paperSize: { type: 'string', enum: ['a4', 'a3', 'letter', 'legal', 'custom'] },
                orientation: { type: 'string', enum: ['portrait', 'landscape'] },
                margins: {
                  type: 'object',
                  properties: {
                    top: { type: 'number' },
                    right: { type: 'number' },
                    bottom: { type: 'number' },
                    left: { type: 'number' },
                  },
                  required: ['top', 'right', 'bottom', 'left'],
                },
                headers: { type: 'boolean', default: false },
                footers: { type: 'boolean', default: false },
                watermark: { type: 'string' },
              },
              description: 'Template rendering settings',
            },
            validation: {
              type: 'object',
              properties: {
                required: { type: 'array', items: { type: 'string' } },
                schema: { type: 'object' },
              },
              description: 'Template validation rules',
            },
          },
          required: ['name', 'displayName', 'type', 'content'],
        },
      },
      {
        name: 'iconect_update_template',
        description: 'Update an existing template',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Template ID',
            },
            name: {
              type: 'string',
              description: 'Updated template name',
            },
            displayName: {
              type: 'string',
              description: 'Updated display name',
            },
            description: {
              type: 'string',
              description: 'Updated description',
            },
            category: {
              type: 'string',
              description: 'Updated category',
            },
            content: {
              type: 'object',
              description: 'Updated content configuration',
            },
            settings: {
              type: 'object',
              description: 'Updated rendering settings',
            },
            validation: {
              type: 'object',
              description: 'Updated validation rules',
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
        name: 'iconect_delete_template',
        description: 'Delete a template',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Template ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_duplicate_template',
        description: 'Duplicate a template with new configuration',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Source template ID',
            },
            newName: {
              type: 'string',
              description: 'New template name',
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
        name: 'iconect_render_template',
        description: 'Render a template with provided variables',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Template ID',
            },
            variables: {
              type: 'object',
              description: 'Variables for template rendering',
            },
            outputFormat: {
              type: 'string',
              enum: ['pdf', 'html', 'docx', 'txt', 'email'],
              description: 'Output format (optional)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_validate_template',
        description: 'Validate template with provided variables',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Template ID',
            },
            variables: {
              type: 'object',
              description: 'Variables to validate',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_get_template_variables',
        description: 'Get required and optional variables for a template',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Template ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListTemplates(args: unknown): Promise<unknown> {
    try {
      const options = ListTemplatesSchema.parse(args);
      logger.info('Listing templates', { options });

      const queryParams = new URLSearchParams();
      if (options.type) queryParams.append('type', options.type);
      if (options.category) queryParams.append('category', options.category);
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.isSystem !== undefined) queryParams.append('isSystem', options.isSystem.toString());
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const url = `/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<Template>>(url);

      return {
        success: true,
        message: 'Templates retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list templates', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list templates',
        'LIST_TEMPLATES_FAILED'
      );
    }
  }

  async handleGetTemplate(args: unknown): Promise<unknown> {
    try {
      const { id, includeContent } = GetTemplateSchema.parse(args);
      logger.info('Getting template', { id, includeContent });

      const queryParams = new URLSearchParams();
      if (!includeContent) queryParams.append('includeContent', 'false');

      const url = `/templates/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<Template>(url);
      const template = TemplateSchema.parse(response);

      return {
        success: true,
        message: 'Template retrieved successfully',
        data: template,
      };
    } catch (error) {
      logger.error('Failed to get template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get template',
        'GET_TEMPLATE_FAILED'
      );
    }
  }

  async handleCreateTemplate(args: unknown): Promise<unknown> {
    try {
      const templateData = CreateTemplateSchema.parse(args);
      logger.info('Creating template', { name: templateData.name, type: templateData.type });

      const response = await this.httpClient.post<Template>('/templates', templateData);
      const template = TemplateSchema.parse(response);

      return {
        success: true,
        message: 'Template created successfully',
        data: template,
      };
    } catch (error) {
      logger.error('Failed to create template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create template',
        'CREATE_TEMPLATE_FAILED'
      );
    }
  }

  async handleUpdateTemplate(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateTemplateSchema.parse(args);
      logger.info('Updating template', { id });

      const response = await this.httpClient.put<Template>(`/templates/${id}`, updateData);
      const template = TemplateSchema.parse(response);

      return {
        success: true,
        message: 'Template updated successfully',
        data: template,
      };
    } catch (error) {
      logger.error('Failed to update template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update template',
        'UPDATE_TEMPLATE_FAILED'
      );
    }
  }

  async handleDeleteTemplate(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteTemplateSchema.parse(args);
      logger.info('Deleting template', { id });

      await this.httpClient.delete(`/templates/${id}`);

      return {
        success: true,
        message: 'Template deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete template',
        'DELETE_TEMPLATE_FAILED'
      );
    }
  }

  async handleDuplicateTemplate(args: unknown): Promise<unknown> {
    try {
      const duplicateData = DuplicateTemplateSchema.parse(args);
      logger.info('Duplicating template', { 
        id: duplicateData.id, 
        newName: duplicateData.newName,
        targetProjectId: duplicateData.targetProjectId 
      });

      const response = await this.httpClient.post<Template>(`/templates/${duplicateData.id}/duplicate`, {
        newName: duplicateData.newName,
        newDisplayName: duplicateData.newDisplayName,
        targetProjectId: duplicateData.targetProjectId,
      });
      const template = TemplateSchema.parse(response);

      return {
        success: true,
        message: 'Template duplicated successfully',
        data: template,
      };
    } catch (error) {
      logger.error('Failed to duplicate template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to duplicate template',
        'DUPLICATE_TEMPLATE_FAILED'
      );
    }
  }

  async handleRenderTemplate(args: unknown): Promise<unknown> {
    try {
      const renderData = RenderTemplateSchema.parse(args);
      logger.info('Rendering template', { id: renderData.id, outputFormat: renderData.outputFormat });

      const response = await this.httpClient.post<{
        content: string;
        format: string;
        size: number;
        downloadUrl?: string;
      }>(`/templates/${renderData.id}/render`, {
        variables: renderData.variables,
        outputFormat: renderData.outputFormat,
      });

      return {
        success: true,
        message: 'Template rendered successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to render template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to render template',
        'RENDER_TEMPLATE_FAILED'
      );
    }
  }

  async handleValidateTemplate(args: unknown): Promise<unknown> {
    try {
      const validateData = ValidateTemplateSchema.parse(args);
      logger.info('Validating template', { id: validateData.id });

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
      }>(`/templates/${validateData.id}/validate`, {
        variables: validateData.variables,
      });

      return {
        success: true,
        message: 'Template validation completed',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to validate template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to validate template',
        'VALIDATE_TEMPLATE_FAILED'
      );
    }
  }

  async handleGetTemplateVariables(args: unknown): Promise<unknown> {
    try {
      const { id } = GetTemplateVariablesSchema.parse(args);
      logger.info('Getting template variables', { id });

      const response = await this.httpClient.get<{
        variables: Array<{
          name: string;
          type: string;
          required: boolean;
          defaultValue?: unknown;
          description?: string;
        }>;
        requiredVariables: string[];
        optionalVariables: string[];
      }>(`/templates/${id}/variables`);

      return {
        success: true,
        message: 'Template variables retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get template variables', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get template variables',
        'GET_TEMPLATE_VARIABLES_FAILED'
      );
    }
  }
}