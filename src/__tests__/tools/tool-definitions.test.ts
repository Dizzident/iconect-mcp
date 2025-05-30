import { describe, it, expect } from '@jest/globals';
import { ProjectTools } from '../../tools/project-tools.js';
import { DataServerTools } from '../../tools/data-server-tools.js';
import { AuthTools } from '../../tools/auth-tools.js';
import { HttpClient } from '../../client/http-client.js';
import { AuthService } from '../../auth/auth-service.js';

describe('Tool Definitions', () => {
  describe('ProjectTools', () => {
    it('should define all required project tools', () => {
      const mockHttpClient = {} as HttpClient;
      const projectTools = new ProjectTools(mockHttpClient);
      const tools = projectTools.getTools();

      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('iconect_list_projects');
      expect(toolNames).toContain('iconect_get_project');
      expect(toolNames).toContain('iconect_create_project');
      expect(toolNames).toContain('iconect_update_project');
      expect(toolNames).toContain('iconect_delete_project');

      // Check that all tools have required properties
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });

    it('should have proper input schemas for each tool', () => {
      const mockHttpClient = {} as HttpClient;
      const projectTools = new ProjectTools(mockHttpClient);
      const tools = projectTools.getTools();

      const listTool = tools.find(t => t.name === 'iconect_list_projects');
      expect(listTool?.inputSchema.properties).toHaveProperty('page');
      expect(listTool?.inputSchema.properties).toHaveProperty('pageSize');

      const getTool = tools.find(t => t.name === 'iconect_get_project');
      expect(getTool?.inputSchema.properties).toHaveProperty('id');
      expect(getTool?.inputSchema.required).toContain('id');

      const createTool = tools.find(t => t.name === 'iconect_create_project');
      expect(createTool?.inputSchema.properties).toHaveProperty('name');
      expect(createTool?.inputSchema.properties).toHaveProperty('clientId');
      expect(createTool?.inputSchema.required).toContain('name');
      expect(createTool?.inputSchema.required).toContain('clientId');
    });
  });

  describe('DataServerTools', () => {
    it('should define all required data server tools', () => {
      const mockHttpClient = {} as HttpClient;
      const dataServerTools = new DataServerTools(mockHttpClient);
      const tools = dataServerTools.getTools();

      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('iconect_list_data_servers');
      expect(toolNames).toContain('iconect_get_data_server');
      expect(toolNames).toContain('iconect_create_data_server');
      expect(toolNames).toContain('iconect_update_data_server');
      expect(toolNames).toContain('iconect_delete_data_server');
    });

    it('should have proper input schemas', () => {
      const mockHttpClient = {} as HttpClient;
      const dataServerTools = new DataServerTools(mockHttpClient);
      const tools = dataServerTools.getTools();

      const createTool = tools.find(t => t.name === 'iconect_create_data_server');
      expect(createTool?.inputSchema.properties).toHaveProperty('name');
      expect(createTool?.inputSchema.properties).toHaveProperty('url');
      expect(createTool?.inputSchema.required).toContain('name');
      expect(createTool?.inputSchema.required).toContain('url');
    });
  });

  describe('AuthTools', () => {
    it('should define all required auth tools', () => {
      const mockAuthService = {} as AuthService;
      const authTools = new AuthTools(mockAuthService);
      const tools = authTools.getTools();

      expect(tools).toHaveLength(6);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('iconect_auth_password');
      expect(toolNames).toContain('iconect_auth_code');
      expect(toolNames).toContain('iconect_refresh_token');
      expect(toolNames).toContain('iconect_generate_auth_url');
      expect(toolNames).toContain('iconect_logout');
      expect(toolNames).toContain('iconect_get_auth_status');
    });

    it('should have proper input schemas', () => {
      const mockAuthService = {} as AuthService;
      const authTools = new AuthTools(mockAuthService);
      const tools = authTools.getTools();

      const passwordTool = tools.find(t => t.name === 'iconect_auth_password');
      expect(passwordTool?.inputSchema.properties).toHaveProperty('username');
      expect(passwordTool?.inputSchema.properties).toHaveProperty('password');
      expect(passwordTool?.inputSchema.required).toContain('username');
      expect(passwordTool?.inputSchema.required).toContain('password');

      const authUrlTool = tools.find(t => t.name === 'iconect_generate_auth_url');
      expect(authUrlTool?.inputSchema.properties).toHaveProperty('redirectUri');
      expect(authUrlTool?.inputSchema.required).toContain('redirectUri');
    });
  });

  describe('Tool Consistency', () => {
    it('should have consistent naming patterns', () => {
      const mockHttpClient = {} as HttpClient;
      const mockAuthService = {} as AuthService;
      
      const projectTools = new ProjectTools(mockHttpClient);
      const dataServerTools = new DataServerTools(mockHttpClient);
      const authTools = new AuthTools(mockAuthService);
      
      const allTools = [
        ...projectTools.getTools(),
        ...dataServerTools.getTools(),
        ...authTools.getTools()
      ];

      // All tools should start with 'iconect_'
      allTools.forEach(tool => {
        expect(tool.name).toMatch(/^iconect_/);
      });

      // CRUD operations should follow consistent patterns for specific resources
      const expectedProjectTools = [
        'iconect_list_projects',
        'iconect_get_project',
        'iconect_create_project',
        'iconect_update_project',
        'iconect_delete_project'
      ];
      
      const expectedDataServerTools = [
        'iconect_list_data_servers',
        'iconect_get_data_server',
        'iconect_create_data_server',
        'iconect_update_data_server',
        'iconect_delete_data_server'
      ];
      
      [...expectedProjectTools, ...expectedDataServerTools].forEach(expectedName => {
        const toolExists = allTools.some(tool => tool.name === expectedName);
        expect(toolExists).toBe(true);
      });
    });

    it('should have meaningful descriptions', () => {
      const mockHttpClient = {} as HttpClient;
      const projectTools = new ProjectTools(mockHttpClient);
      const tools = projectTools.getTools();

      tools.forEach(tool => {
        expect(tool.description).toBeDefined();
        expect(tool.description!.length).toBeGreaterThan(10);
        expect(tool.description).not.toMatch(/TODO|FIXME|placeholder/i);
      });
    });

    it('should define required fields consistently', () => {
      const mockHttpClient = {} as HttpClient;
      const projectTools = new ProjectTools(mockHttpClient);
      const tools = projectTools.getTools();

      // Get and Delete operations should require ID
      const getTool = tools.find(t => t.name === 'iconect_get_project');
      const deleteTool = tools.find(t => t.name === 'iconect_delete_project');
      
      expect(getTool?.inputSchema.required).toContain('id');
      expect(deleteTool?.inputSchema.required).toContain('id');

      // Create operations should require essential fields
      const createTool = tools.find(t => t.name === 'iconect_create_project');
      expect(createTool?.inputSchema.required).toContain('name');
      expect(createTool?.inputSchema.required).toContain('clientId');

      // Update operations should require ID
      const updateTool = tools.find(t => t.name === 'iconect_update_project');
      expect(updateTool?.inputSchema.required).toContain('id');
    });
  });
});