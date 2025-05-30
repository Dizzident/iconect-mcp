import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { Job, JobSchema, JobQueue, JobQueueSchema, ImportJobConfig, ImportJobConfigSchema, DeleteJobConfig, DeleteJobConfigSchema, JobTemplate, JobSchedule, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { IconectError } from '../utils/errors.js';

export const ListJobsSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['import', 'export', 'delete', 'move', 'transform', 'backup', 'sync', 'custom']).optional(),
  status: z.enum(['pending', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
  dateRange: z.object({
    field: z.enum(['createdDate', 'scheduledStart', 'actualStart', 'actualEnd']),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetJobSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
  includeProgress: z.boolean().default(true),
  includeResults: z.boolean().default(true),
  includeLogs: z.boolean().default(false),
});

export const CreateImportJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  scheduledStart: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  configuration: ImportJobConfigSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const CreateDeleteJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  scheduledStart: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  configuration: DeleteJobConfigSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const CreateCustomJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  description: z.string().optional(),
  type: z.enum(['export', 'move', 'transform', 'backup', 'sync', 'custom']),
  projectId: z.string().min(1, 'Project ID is required'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  scheduledStart: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  configuration: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateJobSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  scheduledStart: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  configuration: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ControlJobSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
  action: z.enum(['start', 'pause', 'resume', 'cancel', 'restart']),
  reason: z.string().optional(),
});

export const GetJobLogsSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(1000).optional(),
});

export const ListJobQueuesSchema = z.object({
  projectId: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export const CreateJobQueueSchema = z.object({
  name: z.string().min(1, 'Queue name is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  maxConcurrentJobs: z.number().min(1).default(1),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  processingOrder: z.enum(['fifo', 'lifo', 'priority', 'scheduled']).default('fifo'),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).default(3),
    retryDelay: z.number().min(0).default(5000),
    backoffMultiplier: z.number().min(1).default(2),
  }).optional(),
});

export const UpdateJobQueueSchema = z.object({
  id: z.string().min(1, 'Queue ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  maxConcurrentJobs: z.number().min(1).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  isActive: z.boolean().optional(),
  processingOrder: z.enum(['fifo', 'lifo', 'priority', 'scheduled']).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0),
    retryDelay: z.number().min(0),
    backoffMultiplier: z.number().min(1),
  }).optional(),
});

export const ListJobTemplatesSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['import', 'export', 'delete', 'move', 'transform', 'backup', 'sync', 'custom']).optional(),
  isSystem: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export const CreateJobFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Job name is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  parameters: z.record(z.unknown()),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  scheduledStart: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
});

export const ListJobSchedulesSchema = z.object({
  projectId: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export const CreateJobScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  jobTemplateId: z.string().optional(),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  timezone: z.string().default('UTC'),
  configuration: z.record(z.unknown()),
  isActive: z.boolean().default(true),
});

