# Iconect MCP Server Tutorials

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Workflows](#authentication-workflows)
3. [File Management](#file-management)
4. [Data Processing](#data-processing)
5. [Job Automation](#job-automation)
6. [Building Custom Dashboards](#building-custom-dashboards)
7. [Advanced Workflows](#advanced-workflows)

## Getting Started

### Tutorial 1: Basic Setup and Configuration

This tutorial walks you through the initial setup of the Iconect MCP Server.

#### Step 1: Install the Server

```bash
npm install iconect-mcp-server
```

#### Step 2: Configure the Server

```javascript
// Configure the server with your Iconect instance
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  timeout: 45000,
  logLevel: 'INFO'
});
```

#### Step 3: Authenticate

```javascript
// Authenticate using password grant
const authResult = await callTool('iconect_auth_password', {
  username: 'your-username',
  password: 'your-password'
});

console.log('Authenticated successfully!');
console.log('Access token expires at:', authResult.data.expiresAt);
```

#### Step 4: Verify Configuration

```javascript
// Check authentication status
const status = await callTool('iconect_get_auth_status');
console.log('Is authenticated:', status.data.isAuthenticated);

// List available projects
const projects = await callTool('iconect_list_projects', {
  page: 1,
  pageSize: 10
});
console.log('Available projects:', projects.data.data.length);
```

## Authentication Workflows

### Tutorial 2: OAuth 2.0 Authorization Code Flow

For web applications that need user authorization.

#### Step 1: Generate Authorization URL

```javascript
// Generate authorization URL with PKCE
const authUrlResult = await callTool('iconect_generate_auth_url', {
  redirectUri: 'http://localhost:3000/callback',
  state: 'random-state-string',
  scope: 'read write',
  codeChallenge: 'your-code-challenge'
});

console.log('Direct user to:', authUrlResult.data.authUrl);
```

#### Step 2: Handle Authorization Callback

```javascript
// After user authorizes and is redirected back
const tokenResult = await callTool('iconect_auth_code', {
  code: 'authorization-code-from-url',
  redirectUri: 'http://localhost:3000/callback',
  codeVerifier: 'your-code-verifier'
});

console.log('Authentication successful!');
```

#### Step 3: Refresh Tokens

```javascript
// Refresh token before it expires
const refreshResult = await callTool('iconect_refresh_token', {
  refreshToken: 'your-refresh-token'
});

console.log('New access token obtained');
```

## File Management

### Tutorial 3: Uploading Files

Learn how to upload files of different sizes.

#### Small File Upload (< 5MB)

```javascript
// Read file and convert to base64
const fileContent = fs.readFileSync('document.pdf');
const base64Content = fileContent.toString('base64');

// Upload the file
const uploadResult = await callTool('iconect_upload_file', {
  projectId: 'proj-123',
  fileStoreId: 'store-456',
  fileName: 'document.pdf',
  content: base64Content,
  mimeType: 'application/pdf',
  metadata: {
    description: 'Important document',
    tags: ['contracts', '2024']
  }
});

console.log('File uploaded:', uploadResult.data.id);
```

#### Large File Upload (Chunked)

```javascript
// Step 1: Initiate chunked upload
const fileSize = fs.statSync('large-video.mp4').size;
const sessionResult = await callTool('iconect_initiate_chunked_upload', {
  projectId: 'proj-123',
  fileStoreId: 'store-456',
  fileName: 'large-video.mp4',
  fileSize: fileSize,
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  mimeType: 'video/mp4'
});

const sessionId = sessionResult.data.sessionId;
const chunkSize = sessionResult.data.chunkSize;
const totalChunks = sessionResult.data.totalChunks;

// Step 2: Upload chunks
const fileStream = fs.createReadStream('large-video.mp4', {
  highWaterMark: chunkSize
});

let chunkNumber = 1;
for await (const chunk of fileStream) {
  const base64Chunk = chunk.toString('base64');
  
  await callTool('iconect_upload_chunk', {
    sessionId: sessionId,
    chunkNumber: chunkNumber,
    content: base64Chunk
  });
  
  console.log(`Uploaded chunk ${chunkNumber}/${totalChunks}`);
  chunkNumber++;
}

// Step 3: Complete upload
const completeResult = await callTool('iconect_complete_chunked_upload', {
  sessionId: sessionId,
  metadata: {
    description: 'Training video',
    duration: '45:30'
  }
});

console.log('Large file uploaded:', completeResult.data.id);
```

### Tutorial 4: File Organization

Organize files in folders.

```javascript
// Create a folder structure
const rootFolder = await callTool('iconect_create_folder', {
  name: '2024-Projects',
  description: 'All projects for 2024',
  projectId: 'proj-123'
});

const subFolder = await callTool('iconect_create_folder', {
  name: 'Q1-Reports',
  description: 'First quarter reports',
  projectId: 'proj-123',
  parentId: rootFolder.data.id
});

// Upload file to specific folder
await callTool('iconect_upload_file', {
  projectId: 'proj-123',
  fileStoreId: 'store-456',
  folderId: subFolder.data.id,
  fileName: 'Q1-summary.pdf',
  content: base64Content
});

// Get folder tree
const tree = await callTool('iconect_get_folder_tree', {
  projectId: 'proj-123',
  maxDepth: 3
});
console.log('Folder structure:', JSON.stringify(tree.data, null, 2));
```

## Data Processing

### Tutorial 5: Working with Records

Create, search, and manage records.

#### Creating Records with Custom Fields

```javascript
// First, create custom fields
const emailField = await callTool('iconect_create_field', {
  projectId: 'proj-123',
  name: 'customer_email',
  displayName: 'Customer Email',
  fieldType: 'text',
  dataType: 'string',
  isRequired: true,
  isSearchable: true,
  validationRules: {
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
  }
});

const amountField = await callTool('iconect_create_field', {
  projectId: 'proj-123',
  name: 'invoice_amount',
  displayName: 'Invoice Amount',
  fieldType: 'number',
  dataType: 'decimal',
  isRequired: true,
  validationRules: {
    min: 0,
    max: 1000000
  }
});

// Create a record with custom fields
const record = await callTool('iconect_create_record', {
  projectId: 'proj-123',
  fields: {
    customer_email: 'john.doe@example.com',
    invoice_amount: 1250.50,
    invoice_date: '2024-01-30',
    status: 'pending'
  },
  tags: ['invoice', 'pending-payment'],
  priority: 'high',
  metadata: {
    source: 'web-form',
    ip: '192.168.1.1'
  }
});

console.log('Record created:', record.data.id);
```

#### Advanced Search

```javascript
// Search records with multiple criteria
const searchResults = await callTool('iconect_search_records', {
  projectId: 'proj-123',
  query: 'invoice',
  filters: {
    status: 'pending',
    invoice_amount: { $gt: 1000 }
  },
  dateRange: {
    field: 'invoice_date',
    from: '2024-01-01',
    to: '2024-01-31'
  },
  tags: ['pending-payment'],
  page: 1,
  pageSize: 50,
  sortBy: 'invoice_amount',
  sortOrder: 'desc'
});

console.log(`Found ${searchResults.data.total} records`);
searchResults.data.data.forEach(record => {
  console.log(`- ${record.id}: $${record.fields.invoice_amount}`);
});
```

#### Bulk Operations

```javascript
// Update multiple records at once
const bulkResult = await callTool('iconect_bulk_update_records', {
  action: 'update',
  recordIds: ['rec-1', 'rec-2', 'rec-3'],
  projectId: 'proj-123',
  parameters: {
    fields: {
      status: 'processed',
      processed_date: new Date().toISOString()
    },
    tags: ['processed', 'q1-2024']
  }
});

// Check bulk operation status
const statusResult = await callTool('iconect_get_bulk_operation_status', {
  operationId: bulkResult.data.operationId
});

console.log(`Processed ${statusResult.data.successfulRecords} of ${statusResult.data.totalRecords} records`);
```

## Job Automation

### Tutorial 6: Import Jobs

Automate data imports from various sources.

```javascript
// Create an import job for CSV data
const importJob = await callTool('iconect_create_import_job', {
  name: 'Customer Import - Jan 2024',
  description: 'Monthly customer data import',
  projectId: 'proj-123',
  priority: 'high',
  configuration: {
    source: {
      type: 'file',
      location: 'file-789', // File ID of uploaded CSV
      format: 'csv',
      encoding: 'utf-8'
    },
    mapping: {
      fieldMappings: [
        {
          sourceField: 'Email',
          targetField: 'customer_email'
        },
        {
          sourceField: 'Full Name',
          targetField: 'customer_name'
        },
        {
          sourceField: 'Amount',
          targetField: 'invoice_amount',
          transformation: 'parseFloat'
        }
      ],
      fileStoreId: 'store-456'
    },
    options: {
      skipDuplicates: true,
      validateData: true,
      batchSize: 100,
      continueOnError: true,
      generateReport: true
    }
  }
});

// Start the import job
await callTool('iconect_control_job', {
  id: importJob.data.id,
  action: 'start'
});

// Monitor job progress
let jobStatus;
do {
  jobStatus = await callTool('iconect_get_job', {
    id: importJob.data.id
  });
  
  console.log(`Progress: ${jobStatus.data.progress.percentage}%`);
  console.log(`Processed: ${jobStatus.data.progress.processedItems}/${jobStatus.data.progress.totalItems}`);
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
} while (jobStatus.data.status === 'running');

console.log('Import completed!');
console.log(`Success: ${jobStatus.data.progress.successfulItems}`);
console.log(`Failed: ${jobStatus.data.progress.failedItems}`);
```

### Tutorial 7: Scheduled Jobs

Set up recurring jobs with cron scheduling.

```javascript
// Create a job template
const template = await callTool('iconect_get_job_template', {
  id: 'template-backup-daily'
});

// Create a scheduled job
const schedule = await callTool('iconect_create_job_schedule', {
  name: 'Daily Backup',
  description: 'Backup all records daily at 2 AM',
  jobTemplateId: template.data.id,
  cronExpression: '0 2 * * *', // 2 AM daily
  timezone: 'America/New_York',
  configuration: {
    projectId: 'proj-123',
    includeFiles: true,
    compressionLevel: 'high'
  }
});

console.log('Next run:', schedule.data.nextRun);
```

## Building Custom Dashboards

### Tutorial 8: Creating Interactive Dashboards

Build a custom dashboard with widgets.

```javascript
// Step 1: Create a dashboard
const dashboard = await callTool('iconect_create_dashboard', {
  name: 'sales-dashboard',
  description: 'Real-time sales metrics',
  layout: {
    columns: 12,
    rows: 4,
    widgets: []
  },
  permissions: {
    canView: ['role-sales', 'role-management'],
    canEdit: ['role-management']
  }
});

// Step 2: Add a metric widget
await callTool('iconect_add_widget', {
  dashboardId: dashboard.data.id,
  widget: {
    type: 'metric',
    title: 'Total Revenue',
    position: { x: 0, y: 0, width: 3, height: 1 },
    configuration: {
      dataSource: 'records',
      projectId: 'proj-123',
      aggregation: {
        field: 'invoice_amount',
        function: 'sum'
      },
      format: 'currency',
      refreshInterval: 60 // Refresh every minute
    }
  }
});

// Step 3: Add a chart widget
await callTool('iconect_add_widget', {
  dashboardId: dashboard.data.id,
  widget: {
    type: 'chart',
    title: 'Monthly Sales Trend',
    position: { x: 3, y: 0, width: 9, height: 2 },
    configuration: {
      chartType: 'line',
      dataSource: 'records',
      projectId: 'proj-123',
      xAxis: {
        field: 'invoice_date',
        groupBy: 'month'
      },
      yAxis: {
        field: 'invoice_amount',
        aggregation: 'sum'
      },
      colors: ['#4CAF50'],
      refreshInterval: 300 // Refresh every 5 minutes
    }
  }
});

// Step 4: Add a list widget
await callTool('iconect_add_widget', {
  dashboardId: dashboard.data.id,
  widget: {
    type: 'list',
    title: 'Recent High-Value Invoices',
    position: { x: 0, y: 2, width: 12, height: 2 },
    configuration: {
      dataSource: 'records',
      projectId: 'proj-123',
      filters: {
        invoice_amount: { $gt: 5000 }
      },
      columns: ['customer_name', 'invoice_amount', 'status', 'invoice_date'],
      sortBy: 'invoice_date',
      sortOrder: 'desc',
      limit: 10,
      refreshInterval: 120
    }
  }
});

// Step 5: Share the dashboard
const shareResult = await callTool('iconect_share_dashboard', {
  id: dashboard.data.id,
  shareType: 'token',
  permissions: ['view', 'interact'],
  expiresAt: '2024-12-31T23:59:59Z'
});

console.log('Dashboard URL:', shareResult.data.shareUrl);
```

## Advanced Workflows

### Tutorial 9: Document Processing Pipeline

Build a complete document processing workflow.

```javascript
// Step 1: Create a processing view
const view = await callTool('iconect_create_view', {
  name: 'unprocessed-documents',
  displayName: 'Documents Pending Processing',
  type: 'list',
  projectId: 'proj-123',
  baseQuery: {
    filters: {
      document_type: 'invoice',
      processing_status: 'pending'
    },
    sorting: [
      { field: 'priority', order: 'desc' },
      { field: 'createdDate', order: 'asc' }
    ]
  },
  displayOptions: {
    fields: [
      { fieldId: 'document_name', label: 'Document' },
      { fieldId: 'upload_date', label: 'Uploaded' },
      { fieldId: 'priority', label: 'Priority' }
    ],
    pageSize: 50,
    showFilters: true,
    showExport: true
  }
});

// Step 2: Create a processing job queue
const queue = await callTool('iconect_create_job_queue', {
  name: 'document-processing-queue',
  description: 'Queue for OCR and data extraction',
  projectId: 'proj-123',
  maxConcurrentJobs: 3,
  processingOrder: 'priority',
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 5000,
    backoffMultiplier: 2
  }
});

// Step 3: Process documents from the view
async function processDocuments() {
  // Get documents from view
  const documents = await callTool('iconect_get_view_data', {
    id: view.data.id,
    pageSize: 10
  });

  for (const doc of documents.data.data) {
    // Create processing job for each document
    const job = await callTool('iconect_create_custom_job', {
      name: `Process ${doc.fields.document_name}`,
      type: 'custom',
      projectId: 'proj-123',
      queueId: queue.data.id,
      priority: doc.fields.priority,
      configuration: {
        documentId: doc.id,
        operations: ['ocr', 'extract_data', 'validate', 'store']
      }
    });

    console.log(`Queued job for document ${doc.id}`);
  }
}

// Step 4: Monitor processing results
async function monitorResults() {
  const queueStatus = await callTool('iconect_get_job_queue', {
    id: queue.data.id
  });

  console.log('Queue Statistics:');
  console.log(`- Queued: ${queueStatus.data.statistics.queuedJobs}`);
  console.log(`- Running: ${queueStatus.data.statistics.runningJobs}`);
  console.log(`- Completed: ${queueStatus.data.statistics.completedJobs}`);
  console.log(`- Failed: ${queueStatus.data.statistics.failedJobs}`);
}

// Run the pipeline
await processDocuments();
setInterval(monitorResults, 10000); // Monitor every 10 seconds
```

### Tutorial 10: Custom Theme Creation

Create and apply a custom theme.

```javascript
// Create a custom dark theme
const theme = await callTool('iconect_create_theme', {
  name: 'midnight-blue',
  description: 'Custom dark theme with blue accents',
  type: 'dark',
  colors: {
    primary: '#1976d2',
    secondary: '#424242',
    accent: '#82b1ff',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#333333',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '1.5rem'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px'
  },
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.2)',
    medium: '0 4px 8px rgba(0,0,0,0.3)',
    large: '0 8px 16px rgba(0,0,0,0.4)'
  }
});

// Preview the theme
const preview = await callTool('iconect_preview_theme', {
  themeId: theme.data.id,
  component: 'dashboard'
});

console.log('Preview URL:', preview.data.previewUrl);

// Apply theme to current user
await callTool('iconect_apply_theme', {
  themeId: theme.data.id,
  scope: 'user'
});

// Export theme for sharing
const exported = await callTool('iconect_export_theme', {
  id: theme.data.id,
  format: 'json'
});

fs.writeFileSync('midnight-blue-theme.json', exported.data.content);
console.log('Theme exported to midnight-blue-theme.json');
```

## Best Practices

### Error Handling

Always wrap tool calls in try-catch blocks:

```javascript
try {
  const result = await callTool('iconect_create_record', {
    projectId: 'proj-123',
    fields: { /* ... */ }
  });
  
  if (result.success) {
    console.log('Success:', result.data);
  } else {
    console.error('Failed:', result.error);
  }
} catch (error) {
  console.error('Tool execution error:', error);
}
```

### Pagination

Handle large result sets efficiently:

```javascript
async function getAllRecords(projectId) {
  const records = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await callTool('iconect_list_records', {
      projectId,
      page,
      pageSize: 100
    });

    records.push(...result.data.data);
    hasMore = result.data.hasMore;
    page++;
  }

  return records;
}
```

### Rate Limiting

Implement rate limiting for bulk operations:

```javascript
async function processWithRateLimit(items, processFunc, delayMs = 100) {
  for (const item of items) {
    await processFunc(item);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// Usage
await processWithRateLimit(files, async (file) => {
  await callTool('iconect_upload_file', file);
}, 200); // 200ms delay between uploads
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure credentials are correct
   - Check if token has expired
   - Verify OAuth client configuration

2. **Rate Limiting**
   - Implement exponential backoff
   - Use bulk operations when possible
   - Cache frequently accessed data

3. **Large File Uploads**
   - Always use chunked upload for files > 5MB
   - Monitor upload session expiration
   - Implement resume capability for failed chunks

4. **Performance Issues**
   - Use pagination for large datasets
   - Implement client-side caching
   - Use field selection to reduce payload size

## Next Steps

- Explore the [API Documentation](./API.md) for detailed tool reference
- Check out the [Security Guide](./SECURITY.md) for best practices
- Join the community forum for support and discussions