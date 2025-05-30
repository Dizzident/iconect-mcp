import { z } from 'zod';

export const IconectConfigSchema = z.object({
  baseUrl: z.string().url(),
  clientId: z.string(),
  clientSecret: z.string().optional(),
  timeout: z.number().default(30000),
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000),
});

export type IconectConfig = z.infer<typeof IconectConfigSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: string;
  scope?: string;
}

export const DataServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  version: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
});

export type DataServer = z.infer<typeof DataServerSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  clientId: z.string(),
  dataServerId: z.string(),
  status: z.enum(['active', 'inactive', 'archived']),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  settings: z.record(z.unknown()).optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  settings: z.record(z.unknown()).optional(),
});

export type Client = z.infer<typeof ClientSchema>;

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

export const FileStoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  path: z.string(),
  type: z.enum(['local', 's3', 'azure', 'gcp']),
  status: z.enum(['active', 'inactive', 'maintenance']),
  capacity: z.number().optional(),
  usedSpace: z.number().optional(),
  settings: z.record(z.unknown()).optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
});

export type FileStore = z.infer<typeof FileStoreSchema>;

export const FileSchema = z.object({
  id: z.string(),
  name: z.string(),
  originalName: z.string(),
  path: z.string(),
  size: z.number(),
  mimeType: z.string(),
  hash: z.string().optional(),
  projectId: z.string(),
  fileStoreId: z.string(),
  folderId: z.string().optional(),
  status: z.enum(['uploading', 'processing', 'available', 'error', 'deleted']),
  metadata: z.record(z.unknown()).optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  uploadedBy: z.string(),
});

export type File = z.infer<typeof FileSchema>;

export const UploadSessionSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  chunkSize: z.number(),
  totalChunks: z.number(),
  uploadedChunks: z.array(z.number()),
  status: z.enum(['active', 'completed', 'failed', 'expired']),
  expiresAt: z.string().datetime(),
  createdDate: z.string().datetime(),
});

export type UploadSession = z.infer<typeof UploadSessionSchema>;

export interface FileUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  currentChunk?: number;
  totalChunks?: number;
}

export interface FileDownloadOptions {
  range?: {
    start: number;
    end: number;
  };
  responseType?: 'stream' | 'buffer' | 'base64';
}

export const FieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  fieldType: z.enum(['text', 'number', 'date', 'boolean', 'choice', 'multiChoice', 'file', 'user', 'lookup']),
  dataType: z.enum(['string', 'integer', 'decimal', 'datetime', 'boolean']),
  isRequired: z.boolean().default(false),
  isSystemField: z.boolean().default(false),
  isSearchable: z.boolean().default(true),
  maxLength: z.number().optional(),
  defaultValue: z.unknown().optional(),
  choices: z.array(z.object({
    value: z.string(),
    label: z.string(),
    isDefault: z.boolean().default(false),
  })).optional(),
  validationRules: z.record(z.unknown()).optional(),
  projectId: z.string(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type Field = z.infer<typeof FieldSchema>;

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  path: z.string(),
  parentId: z.string().optional(),
  projectId: z.string(),
  level: z.number(),
  isSystem: z.boolean().default(false),
  permissions: z.object({
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canCreateSubfolders: z.boolean().default(false),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type Folder = z.infer<typeof FolderSchema>;

export const RecordSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  projectId: z.string(),
  folderId: z.string().optional(),
  status: z.enum(['active', 'deleted', 'archived', 'processing']),
  fields: z.record(z.unknown()),
  fileIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  assignedTo: z.string().optional(),
  reviewStatus: z.enum(['pending', 'in_review', 'approved', 'rejected']).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type Record = z.infer<typeof RecordSchema>;

export interface SearchCriteria {
  query?: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  dateRange?: {
    field: string;
    from?: string;
    to?: string;
  };
  tags?: string[];
  status?: string[];
  assignedTo?: string[];
  folderId?: string;
}

export interface BulkOperation {
  action: 'update' | 'delete' | 'move' | 'tag' | 'assign';
  recordIds: string[];
  parameters?: Record<string, unknown>;
}

export interface BulkOperationResult {
  operationId: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    recordId: string;
    error: string;
  }>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export const RecordRelationshipSchema = z.object({
  id: z.string(),
  sourceRecordId: z.string(),
  targetRecordId: z.string(),
  relationshipType: z.enum(['parent', 'child', 'related', 'duplicate', 'reference']),
  description: z.string().optional(),
  createdDate: z.string().datetime(),
  createdBy: z.string(),
});

export type RecordRelationship = z.infer<typeof RecordRelationshipSchema>;

export const JobSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['import', 'export', 'delete', 'move', 'transform', 'backup', 'sync', 'custom']),
  status: z.enum(['pending', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled']),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  projectId: z.string(),
  createdBy: z.string(),
  assignedTo: z.string().optional(),
  scheduledStart: z.string().datetime().optional(),
  actualStart: z.string().datetime().optional(),
  estimatedEnd: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  progress: z.object({
    totalItems: z.number(),
    processedItems: z.number(),
    successfulItems: z.number(),
    failedItems: z.number(),
    skippedItems: z.number(),
    percentage: z.number().min(0).max(100),
    currentOperation: z.string().optional(),
    estimatedTimeRemaining: z.number().optional(),
  }),
  configuration: z.record(z.unknown()),
  results: z.object({
    summary: z.string().optional(),
    artifacts: z.array(z.object({
      type: z.enum(['log', 'report', 'data', 'error']),
      name: z.string(),
      url: z.string().optional(),
      size: z.number().optional(),
    })).optional(),
    errors: z.array(z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
      timestamp: z.string().datetime(),
    })).optional(),
    warnings: z.array(z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
      timestamp: z.string().datetime(),
    })).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  modifiedBy: z.string(),
});

