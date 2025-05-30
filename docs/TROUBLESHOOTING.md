# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Problem: "Authentication failed" error
**Symptoms:**
- `AUTHENTICATION_ERROR` when calling tools
- 401 Unauthorized responses
- Token expired messages

**Solutions:**
1. Verify credentials are correct:
```javascript
// Check configuration
const config = await callTool('iconect_get_auth_status');
console.log('Auth status:', config.data);
```

2. Ensure client secret is provided for password grant:
```javascript
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret' // Required for password grant
});
```

3. Check token expiration and refresh:
```javascript
try {
  await callTool('iconect_refresh_token', {
    refreshToken: 'your-refresh-token'
  });
} catch (error) {
  // Re-authenticate if refresh fails
  await callTool('iconect_auth_password', {
    username: 'your-username',
    password: 'your-password'
  });
}
```

#### Problem: "Server not configured" error
**Symptoms:**
- `NOT_CONFIGURED` error
- Tools not available

**Solution:**
Always configure the server first:
```javascript
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id'
});
```

### Connection Issues

#### Problem: Timeout errors
**Symptoms:**
- `REQUEST_TIMEOUT` errors
- Operations failing after delay

**Solutions:**
1. Increase timeout setting:
```javascript
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id',
  timeout: 60000 // 60 seconds
});
```

2. Check network connectivity:
```bash
# Test API endpoint
curl -I https://api.iconect.com/health
```

3. Use retry logic for transient failures:
```javascript
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

#### Problem: SSL/TLS errors
**Symptoms:**
- Certificate validation errors
- HTTPS connection failures

**Solutions:**
1. Ensure system certificates are up to date
2. Check proxy settings if behind corporate firewall
3. Verify API endpoint URL is correct

### File Upload Issues

#### Problem: Large file upload fails
**Symptoms:**
- Timeout during upload
- "File too large" errors
- Memory errors

**Solution:**
Use chunked upload for files > 5MB:
```javascript
// Check file size first
const fileSize = Buffer.byteLength(content, 'base64');

if (fileSize > 5 * 1024 * 1024) {
  // Use chunked upload
  const session = await callTool('iconect_initiate_chunked_upload', {
    projectId: 'proj-123',
    fileStoreId: 'store-456',
    fileName: 'large-file.pdf',
    fileSize: fileSize
  });
  
  // Upload chunks...
} else {
  // Use simple upload
  await callTool('iconect_upload_file', {
    projectId: 'proj-123',
    fileStoreId: 'store-456',
    fileName: 'small-file.pdf',
    content: base64Content
  });
}
```

#### Problem: Invalid file content
**Symptoms:**
- "Invalid base64 content" errors
- Corrupted file uploads

**Solution:**
Ensure proper base64 encoding:
```javascript
// Correct base64 encoding
const fs = require('fs');
const content = fs.readFileSync('file.pdf');
const base64Content = content.toString('base64');

// Verify encoding
try {
  Buffer.from(base64Content, 'base64');
  console.log('Valid base64 content');
} catch (error) {
  console.error('Invalid base64 encoding');
}
```

### Data Query Issues

#### Problem: Query returns no results
**Symptoms:**
- Empty result sets
- Filters not working

**Solutions:**
1. Verify filter syntax:
```javascript
// Correct filter syntax
const results = await callTool('iconect_search_records', {
  projectId: 'proj-123',
  filters: {
    status: 'active', // Exact match
    amount: { $gt: 100 }, // Greater than
    tags: { $in: ['important', 'urgent'] } // In array
  }
});
```

2. Check field names match exactly:
```javascript
// List available fields first
const fields = await callTool('iconect_list_fields', {
  projectId: 'proj-123'
});
console.log('Available fields:', fields.data.data.map(f => f.name));
```

3. Remove filters to test base query:
```javascript
// Start with no filters
const allRecords = await callTool('iconect_list_records', {
  projectId: 'proj-123'
});
console.log('Total records:', allRecords.data.total);
```

#### Problem: Performance issues with large datasets
**Symptoms:**
- Slow response times
- Memory errors
- Timeouts

**Solution:**
Use pagination and streaming:
```javascript
// Process records in batches
async function* streamAllRecords(projectId) {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await callTool('iconect_list_records', {
      projectId,
      page,
      pageSize: 100
    });
    
    yield* batch.data.data;
    hasMore = batch.data.hasMore;
    page++;
  }
}

