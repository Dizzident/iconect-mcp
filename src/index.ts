#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { configManager } from './config/index.js';
import { HttpClient } from './client/http-client.js';
import { AuthService } from './auth/auth-service.js';
import { AuthTools } from './tools/auth-tools.js';
import { DataServerTools } from './tools/data-server-tools.js';
import { ProjectTools } from './tools/project-tools.js';
import { ClientTools } from './tools/client-tools.js';
import { FileStoreTools } from './tools/file-store-tools.js';
import { FileTools } from './tools/file-tools.js';
import { RecordTools } from './tools/record-tools.js';
import { FieldTools } from './tools/field-tools.js';
import { FolderTools } from './tools/folder-tools.js';
import { JobTools } from './tools/job-tools.js';
import { logger, LogLevel } from './utils/logger.js';
import { IconectError } from './utils/errors.js';

class IconectMCPServer {
  private server: Server;
  private httpClient: HttpClient | null = null;
  private authService: AuthService | null = null;
  private authTools: AuthTools | null = null;
  private dataServerTools: DataServerTools | null = null;
  private projectTools: ProjectTools | null = null;
  private clientTools: ClientTools | null = null;
  private fileStoreTools: FileStoreTools | null = null;
  private fileTools: FileTools | null = null;
  private recordTools: RecordTools | null = null;
  private fieldTools: FieldTools | null = null;
  private folderTools: FolderTools | null = null;
  private jobTools: JobTools | null = null;

  constructor() {
    this.server = new Server(
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

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.isConfigured()) {
        return {
          tools: [
            {
              name: 'iconect_configure',
              description: 'Configure the Iconect MCP server with connection details',
              inputSchema: {
                type: 'object',
                properties: {
                  baseUrl: {
                    type: 'string',
                    description: 'Iconect API base URL',
                  },
                  clientId: {
                    type: 'string',
                    description: 'OAuth client ID',
                  },
                  clientSecret: {
                    type: 'string',
                    description: 'OAuth client secret (optional)',
                  },
                  timeout: {
                    type: 'number',
                    description: 'Request timeout in milliseconds (default: 30000)',
                  },
                  logLevel: {
                    type: 'string',
                    enum: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
                    description: 'Log level (default: INFO)',
                  },
                },
                required: ['baseUrl', 'clientId'],
              },
            },
          ],
        };
      }

      const tools: Tool[] = [];
      
      if (this.authTools) {
        tools.push(...this.authTools.getTools());
      }
      
      if (this.dataServerTools) {
        tools.push(...this.dataServerTools.getTools());
      }
      
      if (this.projectTools) {
        tools.push(...this.projectTools.getTools());
      }
      
      if (this.clientTools) {
        tools.push(...this.clientTools.getTools());
      }
      
      if (this.fileStoreTools) {
        tools.push(...this.fileStoreTools.getTools());
      }
      
      if (this.fileTools) {
        tools.push(...this.fileTools.getTools());
      }
      
      if (this.recordTools) {
        tools.push(...this.recordTools.getTools());
      }
      
      if (this.fieldTools) {
        tools.push(...this.fieldTools.getTools());
      }
      
      if (this.folderTools) {
        tools.push(...this.folderTools.getTools());
      }
      
      if (this.jobTools) {
        tools.push(...this.jobTools.getTools());
      }

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'iconect_configure') {
          return await this.handleConfigure(args || {});
        }

        if (!this.isConfigured()) {
          throw new IconectError('Server not configured. Use iconect_configure first.', 'NOT_CONFIGURED');
        }

        // Auth tools
        if (this.authTools) {
          switch (name) {
            case 'iconect_auth_password':
              return { content: [{ type: 'text', text: JSON.stringify(await this.authTools.handleAuthPassword(args)) }] };
            case 'iconect_auth_code':
              return { content: [{ type: 'text', text: JSON.stringify(await this.authTools.handleAuthCode(args)) }] };
            case 'iconect_refresh_token':
              return { content: [{ type: 'text', text: JSON.stringify(await this.authTools.handleRefreshToken(args)) }] };
            case 'iconect_generate_auth_url':
              return { content: [{ type: 'text', text: JSON.stringify(this.authTools.handleGenerateAuthUrl(args)) }] };
            case 'iconect_logout':
              return { content: [{ type: 'text', text: JSON.stringify(this.authTools.handleLogout()) }] };
            case 'iconect_get_auth_status':
              return { content: [{ type: 'text', text: JSON.stringify(this.authTools.handleGetAuthStatus()) }] };
          }
        }

        // Data server tools
        if (this.dataServerTools) {
          switch (name) {
            case 'iconect_list_data_servers':
              return { content: [{ type: 'text', text: JSON.stringify(await this.dataServerTools.handleListDataServers(args)) }] };
            case 'iconect_get_data_server':
              return { content: [{ type: 'text', text: JSON.stringify(await this.dataServerTools.handleGetDataServer(args)) }] };
            case 'iconect_create_data_server':
              return { content: [{ type: 'text', text: JSON.stringify(await this.dataServerTools.handleCreateDataServer(args)) }] };
            case 'iconect_update_data_server':
              return { content: [{ type: 'text', text: JSON.stringify(await this.dataServerTools.handleUpdateDataServer(args)) }] };
            case 'iconect_delete_data_server':
              return { content: [{ type: 'text', text: JSON.stringify(await this.dataServerTools.handleDeleteDataServer(args)) }] };
          }
        }

