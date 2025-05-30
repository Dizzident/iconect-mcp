import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Client, ClientSchema, ListOptions, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListClientsSchema = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filter: z.record(z.unknown()).optional(),
});

export const GetClientSchema = z.object({
  id: z.string().min(1, 'Client ID is required'),
});

export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateClientSchema = z.object({
  id: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const DeleteClientSchema = z.object({
  id: z.string().min(1, 'Client ID is required'),
});

export class ClientTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_clients',
        description: 'List all clients with optional filtering and pagination',
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
        name: 'iconect_get_client',
        description: 'Get a specific client by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Client ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_client',
        description: 'Create a new client',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Client name',
            },
            description: {
              type: 'string',
              description: 'Client description',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Client status (default: active)',
            },
            settings: {
              type: 'object',
              description: 'Client settings as key-value pairs',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'iconect_update_client',
        description: 'Update an existing client',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Client ID',
            },
            name: {
              type: 'string',
              description: 'Client name',
            },
            description: {
              type: 'string',
              description: 'Client description',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Client status',
            },
            settings: {
              type: 'object',
              description: 'Client settings as key-value pairs',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_client',
        description: 'Delete a client',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Client ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListClients(args: unknown): Promise<unknown> {
    try {
      const options = ListClientsSchema.parse(args);
      logger.info('Listing clients', { options });

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

      const url = `/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<Client>>(url);

      return {
        success: true,
        message: 'Clients retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list clients', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list clients',
        'LIST_CLIENTS_FAILED'
      );
    }
  }

  async handleGetClient(args: unknown): Promise<unknown> {
    try {
      const { id } = GetClientSchema.parse(args);
      logger.info('Getting client', { id });

      const response = await this.httpClient.get<Client>(`/clients/${id}`);
      const client = ClientSchema.parse(response);

      return {
        success: true,
        message: 'Client retrieved successfully',
        data: client,
      };
    } catch (error) {
      logger.error('Failed to get client', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get client',
        'GET_CLIENT_FAILED'
      );
    }
  }

  async handleCreateClient(args: unknown): Promise<unknown> {
    try {
      const clientData = CreateClientSchema.parse(args);
      logger.info('Creating client', { name: clientData.name });

      const response = await this.httpClient.post<Client>('/clients', clientData);
      const client = ClientSchema.parse(response);

      return {
        success: true,
        message: 'Client created successfully',
        data: client,
      };
    } catch (error) {
      logger.error('Failed to create client', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create client',
        'CREATE_CLIENT_FAILED'
      );
    }
  }

  async handleUpdateClient(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateClientSchema.parse(args);
      logger.info('Updating client', { id });

      const response = await this.httpClient.put<Client>(`/clients/${id}`, updateData);
      const client = ClientSchema.parse(response);

      return {
        success: true,
        message: 'Client updated successfully',
        data: client,
      };
    } catch (error) {
      logger.error('Failed to update client', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update client',
        'UPDATE_CLIENT_FAILED'
      );
    }
  }

  async handleDeleteClient(args: unknown): Promise<unknown> {
    try {
      const { id } = DeleteClientSchema.parse(args);
      logger.info('Deleting client', { id });

      await this.httpClient.delete(`/clients/${id}`);

      return {
        success: true,
        message: 'Client deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete client', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete client',
        'DELETE_CLIENT_FAILED'
      );
    }
  }
}