export type Job = z.infer<typeof JobSchema>;

export const JobQueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string(),
  maxConcurrentJobs: z.number().min(1).default(1),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  isActive: z.boolean().default(true),
  processingOrder: z.enum(['fifo', 'lifo', 'priority', 'scheduled']).default('fifo'),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).default(3),
    retryDelay: z.number().min(0).default(5000),
    backoffMultiplier: z.number().min(1).default(2),
  }).optional(),
  statistics: z.object({
    totalJobs: z.number(),
    queuedJobs: z.number(),
    runningJobs: z.number(),
    completedJobs: z.number(),
    failedJobs: z.number(),
    averageProcessingTime: z.number().optional(),
  }).optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
});

export type JobQueue = z.infer<typeof JobQueueSchema>;

export const ImportJobConfigSchema = z.object({
  source: z.object({
    type: z.enum(['file', 'database', 'api', 'folder']),
    location: z.string(),
    credentials: z.record(z.unknown()).optional(),
    format: z.enum(['csv', 'xlsx', 'json', 'xml', 'pdf', 'tiff', 'msg', 'eml']).optional(),
    encoding: z.string().default('utf-8'),
  }),
  mapping: z.object({
    fieldMappings: z.array(z.object({
      sourceField: z.string(),
      targetField: z.string(),
      transformation: z.string().optional(),
      defaultValue: z.unknown().optional(),
    })),
    folderMapping: z.string().optional(),
    fileStoreId: z.string(),
  }),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    validateData: z.boolean().default(true),
    createMissingFields: z.boolean().default(false),
    batchSize: z.number().min(1).max(1000).default(100),
    continueOnError: z.boolean().default(true),
    generateReport: z.boolean().default(true),
  }),
});

export type ImportJobConfig = z.infer<typeof ImportJobConfigSchema>;

export const DeleteJobConfigSchema = z.object({
  criteria: z.object({
    recordIds: z.array(z.string()).optional(),
    searchCriteria: z.object({
      query: z.string().optional(),
      filters: z.record(z.unknown()).optional(),
      dateRange: z.object({
        field: z.string(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      }).optional(),
      folderId: z.string().optional(),
    }).optional(),
  }),
  options: z.object({
    permanentDelete: z.boolean().default(false),
    deleteFiles: z.boolean().default(false),
    moveToFolder: z.string().optional(),
    batchSize: z.number().min(1).max(1000).default(100),
    generateReport: z.boolean().default(true),
    requireConfirmation: z.boolean().default(true),
  }),
});

export type DeleteJobConfig = z.infer<typeof DeleteJobConfigSchema>;

export interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  type: Job['type'];
  defaultConfiguration: Record<string, unknown>;
  requiredParameters: string[];
  optionalParameters: string[];
  projectId?: string;
  isSystem: boolean;
  createdDate: string;
  modifiedDate: string;
}

export interface JobSchedule {
  id: string;
  jobId?: string;
  jobTemplateId?: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextRun?: string;
  lastRun?: string;
  configuration: Record<string, unknown>;
  createdDate: string;
  modifiedDate: string;
}