        // Project tools
        if (this.projectTools) {
          switch (name) {
            case 'iconect_list_projects':
              return { content: [{ type: 'text', text: JSON.stringify(await this.projectTools.handleListProjects(args)) }] };
            case 'iconect_get_project':
              return { content: [{ type: 'text', text: JSON.stringify(await this.projectTools.handleGetProject(args)) }] };
            case 'iconect_create_project':
              return { content: [{ type: 'text', text: JSON.stringify(await this.projectTools.handleCreateProject(args)) }] };
            case 'iconect_update_project':
              return { content: [{ type: 'text', text: JSON.stringify(await this.projectTools.handleUpdateProject(args)) }] };
            case 'iconect_delete_project':
              return { content: [{ type: 'text', text: JSON.stringify(await this.projectTools.handleDeleteProject(args)) }] };
          }
        }

        // Client tools
        if (this.clientTools) {
          switch (name) {
            case 'iconect_list_clients':
              return { content: [{ type: 'text', text: JSON.stringify(await this.clientTools.handleListClients(args)) }] };
            case 'iconect_get_client':
              return { content: [{ type: 'text', text: JSON.stringify(await this.clientTools.handleGetClient(args)) }] };
            case 'iconect_create_client':
              return { content: [{ type: 'text', text: JSON.stringify(await this.clientTools.handleCreateClient(args)) }] };
            case 'iconect_update_client':
              return { content: [{ type: 'text', text: JSON.stringify(await this.clientTools.handleUpdateClient(args)) }] };
            case 'iconect_delete_client':
              return { content: [{ type: 'text', text: JSON.stringify(await this.clientTools.handleDeleteClient(args)) }] };
          }
        }

