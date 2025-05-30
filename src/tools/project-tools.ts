import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Project, ProjectSchema, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListProjectsSchema = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filter: z.record(z.unknown()).optional(),
});

export const GetProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  dataServerId: z.string().min(1, 'Data server ID is required'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  dataServerId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const DeleteProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

export class ProjectTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_projects',
        description: 'List all projects with optional filtering and pagination',
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
        name: 'iconect_get_project',
        description: 'Get a specific project by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Project ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_project',
        description: 'Create a new project',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            clientId: {
              type: 'string',
              description: 'Client ID',
            },
            dataServerId: {
              type: 'string',
              description: 'Data server ID',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              description: 'Project status (default: active)',
            },
            settings: {
              type: 'object',
              description: 'Project settings as key-value pairs',
            },
          },
          required: ['name', 'clientId', 'dataServerId'],
        },
      },
      {
        name: 'iconect_update_project',
        description: 'Update an existing project',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            clientId: {
              type: 'string',
              description: 'Client ID',
            },
            dataServerId: {
              type: 'string',
              description: 'Data server ID',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              description: 'Project status',
            },
            settings: {
              type: 'object',
              description: 'Project settings as key-value pairs',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_project',
        description: 'Delete a project',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Project ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListProjects(args: unknown): Promise<unknown> {
    try {
      const options = ListProjectsSchema.parse(args);
      logger.info('Listing projects', { options });

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

      const url = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<Project>>(url);

      return {
        success: true,
        message: 'Projects retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list projects', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list projects',
        'LIST_PROJECTS_FAILED'
      );
    }
  }

  async handleGetProject(args: unknown): Promise<unknown> {
    try {
      const { id } = GetProjectSchema.parse(args);
      logger.info('Getting project', { id });

      const response = await this.httpClient.get<Project>(`/projects/${id}`);
      const project = ProjectSchema.parse(response);

      return {
        success: true,
        message: 'Project retrieved successfully',
        data: project,
      };
    } catch (error) {
      logger.error('Failed to get project', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get project',
        'GET_PROJECT_FAILED'
      );
    }
  }

  async handleCreateProject(args: unknown): Promise<unknown> {
    try {
      const projectData = CreateProjectSchema.parse(args);
      logger.info('Creating project', { name: projectData.name });

      const response = await this.httpClient.post<Project>('/projects', projectData);
      const project = ProjectSchema.parse(response);

      return {
        success: true,
        message: 'Project created successfully',
        data: project,
      };
    } catch (error) {
      logger.error('Failed to create project', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create project',
        'CREATE_PROJECT_FAILED'
      );
    }
  }

  async handleUpdateProject(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateProjectSchema.parse(args);
      logger.info('Updating project', { id });

      const response = await this.httpClient.put<Project>(`/projects/${id}`, updateData);
      const project = ProjectSchema.parse(response);

      return {
        success: true,
        message: 'Project updated successfully',
        data: project,
      };
    } catch (error) {
      logger.error('Failed to update project', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update project',
        'UPDATE_PROJECT_FAILED'
      );
    }
  }

  async handleDeleteProject(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteProjectSchema.parse(args);
      logger.info('Deleting project', { id });

      await this.httpClient.delete(`/projects/${id}`);

      return {
        success: true,
        message: 'Project deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete project', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete project',
        'DELETE_PROJECT_FAILED'
      );
    }
  }
}