export const PanelSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  type: z.enum(['grid', 'form', 'chart', 'report', 'dashboard', 'custom']),
  projectId: z.string(),
  folderId: z.string().optional(),
  layout: z.object({
    columns: z.array(z.object({
      id: z.string(),
      name: z.string(),
      fieldId: z.string().optional(),
      width: z.number().optional(),
      sortable: z.boolean().default(true),
      filterable: z.boolean().default(true),
      visible: z.boolean().default(true),
      alignment: z.enum(['left', 'center', 'right']).default('left'),
      format: z.string().optional(),
    })),
    pagination: z.object({
      enabled: z.boolean().default(true),
      pageSize: z.number().min(1).max(1000).default(25),
      pageSizeOptions: z.array(z.number()).optional(),
    }).optional(),
    sorting: z.object({
      defaultSort: z.string().optional(),
      defaultOrder: z.enum(['asc', 'desc']).default('asc'),
      multiSort: z.boolean().default(false),
    }).optional(),
    filtering: z.object({
      enabled: z.boolean().default(true),
      quickSearch: z.boolean().default(true),
      advancedFilters: z.boolean().default(false),
    }).optional(),
  }),
  configuration: z.object({
    theme: z.string().optional(),
    responsive: z.boolean().default(true),
    exportOptions: z.array(z.enum(['csv', 'xlsx', 'pdf', 'json'])).optional(),
    refreshInterval: z.number().min(0).optional(),
    cacheTimeout: z.number().min(0).optional(),
  }).optional(),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canDelete: z.array(z.string()).optional(),
    canExport: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type Panel = z.infer<typeof PanelSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  type: z.enum(['document', 'email', 'report', 'form', 'workflow', 'notification']),
  category: z.string().optional(),
  projectId: z.string().optional(),
  content: z.object({
    format: z.enum(['html', 'markdown', 'text', 'json', 'xml']),
    template: z.string(),
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
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  version: z.string().default('1.0'),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const ViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  type: z.enum(['list', 'grid', 'card', 'timeline', 'calendar', 'chart', 'map', 'custom']),
  projectId: z.string(),
  baseQuery: z.object({
    filters: z.record(z.unknown()).optional(),
    sorting: z.array(z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    })).optional(),
    grouping: z.array(z.string()).optional(),
    aggregations: z.array(z.object({
      field: z.string(),
      function: z.enum(['count', 'sum', 'avg', 'min', 'max']),
      alias: z.string().optional(),
    })).optional(),
  }),
  displayOptions: z.object({
    fields: z.array(z.object({
      fieldId: z.string(),
      label: z.string().optional(),
      visible: z.boolean().default(true),
      width: z.number().optional(),
      format: z.string().optional(),
      alignment: z.enum(['left', 'center', 'right']).default('left'),
    })),
    pageSize: z.number().min(1).max(1000).default(25),
    showFilters: z.boolean().default(true),
    showSearch: z.boolean().default(true),
    showExport: z.boolean().default(true),
    theme: z.string().optional(),
    customCss: z.string().optional(),
  }),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canDelete: z.array(z.string()).optional(),
    canShare: z.array(z.string()).optional(),
  }).optional(),
  sharing: z.object({
    isPublic: z.boolean().default(false),
    shareToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    allowAnonymous: z.boolean().default(false),
  }).optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type View = z.infer<typeof ViewSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  avatar: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en-US'),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    language: z.string().default('en'),
    dateFormat: z.string().default('MM/dd/yyyy'),
    timeFormat: z.enum(['12h', '24h']).default('12h'),
    defaultPageSize: z.number().min(10).max(100).default(25),
    notifications: z.object({
      email: z.boolean().default(true),
      browser: z.boolean().default(true),
      mobile: z.boolean().default(false),
    }).optional(),
  }).optional(),
  lastLoginDate: z.string().datetime().optional(),
  passwordChangedDate: z.string().datetime().optional(),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const DashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  layout: z.object({
    columns: z.number().min(1).max(12).default(12),
    rows: z.number().min(1).optional(),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.enum(['chart', 'metric', 'list', 'map', 'calendar', 'custom']),
      title: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      configuration: z.record(z.unknown()),
      refreshInterval: z.number().min(0).optional(),
    })),
  }),
  permissions: z.object({
    canView: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canShare: z.array(z.string()).optional(),
  }).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
  createdBy: z.string(),
  modifiedBy: z.string(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['light', 'dark', 'custom']),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textSecondary: z.string(),
    border: z.string(),
    success: z.string(),
    warning: z.string(),
    error: z.string(),
    info: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.object({
      small: z.string(),
      medium: z.string(),
      large: z.string(),
      xlarge: z.string(),
    }),
    fontWeight: z.object({
      light: z.number(),
      normal: z.number(),
      medium: z.number(),
      bold: z.number(),
    }),
  }).optional(),
  spacing: z.object({
    xs: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }).optional(),
  borderRadius: z.object({
    small: z.string(),
    medium: z.string(),
    large: z.string(),
  }).optional(),
  shadows: z.object({
    small: z.string(),
    medium: z.string(),
    large: z.string(),
  }).optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdDate: z.string().datetime(),
  modifiedDate: z.string().datetime(),
});

export type Theme = z.infer<typeof ThemeSchema>;