        // File store tools
        if (this.fileStoreTools) {
          switch (name) {
            case 'iconect_list_file_stores':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileStoreTools.handleListFileStores(args)) }] };
            case 'iconect_get_file_store':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileStoreTools.handleGetFileStore(args)) }] };
            case 'iconect_create_file_store':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileStoreTools.handleCreateFileStore(args)) }] };
            case 'iconect_update_file_store':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileStoreTools.handleUpdateFileStore(args)) }] };
            case 'iconect_delete_file_store':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileStoreTools.handleDeleteFileStore(args)) }] };
            case 'iconect_get_file_store_stats':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileStoreTools.handleGetFileStoreStats(args)) }] };
          }
        }

        // File tools
        if (this.fileTools) {
          switch (name) {
            case 'iconect_list_files':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleListFiles(args)) }] };
            case 'iconect_get_file':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleGetFile(args)) }] };
            case 'iconect_upload_file':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleUploadFile(args)) }] };
            case 'iconect_initiate_chunked_upload':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleInitiateChunkedUpload(args)) }] };
            case 'iconect_upload_chunk':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleUploadChunk(args)) }] };
            case 'iconect_complete_chunked_upload':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleCompleteChunkedUpload(args)) }] };
            case 'iconect_get_upload_session':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleGetUploadSession(args)) }] };
            case 'iconect_download_file':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleDownloadFile(args)) }] };
            case 'iconect_delete_file':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fileTools.handleDeleteFile(args)) }] };
          }
        }

        // Record tools
        if (this.recordTools) {
          switch (name) {
            case 'iconect_search_records':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleSearchRecords(args)) }] };
            case 'iconect_get_record':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleGetRecord(args)) }] };
            case 'iconect_create_record':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleCreateRecord(args)) }] };
            case 'iconect_update_record':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleUpdateRecord(args)) }] };
            case 'iconect_delete_record':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleDeleteRecord(args)) }] };
            case 'iconect_bulk_update_records':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleBulkUpdateRecords(args)) }] };
            case 'iconect_create_record_relationship':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleCreateRecordRelationship(args)) }] };
            case 'iconect_get_record_relationships':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleGetRecordRelationships(args)) }] };
            case 'iconect_delete_record_relationship':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleDeleteRecordRelationship(args)) }] };
            case 'iconect_get_bulk_operation_status':
              return { content: [{ type: 'text', text: JSON.stringify(await this.recordTools.handleGetBulkOperationStatus(args)) }] };
          }
        }

        // Field tools
        if (this.fieldTools) {
          switch (name) {
            case 'iconect_list_fields':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleListFields(args)) }] };
            case 'iconect_get_field':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleGetField(args)) }] };
            case 'iconect_create_field':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleCreateField(args)) }] };
            case 'iconect_update_field':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleUpdateField(args)) }] };
            case 'iconect_delete_field':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleDeleteField(args)) }] };
            case 'iconect_validate_field_value':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleValidateFieldValue(args)) }] };
            case 'iconect_get_field_usage':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleGetFieldUsage(args)) }] };
            case 'iconect_duplicate_field':
              return { content: [{ type: 'text', text: JSON.stringify(await this.fieldTools.handleDuplicateField(args)) }] };
          }
        }

        // Folder tools
        if (this.folderTools) {
          switch (name) {
            case 'iconect_list_folders':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleListFolders(args)) }] };
            case 'iconect_get_folder':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleGetFolder(args)) }] };
            case 'iconect_create_folder':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleCreateFolder(args)) }] };
            case 'iconect_update_folder':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleUpdateFolder(args)) }] };
            case 'iconect_delete_folder':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleDeleteFolder(args)) }] };
            case 'iconect_move_folder':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleMoveFolder(args)) }] };
            case 'iconect_copy_folder':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleCopyFolder(args)) }] };
            case 'iconect_get_folder_tree':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleGetFolderTree(args)) }] };
            case 'iconect_get_folder_path':
              return { content: [{ type: 'text', text: JSON.stringify(await this.folderTools.handleGetFolderPath(args)) }] };
          }
        }

        // Job tools
        if (this.jobTools) {
          switch (name) {
            case 'iconect_list_jobs':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleListJobs(args)) }] };
            case 'iconect_get_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleGetJob(args)) }] };
            case 'iconect_create_import_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleCreateImportJob(args)) }] };
            case 'iconect_create_delete_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleCreateDeleteJob(args)) }] };
            case 'iconect_create_custom_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleCreateCustomJob(args)) }] };
            case 'iconect_update_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleUpdateJob(args)) }] };
            case 'iconect_control_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleControlJob(args)) }] };
            case 'iconect_delete_job':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleDeleteJob(args)) }] };
            case 'iconect_get_job_logs':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleGetJobLogs(args)) }] };
            case 'iconect_list_job_queues':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleListJobQueues(args)) }] };
            case 'iconect_get_job_queue':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleGetJobQueue(args)) }] };
            case 'iconect_create_job_queue':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleCreateJobQueue(args)) }] };
            case 'iconect_update_job_queue':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleUpdateJobQueue(args)) }] };
            case 'iconect_delete_job_queue':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleDeleteJobQueue(args)) }] };
            case 'iconect_list_job_templates':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleListJobTemplates(args)) }] };
            case 'iconect_get_job_template':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleGetJobTemplate(args)) }] };
            case 'iconect_create_job_from_template':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleCreateJobFromTemplate(args)) }] };
            case 'iconect_list_job_schedules':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleListJobSchedules(args)) }] };
            case 'iconect_create_job_schedule':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleCreateJobSchedule(args)) }] };
            case 'iconect_update_job_schedule':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleUpdateJobSchedule(args)) }] };
            case 'iconect_delete_job_schedule':
              return { content: [{ type: 'text', text: JSON.stringify(await this.jobTools.handleDeleteJobSchedule(args)) }] };
          }
        }

        throw new IconectError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, error as Error);
        
        if (error instanceof IconectError) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: {
                  code: error.code,
                  message: error.message,
                  statusCode: error.statusCode,
                },
              }),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal error occurred',
              },
            }),
          }],
          isError: true,
        };
      }
    });
  }

  private async handleConfigure(args: Record<string, unknown>): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    try {
      const config = configManager.load(args);
      
      if (args.logLevel && typeof args.logLevel === 'string') {
        const level = LogLevel[args.logLevel as keyof typeof LogLevel];
        if (level !== undefined) {
          logger.setLogLevel(level);
        }
      }

      this.httpClient = new HttpClient(config);
      this.authService = new AuthService(this.httpClient, config);
      this.authTools = new AuthTools(this.authService);
      this.dataServerTools = new DataServerTools(this.httpClient);
      this.projectTools = new ProjectTools(this.httpClient);
      this.clientTools = new ClientTools(this.httpClient);
      this.fileStoreTools = new FileStoreTools(this.httpClient);
      this.fileTools = new FileTools(this.httpClient);
      this.recordTools = new RecordTools(this.httpClient);
      this.fieldTools = new FieldTools(this.httpClient);
      this.folderTools = new FolderTools(this.httpClient);
      this.jobTools = new JobTools(this.httpClient);

      logger.info('Iconect MCP server configured successfully', {
        baseUrl: config.baseUrl,
        clientId: config.clientId,
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Iconect MCP server configured successfully',
            data: {
              baseUrl: config.baseUrl,
              clientId: config.clientId,
              timeout: config.timeout,
            },
          }),
        }],
      };
    } catch (error) {
      logger.error('Configuration failed', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Configuration failed',
        'CONFIGURATION_FAILED'
      );
    }
  }

  private isConfigured(): boolean {
    return configManager.isConfigured() && 
           this.httpClient !== null && 
           this.authService !== null;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Iconect MCP server started');
  }
}

async function main(): Promise<void> {
  const server = new IconectMCPServer();
  await server.run();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Server startup failed', error);
    process.exit(1);
  });
}