// Process without loading all into memory
for await (const record of streamAllRecords('proj-123')) {
  await processRecord(record);
}
```

### Job Execution Issues

#### Problem: Jobs stuck in pending state
**Symptoms:**
- Job status remains "pending"
- Jobs not starting

**Solutions:**
1. Check job queue status:
```javascript
const queue = await callTool('iconect_get_job_queue', {
  id: 'queue-123'
});
console.log('Queue status:', queue.data.statistics);
```

2. Verify queue is active:
```javascript
if (!queue.data.isActive) {
  await callTool('iconect_update_job_queue', {
    id: 'queue-123',
    isActive: true
  });
}
```

3. Start job manually:
```javascript
await callTool('iconect_control_job', {
  id: 'job-456',
  action: 'start'
});
```

#### Problem: Import job failing
**Symptoms:**
- High failure rate
- Validation errors

**Solution:**
Enable detailed error logging:
```javascript
const importJob = await callTool('iconect_create_import_job', {
  name: 'Data Import',
  projectId: 'proj-123',
  configuration: {
    // ... source and mapping config
    options: {
      validateData: true,
      continueOnError: true, // Don't stop on first error
      generateReport: true, // Get detailed error report
      batchSize: 50 // Smaller batches for debugging
    }
  }
});

// Check job logs after completion
const logs = await callTool('iconect_get_job_logs', {
  jobId: importJob.data.id,
  level: 'error'
});
```

### UI Component Issues

#### Problem: Dashboard widgets not updating
**Symptoms:**
- Stale data in widgets
- Refresh not working

**Solutions:**
1. Check widget refresh settings:
```javascript
await callTool('iconect_update_widget', {
  dashboardId: 'dash-123',
  widgetId: 'widget-456',
  refreshInterval: 60 // Refresh every minute
});
```

2. Manually refresh widget:
```javascript
await callTool('iconect_refresh_widget', {
  dashboardId: 'dash-123',
  widgetId: 'widget-456'
});
```

3. Verify data source:
```javascript
const widgetData = await callTool('iconect_get_widget_data', {
  dashboardId: 'dash-123',
  widgetId: 'widget-456'
});
console.log('Widget data:', widgetData.data);
```

## Debugging Techniques

### Enable Debug Logging

```javascript
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id',
  logLevel: 'DEBUG' // Enable verbose logging
});
```

### Trace API Calls

```javascript
// Wrapper to log all tool calls
async function debugTool(toolName, params) {
  console.log(`Calling ${toolName} with params:`, JSON.stringify(params, null, 2));
  
  try {
    const result = await callTool(toolName, params);
    console.log(`${toolName} succeeded:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`${toolName} failed:`, error);
    throw error;
  }
}
```

### Check Rate Limits

```javascript
// Monitor rate limit headers
class RateLimitMonitor {
  checkHeaders(response) {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    
    if (remaining && parseInt(remaining) < 10) {
      console.warn(`Low rate limit: ${remaining} requests remaining`);
      console.warn(`Reset at: ${new Date(parseInt(reset) * 1000)}`);
    }
  }
}
```

## Error Code Reference

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `NOT_CONFIGURED` | Server not configured | Missing iconect_configure call |
| `AUTHENTICATION_ERROR` | Auth failed | Invalid credentials, expired token |
| `AUTHORIZATION_ERROR` | Access denied | Insufficient permissions |
| `VALIDATION_ERROR` | Invalid input | Missing required fields, wrong types |
| `NOT_FOUND` | Resource not found | Invalid ID, deleted resource |
| `RATE_LIMIT_ERROR` | Too many requests | Exceeded API rate limits |
| `REQUEST_TIMEOUT` | Request timed out | Network issues, large payload |
| `SERVER_ERROR` | Internal error | API server issues |

## Getting Help

### Log Collection

When reporting issues, collect:
1. Error messages and stack traces
2. Tool names and parameters used
3. Server configuration (without secrets)
4. Timestamp of the issue
5. Any relevant context

### Support Channels

- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Community Forum: https://community.iconect.com
- API Status: https://status.iconect.com

### Diagnostic Script

```javascript
// Run this to collect diagnostic information
async function collectDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    authStatus: null,
    serverConfig: null,
    connectivity: null,
    lastError: null
  };

  try {
    diagnostics.authStatus = await callTool('iconect_get_auth_status');
  } catch (error) {
    diagnostics.authStatus = { error: error.message };
  }

  try {
    diagnostics.connectivity = await callTool('iconect_list_projects', {
      pageSize: 1
    });
    diagnostics.connectivity = 'OK';
  } catch (error) {
    diagnostics.connectivity = { error: error.message };
  }

  console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));
  return diagnostics;
}
```