export class JobTools {
  constructor(private httpClient: HttpClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'iconect_list_jobs',
        description: 'List jobs with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            type: {
              type: 'string',
              enum: ['import', 'export', 'delete', 'move', 'transform', 'backup', 'sync', 'custom'],
              description: 'Filter by job type',
            },
            status: {
              type: 'string',
              enum: ['pending', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled'],
              description: 'Filter by job status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Filter by job priority',
            },
            assignedTo: {
              type: 'string',
              description: 'Filter by assigned user ID',
            },
            createdBy: {
              type: 'string',
              description: 'Filter by creator user ID',
            },
            dateRange: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  enum: ['createdDate', 'scheduledStart', 'actualStart', 'actualEnd'],
                  description: 'Date field to filter on',
                },
                from: { type: 'string', description: 'Start date (ISO format)' },
                to: { type: 'string', description: 'End date (ISO format)' },
              },
              description: 'Date range filter',
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
              description: 'Field to sort by',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order (default: desc)',
            },
          },
        },
      },
      {
        name: 'iconect_get_job',
        description: 'Get detailed information about a specific job',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Job ID',
            },
            includeProgress: {
              type: 'boolean',
              description: 'Include progress information (default: true)',
            },
            includeResults: {
              type: 'boolean',
              description: 'Include job results (default: true)',
            },
            includeLogs: {
              type: 'boolean',
              description: 'Include recent logs (default: false)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_import_job',
        description: 'Create a new import job',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Job name',
            },
            description: {
              type: 'string',
              description: 'Job description',
            },
            projectId: {
              type: 'string',
              description: 'Target project ID',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Job priority (default: normal)',
            },
            scheduledStart: {
              type: 'string',
              description: 'Scheduled start time (ISO format)',
            },
            assignedTo: {
              type: 'string',
              description: 'User ID to assign job to',
            },
            configuration: {
              type: 'object',
              properties: {
                source: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['file', 'database', 'api', 'folder'] },
                    location: { type: 'string' },
                    credentials: { type: 'object' },
                    format: { type: 'string', enum: ['csv', 'xlsx', 'json', 'xml', 'pdf', 'tiff', 'msg', 'eml'] },
                    encoding: { type: 'string', default: 'utf-8' },
                  },
                  required: ['type', 'location'],
                },
                mapping: {
                  type: 'object',
                  properties: {
                    fieldMappings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          sourceField: { type: 'string' },
                          targetField: { type: 'string' },
                          transformation: { type: 'string' },
                          defaultValue: {},
                        },
                        required: ['sourceField', 'targetField'],
                      },
                    },
                    folderMapping: { type: 'string' },
                    fileStoreId: { type: 'string' },
                  },
                  required: ['fieldMappings', 'fileStoreId'],
                },
                options: {
                  type: 'object',
                  properties: {
                    skipDuplicates: { type: 'boolean', default: true },
                    validateData: { type: 'boolean', default: true },
                    createMissingFields: { type: 'boolean', default: false },
                    batchSize: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
                    continueOnError: { type: 'boolean', default: true },
                    generateReport: { type: 'boolean', default: true },
                  },
                },
              },
              required: ['source', 'mapping'],
            },
            metadata: {
              type: 'object',
              description: 'Additional job metadata',
            },
          },
          required: ['name', 'projectId', 'configuration'],
        },
      },
      {
        name: 'iconect_create_delete_job',
        description: 'Create a new delete job',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Job name',
            },
            description: {
              type: 'string',
              description: 'Job description',
            },
            projectId: {
              type: 'string',
              description: 'Target project ID',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Job priority (default: normal)',
            },
            scheduledStart: {
              type: 'string',
              description: 'Scheduled start time (ISO format)',
            },
            assignedTo: {
              type: 'string',
              description: 'User ID to assign job to',
            },
            configuration: {
              type: 'object',
              properties: {
                criteria: {
                  type: 'object',
                  properties: {
                    recordIds: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Specific record IDs to delete',
                    },
                    searchCriteria: {
                      type: 'object',
                      properties: {
                        query: { type: 'string' },
                        filters: { type: 'object' },
                        dateRange: {
                          type: 'object',
                          properties: {
                            field: { type: 'string' },
                            from: { type: 'string' },
                            to: { type: 'string' },
                          },
                        },
                        folderId: { type: 'string' },
                      },
                    },
                  },
                },
                options: {
                  type: 'object',
                  properties: {
                    permanentDelete: { type: 'boolean', default: false },
                    deleteFiles: { type: 'boolean', default: false },
                    moveToFolder: { type: 'string' },
                    batchSize: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
                    generateReport: { type: 'boolean', default: true },
                    requireConfirmation: { type: 'boolean', default: true },
                  },
                },
              },
              required: ['criteria'],
            },
            metadata: {
              type: 'object',
              description: 'Additional job metadata',
            },
          },
          required: ['name', 'projectId', 'configuration'],
        },
      },
      {
        name: 'iconect_create_custom_job',
        description: 'Create a custom job with flexible configuration',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Job name',
            },
            description: {
              type: 'string',
              description: 'Job description',
            },
            type: {
              type: 'string',
              enum: ['export', 'move', 'transform', 'backup', 'sync', 'custom'],
              description: 'Job type',
            },
            projectId: {
              type: 'string',
              description: 'Target project ID',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Job priority (default: normal)',
            },
            scheduledStart: {
              type: 'string',
              description: 'Scheduled start time (ISO format)',
            },
            assignedTo: {
              type: 'string',
              description: 'User ID to assign job to',
            },
            configuration: {
              type: 'object',
              description: 'Job-specific configuration',
            },
            metadata: {
              type: 'object',
              description: 'Additional job metadata',
            },
          },
          required: ['name', 'type', 'projectId', 'configuration'],
        },
      },
      {
        name: 'iconect_update_job',
        description: 'Update an existing job (only if not running)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Job ID',
            },
            name: {
              type: 'string',
              description: 'Updated job name',
            },
            description: {
              type: 'string',
              description: 'Updated job description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Updated job priority',
            },
            scheduledStart: {
              type: 'string',
              description: 'Updated scheduled start time (ISO format)',
            },
            assignedTo: {
              type: 'string',
              description: 'Updated assigned user ID',
            },
            configuration: {
              type: 'object',
              description: 'Updated job configuration',
            },
            metadata: {
              type: 'object',
              description: 'Updated job metadata',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_control_job',
        description: 'Control job execution (start, pause, resume, cancel, restart)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Job ID',
            },
            action: {
              type: 'string',
              enum: ['start', 'pause', 'resume', 'cancel', 'restart'],
              description: 'Control action to perform',
            },
            reason: {
              type: 'string',
              description: 'Optional reason for the action',
            },
          },
          required: ['id', 'action'],
        },
      },
      {
        name: 'iconect_delete_job',
        description: 'Delete a job (only if not running)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Job ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_get_job_logs',
        description: 'Get job execution logs',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Job ID',
            },
            level: {
              type: 'string',
              enum: ['debug', 'info', 'warn', 'error'],
              description: 'Minimum log level to retrieve',
            },
            startTime: {
              type: 'string',
              description: 'Start time for log retrieval (ISO format)',
            },
            endTime: {
              type: 'string',
              description: 'End time for log retrieval (ISO format)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
              minimum: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of log entries per page (default: 100, max: 1000)',
              minimum: 1,
              maximum: 1000,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_list_job_queues',
        description: 'List job queues with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
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
          },
        },
      },
      {
        name: 'iconect_get_job_queue',
        description: 'Get detailed information about a job queue',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Queue ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_create_job_queue',
        description: 'Create a new job queue',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Queue name',
            },
            description: {
              type: 'string',
              description: 'Queue description',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            maxConcurrentJobs: {
              type: 'number',
              description: 'Maximum concurrent jobs (default: 1)',
              minimum: 1,
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high'],
              description: 'Queue priority (default: normal)',
            },
            processingOrder: {
              type: 'string',
              enum: ['fifo', 'lifo', 'priority', 'scheduled'],
              description: 'Job processing order (default: fifo)',
            },
            retryPolicy: {
              type: 'object',
              properties: {
                maxRetries: { type: 'number', minimum: 0, default: 3 },
                retryDelay: { type: 'number', minimum: 0, default: 5000 },
                backoffMultiplier: { type: 'number', minimum: 1, default: 2 },
              },
              description: 'Retry policy for failed jobs',
            },
          },
          required: ['name', 'projectId'],
        },
      },
      {
        name: 'iconect_update_job_queue',
        description: 'Update an existing job queue',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Queue ID',
            },
            name: {
              type: 'string',
              description: 'Updated queue name',
            },
            description: {
              type: 'string',
              description: 'Updated queue description',
            },
            maxConcurrentJobs: {
              type: 'number',
              description: 'Updated maximum concurrent jobs',
              minimum: 1,
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high'],
              description: 'Updated queue priority',
            },
            isActive: {
              type: 'boolean',
              description: 'Updated active status',
            },
            processingOrder: {
              type: 'string',
              enum: ['fifo', 'lifo', 'priority', 'scheduled'],
              description: 'Updated job processing order',
            },
            retryPolicy: {
              type: 'object',
              properties: {
                maxRetries: { type: 'number', minimum: 0 },
                retryDelay: { type: 'number', minimum: 0 },
                backoffMultiplier: { type: 'number', minimum: 1 },
              },
              description: 'Updated retry policy',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_delete_job_queue',
        description: 'Delete a job queue (only if empty)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Queue ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'iconect_list_job_templates',
        description: 'List available job templates',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            type: {
              type: 'string',
              enum: ['import', 'export', 'delete', 'move', 'transform', 'backup', 'sync', 'custom'],
              description: 'Filter by job type',
            },
            isSystem: {
              type: 'boolean',
              description: 'Filter by system template status',
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
          },
        },
      },
      {
        name: 'iconect_get_job_template',
        description: 'Get detailed information about a job template',
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
        name: 'iconect_create_job_from_template',
        description: 'Create a new job from a template',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              description: 'Template ID',
            },
            name: {
              type: 'string',
              description: 'Job name',
            },
            projectId: {
              type: 'string',
              description: 'Target project ID',
            },
            parameters: {
              type: 'object',
              description: 'Template parameters',
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'critical'],
              description: 'Job priority (default: normal)',
            },
            scheduledStart: {
              type: 'string',
              description: 'Scheduled start time (ISO format)',
            },
            assignedTo: {
              type: 'string',
              description: 'User ID to assign job to',
            },
          },
          required: ['templateId', 'name', 'projectId', 'parameters'],
        },
      },
      {
        name: 'iconect_list_job_schedules',
        description: 'List job schedules',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
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
          },
        },
      },
      {
        name: 'iconect_create_job_schedule',
        description: 'Create a new job schedule',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Schedule name',
            },
            description: {
              type: 'string',
              description: 'Schedule description',
            },
            jobTemplateId: {
              type: 'string',
              description: 'Job template ID to schedule',
            },
            cronExpression: {
              type: 'string',
              description: 'Cron expression for scheduling',
            },
            timezone: {
              type: 'string',
              description: 'Timezone for schedule (default: UTC)',
            },
            configuration: {
              type: 'object',
              description: 'Job configuration parameters',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether schedule is active (default: true)',
            },
          },
          required: ['name', 'cronExpression', 'configuration'],
        },
      },
      {
        name: 'iconect_update_job_schedule',
        description: 'Update an existing job schedule',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Schedule ID',
            },
            name: {
              type: 'string',
              description: 'Updated schedule name',
            },
            description: {
              type: 'string',
              description: 'Updated schedule description',
            },
            cronExpression: {
              type: 'string',
              description: 'Updated cron expression',
            },
            timezone: {
              type: 'string',
              description: 'Updated timezone',
            },
            configuration: {
              type: 'object',
              description: 'Updated job configuration',
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
        name: 'iconect_delete_job_schedule',
        description: 'Delete a job schedule',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Schedule ID',
            },
          },
          required: ['id'],
        },
      },
    ];
  }

  async handleListJobs(args: unknown): Promise<unknown> {
    try {
      const options = ListJobsSchema.parse(args);
      logger.info('Listing jobs', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.type) queryParams.append('type', options.type);
      if (options.status) queryParams.append('status', options.status);
      if (options.priority) queryParams.append('priority', options.priority);
      if (options.assignedTo) queryParams.append('assignedTo', options.assignedTo);
      if (options.createdBy) queryParams.append('createdBy', options.createdBy);
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      if (options.dateRange) {
        queryParams.append('dateRange.field', options.dateRange.field);
        if (options.dateRange.from) queryParams.append('dateRange.from', options.dateRange.from);
        if (options.dateRange.to) queryParams.append('dateRange.to', options.dateRange.to);
      }

      const url = `/jobs?${queryParams.toString()}`;
      const response = await this.httpClient.get<PaginatedResponse<Job>>(url);

      return {
        success: true,
        message: 'Jobs retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list jobs', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list jobs',
        'LIST_JOBS_FAILED'
      );
    }
  }

  async handleGetJob(args: unknown): Promise<unknown> {
    try {
      const { id, includeProgress, includeResults, includeLogs } = GetJobSchema.parse(args);
      logger.info('Getting job', { id, includeProgress, includeResults, includeLogs });

      const queryParams = new URLSearchParams();
      if (includeProgress) queryParams.append('includeProgress', 'true');
      if (includeResults) queryParams.append('includeResults', 'true');
      if (includeLogs) queryParams.append('includeLogs', 'true');

      const url = `/jobs/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<Job>(url);
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: 'Job retrieved successfully',
        data: job,
      };
    } catch (error) {
      logger.error('Failed to get job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get job',
        'GET_JOB_FAILED'
      );
    }
  }

  async handleCreateImportJob(args: unknown): Promise<unknown> {
    try {
      const jobData = CreateImportJobSchema.parse(args);
      logger.info('Creating import job', { name: jobData.name, projectId: jobData.projectId });

      const response = await this.httpClient.post<Job>('/jobs/import', jobData);
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: 'Import job created successfully',
        data: job,
      };
    } catch (error) {
      logger.error('Failed to create import job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create import job',
        'CREATE_IMPORT_JOB_FAILED'
      );
    }
  }

  async handleCreateDeleteJob(args: unknown): Promise<unknown> {
    try {
      const jobData = CreateDeleteJobSchema.parse(args);
      logger.info('Creating delete job', { name: jobData.name, projectId: jobData.projectId });

      const response = await this.httpClient.post<Job>('/jobs/delete', jobData);
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: 'Delete job created successfully',
        data: job,
      };
    } catch (error) {
      logger.error('Failed to create delete job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create delete job',
        'CREATE_DELETE_JOB_FAILED'
      );
    }
  }

  async handleCreateCustomJob(args: unknown): Promise<unknown> {
    try {
      const jobData = CreateCustomJobSchema.parse(args);
      logger.info('Creating custom job', { name: jobData.name, type: jobData.type, projectId: jobData.projectId });

      const response = await this.httpClient.post<Job>('/jobs/custom', jobData);
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: 'Custom job created successfully',
        data: job,
      };
    } catch (error) {
      logger.error('Failed to create custom job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create custom job',
        'CREATE_CUSTOM_JOB_FAILED'
      );
    }
  }

  async handleUpdateJob(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateJobSchema.parse(args);
      logger.info('Updating job', { id });

      const response = await this.httpClient.put<Job>(`/jobs/${id}`, updateData);
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: 'Job updated successfully',
        data: job,
      };
    } catch (error) {
      logger.error('Failed to update job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update job',
        'UPDATE_JOB_FAILED'
      );
    }
  }

  async handleControlJob(args: unknown): Promise<unknown> {
    try {
      const { id, action, reason } = ControlJobSchema.parse(args);
      logger.info('Controlling job', { id, action, reason });

      const response = await this.httpClient.post<Job>(`/jobs/${id}/control`, { action, reason });
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: `Job ${action} operation completed successfully`,
        data: job,
      };
    } catch (error) {
      logger.error('Failed to control job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to control job',
        'CONTROL_JOB_FAILED'
      );
    }
  }

  async handleDeleteJob(args: unknown): Promise<unknown> {
    try {
      const { id } = z.object({ id: z.string() }).parse(args);
      logger.info('Deleting job', { id });

      await this.httpClient.delete(`/jobs/${id}`);

      return {
        success: true,
        message: 'Job deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete job', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete job',
        'DELETE_JOB_FAILED'
      );
    }
  }

  async handleGetJobLogs(args: unknown): Promise<unknown> {
    try {
      const options = GetJobLogsSchema.parse(args);
      logger.info('Getting job logs', { jobId: options.id });

      const queryParams = new URLSearchParams();
      if (options.level) queryParams.append('level', options.level);
      if (options.startTime) queryParams.append('startTime', options.startTime);
      if (options.endTime) queryParams.append('endTime', options.endTime);
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());

      const url = `/jobs/${options.id}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<{
        timestamp: string;
        level: string;
        message: string;
        context?: Record<string, unknown>;
      }>>(url);

      return {
        success: true,
        message: 'Job logs retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get job logs', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get job logs',
        'GET_JOB_LOGS_FAILED'
      );
    }
  }

  async handleListJobQueues(args: unknown): Promise<unknown> {
    try {
      const options = ListJobQueuesSchema.parse(args);
      logger.info('Listing job queues', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());

      const url = `/jobs/queues${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<JobQueue>>(url);

      return {
        success: true,
        message: 'Job queues retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list job queues', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list job queues',
        'LIST_JOB_QUEUES_FAILED'
      );
    }
  }

  async handleGetJobQueue(args: unknown): Promise<unknown> {
    try {
      const { id } = z.object({ id: z.string() }).parse(args);
      logger.info('Getting job queue', { id });

      const response = await this.httpClient.get<JobQueue>(`/jobs/queues/${id}`);
      const queue = JobQueueSchema.parse(response);

      return {
        success: true,
        message: 'Job queue retrieved successfully',
        data: queue,
      };
    } catch (error) {
      logger.error('Failed to get job queue', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get job queue',
        'GET_JOB_QUEUE_FAILED'
      );
    }
  }

  async handleCreateJobQueue(args: unknown): Promise<unknown> {
    try {
      const queueData = CreateJobQueueSchema.parse(args);
      logger.info('Creating job queue', { name: queueData.name, projectId: queueData.projectId });

      const response = await this.httpClient.post<JobQueue>('/jobs/queues', queueData);
      const queue = JobQueueSchema.parse(response);

      return {
        success: true,
        message: 'Job queue created successfully',
        data: queue,
      };
    } catch (error) {
      logger.error('Failed to create job queue', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create job queue',
        'CREATE_JOB_QUEUE_FAILED'
      );
    }
  }

  async handleUpdateJobQueue(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = UpdateJobQueueSchema.parse(args);
      logger.info('Updating job queue', { id });

      const response = await this.httpClient.put<JobQueue>(`/jobs/queues/${id}`, updateData);
      const queue = JobQueueSchema.parse(response);

      return {
        success: true,
        message: 'Job queue updated successfully',
        data: queue,
      };
    } catch (error) {
      logger.error('Failed to update job queue', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update job queue',
        'UPDATE_JOB_QUEUE_FAILED'
      );
    }
  }

  async handleDeleteJobQueue(args: unknown): Promise<unknown> {
    try {
      const { id } = z.object({ id: z.string() }).parse(args);
      logger.info('Deleting job queue', { id });

      await this.httpClient.delete(`/jobs/queues/${id}`);

      return {
        success: true,
        message: 'Job queue deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete job queue', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete job queue',
        'DELETE_JOB_QUEUE_FAILED'
      );
    }
  }

  async handleListJobTemplates(args: unknown): Promise<unknown> {
    try {
      const options = ListJobTemplatesSchema.parse(args);
      logger.info('Listing job templates', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.type) queryParams.append('type', options.type);
      if (options.isSystem !== undefined) queryParams.append('isSystem', options.isSystem.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());

      const url = `/jobs/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<JobTemplate>>(url);

      return {
        success: true,
        message: 'Job templates retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list job templates', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list job templates',
        'LIST_JOB_TEMPLATES_FAILED'
      );
    }
  }

  async handleGetJobTemplate(args: unknown): Promise<unknown> {
    try {
      const { id } = z.object({ id: z.string() }).parse(args);
      logger.info('Getting job template', { id });

      const response = await this.httpClient.get<JobTemplate>(`/jobs/templates/${id}`);

      return {
        success: true,
        message: 'Job template retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to get job template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to get job template',
        'GET_JOB_TEMPLATE_FAILED'
      );
    }
  }

  async handleCreateJobFromTemplate(args: unknown): Promise<unknown> {
    try {
      const jobData = CreateJobFromTemplateSchema.parse(args);
      logger.info('Creating job from template', { templateId: jobData.templateId, name: jobData.name });

      const response = await this.httpClient.post<Job>('/jobs/from-template', jobData);
      const job = JobSchema.parse(response);

      return {
        success: true,
        message: 'Job created from template successfully',
        data: job,
      };
    } catch (error) {
      logger.error('Failed to create job from template', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create job from template',
        'CREATE_JOB_FROM_TEMPLATE_FAILED'
      );
    }
  }

  async handleListJobSchedules(args: unknown): Promise<unknown> {
    try {
      const options = ListJobSchedulesSchema.parse(args);
      logger.info('Listing job schedules', { options });

      const queryParams = new URLSearchParams();
      if (options.projectId) queryParams.append('projectId', options.projectId);
      if (options.isActive !== undefined) queryParams.append('isActive', options.isActive.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());

      const url = `/jobs/schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.httpClient.get<PaginatedResponse<JobSchedule>>(url);

      return {
        success: true,
        message: 'Job schedules retrieved successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to list job schedules', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to list job schedules',
        'LIST_JOB_SCHEDULES_FAILED'
      );
    }
  }

  async handleCreateJobSchedule(args: unknown): Promise<unknown> {
    try {
      const scheduleData = CreateJobScheduleSchema.parse(args);
      logger.info('Creating job schedule', { name: scheduleData.name });

      const response = await this.httpClient.post<JobSchedule>('/jobs/schedules', scheduleData);

      return {
        success: true,
        message: 'Job schedule created successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to create job schedule', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to create job schedule',
        'CREATE_JOB_SCHEDULE_FAILED'
      );
    }
  }

  async handleUpdateJobSchedule(args: unknown): Promise<unknown> {
    try {
      const { id, ...updateData } = z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        cronExpression: z.string().optional(),
        timezone: z.string().optional(),
        configuration: z.record(z.unknown()).optional(),
        isActive: z.boolean().optional(),
      }).parse(args);
      logger.info('Updating job schedule', { id });

      const response = await this.httpClient.put<JobSchedule>(`/jobs/schedules/${id}`, updateData);

      return {
        success: true,
        message: 'Job schedule updated successfully',
        data: response,
      };
    } catch (error) {
      logger.error('Failed to update job schedule', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to update job schedule',
        'UPDATE_JOB_SCHEDULE_FAILED'
      );
    }
  }

  async handleDeleteJobSchedule(args: unknown): Promise<unknown> {
    try {
      const { id } = z.object({ id: z.string() }).parse(args);
      logger.info('Deleting job schedule', { id });

      await this.httpClient.delete(`/jobs/schedules/${id}`);

      return {
        success: true,
        message: 'Job schedule deleted successfully',
        data: { id },
      };
    } catch (error) {
      logger.error('Failed to delete job schedule', error as Error);
      throw new IconectError(
        error instanceof Error ? error.message : 'Failed to delete job schedule',
        'DELETE_JOB_SCHEDULE_FAILED'
      );
    }
  }
}