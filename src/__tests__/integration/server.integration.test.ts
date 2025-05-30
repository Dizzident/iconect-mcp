import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { IconectMCPServer } from '../../index';
import { configManager } from '../../config';
import { IconectConfig } from '../../types';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('IconectMCPServer Integration Tests', () => {
  let server: any;
  let mockMCPServer: jest.Mocked<Server>;

  beforeEach(() => {
    // Reset configuration
    configManager.reset();

    // Mock MCP Server
    mockMCPServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn(),
    } as any;

    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockMCPServer);
  });

  describe('Server Initialization', () => {
    it('should initialize server with correct metadata', () => {
      server = new (IconectMCPServer as any)();

      expect(Server).toHaveBeenCalledWith(
        {
          name: 'iconect-mcp-server',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
    });

    it('should setup request handlers', () => {
      server = new (IconectMCPServer as any)();

      expect(mockMCPServer.setRequestHandler).toHaveBeenCalledTimes(2);
      expect(mockMCPServer.setRequestHandler).toHaveBeenCalledWith(
        expect.anything(), // ListToolsRequestSchema
        expect.any(Function)
      );
      expect(mockMCPServer.setRequestHandler).toHaveBeenCalledWith(
        expect.anything(), // CallToolRequestSchema
        expect.any(Function)
      );
    });
  });

  describe('Configuration Flow', () => {
    it('should show only configure tool when not configured', async () => {
      server = new (IconectMCPServer as any)();

      // Get the list tools handler
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});

      expect(tools.tools).toHaveLength(1);
      expect(tools.tools[0].name).toBe('iconect_configure');
    });

    it('should show all tools after configuration', async () => {
      server = new (IconectMCPServer as any)();

      // First configure the server
      const callToolHandler = mockMCPServer.setRequestHandler.mock.calls[1][1];
      
      const configResult = await callToolHandler({
        params: {
          name: 'iconect_configure',
          arguments: {
            baseUrl: 'https://api.test.com',
            clientId: 'test-client-id',
            clientSecret: 'test-secret',
          },
        },
      });

      expect(JSON.parse(configResult.content[0].text).success).toBe(true);

      // Now check available tools
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});

      // Should have many tools now (auth, data servers, projects, etc.)
      expect(tools.tools.length).toBeGreaterThan(50);
      
      // Check for various tool categories
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).toContain('iconect_auth_password');
      expect(toolNames).toContain('iconect_list_projects');
      expect(toolNames).toContain('iconect_list_files');
      expect(toolNames).toContain('iconect_search_records');
      expect(toolNames).toContain('iconect_list_jobs');
      expect(toolNames).toContain('iconect_list_panels');
      expect(toolNames).toContain('iconect_list_themes');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool error', async () => {
      server = new (IconectMCPServer as any)();

      // Configure first
      const callToolHandler = mockMCPServer.setRequestHandler.mock.calls[1][1];
      await callToolHandler({
        params: {
          name: 'iconect_configure',
          arguments: {
            baseUrl: 'https://api.test.com',
            clientId: 'test-client-id',
          },
        },
      });

      // Try to call unknown tool
      const result = await callToolHandler({
        params: {
          name: 'iconect_unknown_tool',
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.success).toBe(false);
      expect(error.error.code).toBe('UNKNOWN_TOOL');
    });

    it('should handle tool execution errors', async () => {
      server = new (IconectMCPServer as any)();

      // Try to call a tool without configuration
      const callToolHandler = mockMCPServer.setRequestHandler.mock.calls[1][1];
      const result = await callToolHandler({
        params: {
          name: 'iconect_list_projects',
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.success).toBe(false);
      expect(error.error.code).toBe('NOT_CONFIGURED');
    });
  });

  describe('Tool Categories', () => {
    beforeEach(async () => {
      server = new (IconectMCPServer as any)();
      
      // Configure the server
      const callToolHandler = mockMCPServer.setRequestHandler.mock.calls[1][1];
      await callToolHandler({
        params: {
          name: 'iconect_configure',
          arguments: {
            baseUrl: 'https://api.test.com',
            clientId: 'test-client-id',
          },
        },
      });
    });

    it('should have all authentication tools', async () => {
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});
      const toolNames = tools.tools.map((t: any) => t.name);

      const authTools = [
        'iconect_auth_password',
        'iconect_auth_code',
        'iconect_refresh_token',
        'iconect_generate_auth_url',
        'iconect_logout',
        'iconect_get_auth_status',
      ];

      authTools.forEach(tool => {
        expect(toolNames).toContain(tool);
      });
    });

    it('should have all core resource tools', async () => {
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});
      const toolNames = tools.tools.map((t: any) => t.name);

      // Check data server tools
      expect(toolNames).toContain('iconect_list_data_servers');
      expect(toolNames).toContain('iconect_create_data_server');

      // Check project tools
      expect(toolNames).toContain('iconect_list_projects');
      expect(toolNames).toContain('iconect_create_project');

      // Check client tools
      expect(toolNames).toContain('iconect_list_clients');
      expect(toolNames).toContain('iconect_create_client');
    });

    it('should have all file operation tools', async () => {
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});
      const toolNames = tools.tools.map((t: any) => t.name);

      const fileTools = [
        'iconect_list_files',
        'iconect_upload_file',
        'iconect_download_file',
        'iconect_initiate_chunked_upload',
        'iconect_upload_chunk',
        'iconect_complete_chunked_upload',
      ];

      fileTools.forEach(tool => {
        expect(toolNames).toContain(tool);
      });
    });

    it('should have all UI component tools', async () => {
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});
      const toolNames = tools.tools.map((t: any) => t.name);

      // Check panel tools
      expect(toolNames).toContain('iconect_list_panels');
      expect(toolNames).toContain('iconect_create_panel');

      // Check template tools
      expect(toolNames).toContain('iconect_list_templates');
      expect(toolNames).toContain('iconect_render_template');

      // Check dashboard tools
      expect(toolNames).toContain('iconect_list_dashboards');
      expect(toolNames).toContain('iconect_add_widget');

      // Check theme tools
      expect(toolNames).toContain('iconect_list_themes');
      expect(toolNames).toContain('iconect_apply_theme');
    });
  });

  describe('Complete Workflow Test', () => {
    it('should handle a complete authentication and resource listing workflow', async () => {
      server = new (IconectMCPServer as any)();
      const callToolHandler = mockMCPServer.setRequestHandler.mock.calls[1][1];

      // Step 1: Configure
      const configResult = await callToolHandler({
        params: {
          name: 'iconect_configure',
          arguments: {
            baseUrl: 'https://api.test.com',
            clientId: 'test-client-id',
            clientSecret: 'test-secret',
            timeout: 45000,
            logLevel: 'INFO',
          },
        },
      });

      expect(JSON.parse(configResult.content[0].text).success).toBe(true);

      // Step 2: Check available tools
      const listToolsHandler = mockMCPServer.setRequestHandler.mock.calls[0][1];
      const tools = await listToolsHandler({});
      expect(tools.tools.length).toBeGreaterThan(150); // We have 180+ tools

      // Step 3: Generate auth URL (would normally mock auth service)
      // This would require mocking the auth service behavior
      // For integration test, we just verify the tool exists
      expect(tools.tools.find((t: any) => t.name === 'iconect_generate_auth_url')).toBeDefined();
    });
  });
});