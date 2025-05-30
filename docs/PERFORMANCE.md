# Performance Optimization Guide

## Overview

This guide provides best practices and optimization techniques for maximizing the performance of the Iconect MCP Server in production environments.

## Table of Contents

1. [Connection Pooling](#connection-pooling)
2. [Caching Strategies](#caching-strategies)
3. [Request Optimization](#request-optimization)
4. [Batch Operations](#batch-operations)
5. [File Upload Optimization](#file-upload-optimization)
6. [Query Optimization](#query-optimization)
7. [Resource Management](#resource-management)
8. [Monitoring and Metrics](#monitoring-and-metrics)

## Connection Pooling

The MCP server implements connection pooling to reuse HTTP connections efficiently.

### Configuration

```javascript
// Optimal connection pool settings
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  // Connection pool settings (internal)
  poolSize: 10,          // Max concurrent connections
  keepAlive: true,       // Keep connections alive
  keepAliveTimeout: 60000 // Keep-alive timeout
});
```

### Best Practices

1. **Reuse Server Instance**: Create a single server instance and reuse it
2. **Monitor Connection Usage**: Track active connections to avoid pool exhaustion
3. **Adjust Pool Size**: Based on your workload patterns

## Caching Strategies

### Token Caching

The server automatically caches authentication tokens to minimize auth requests:

```javascript
// Tokens are cached until 5 minutes before expiration
// No manual intervention needed
const status = await callTool('iconect_get_auth_status');
// Uses cached token if valid
```

### Data Caching

Implement client-side caching for frequently accessed data:

```javascript
class DataCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetchFunc) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fetchFunc();
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    });
    return data;
  }

  invalidate(key) {
    this.cache.delete(key);
  }
}

// Usage
const cache = new DataCache();
const projects = await cache.get('projects', async () => {
  return await callTool('iconect_list_projects', { pageSize: 100 });
});
```

### Query Result Caching

Cache complex query results:

```javascript
const queryCache = new Map();

async function searchRecordsWithCache(params) {
  const cacheKey = JSON.stringify(params);
  
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (cached.timestamp > Date.now() - 60000) { // 1 minute cache
      return cached.data;
    }
  }

  const result = await callTool('iconect_search_records', params);
  queryCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}
```

## Request Optimization

### Field Selection

Only request fields you need:

```javascript
// Bad - requests all fields
const records = await callTool('iconect_list_records', {
  projectId: 'proj-123'
});

// Good - requests only needed fields
const records = await callTool('iconect_list_records', {
  projectId: 'proj-123',
  fields: ['id', 'name', 'status', 'createdDate']
});
```

### Pagination

Use appropriate page sizes:

```javascript
// For listing operations
const optimalPageSize = 50; // Balance between requests and payload

// For bulk processing
const bulkPageSize = 100; // Maximum allowed

async function* getAllRecords(projectId) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await callTool('iconect_list_records', {
      projectId,
      page,
      pageSize: bulkPageSize
    });

    yield* result.data.data;
    hasMore = result.data.hasMore;
    page++;
  }
}
```

### Parallel Requests

Execute independent requests in parallel:

```javascript
// Bad - sequential requests
const projects = await callTool('iconect_list_projects');
const users = await callTool('iconect_list_users');
const templates = await callTool('iconect_list_templates');

// Good - parallel requests
const [projects, users, templates] = await Promise.all([
  callTool('iconect_list_projects'),
  callTool('iconect_list_users'),
  callTool('iconect_list_templates')
]);
```

## Batch Operations

### Bulk Record Operations

Use bulk operations instead of individual updates:

```javascript
// Bad - individual updates
for (const recordId of recordIds) {
  await callTool('iconect_update_record', {
    id: recordId,
    fields: { status: 'processed' }
  });
}

// Good - bulk update
await callTool('iconect_bulk_update_records', {
  action: 'update',
  recordIds: recordIds,
  projectId: 'proj-123',
  parameters: {
    fields: { status: 'processed' }
  }
});
```

### Batch Processing Pattern

```javascript
async function processBatch(items, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
    
    // Rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

## File Upload Optimization

### Chunked Upload for Large Files

```javascript
class OptimizedUploader {
  constructor(chunkSize = 5 * 1024 * 1024) { // 5MB default
    this.chunkSize = chunkSize;
    this.maxConcurrent = 3; // Upload 3 chunks in parallel
  }

  async uploadLargeFile(fileData) {
    // Initiate session
    const session = await callTool('iconect_initiate_chunked_upload', {
      projectId: fileData.projectId,
      fileStoreId: fileData.fileStoreId,
      fileName: fileData.fileName,
      fileSize: fileData.size,
      chunkSize: this.chunkSize
    });

    // Upload chunks in parallel batches
    const chunks = this.createChunks(fileData.content);
    const totalChunks = chunks.length;
    
    for (let i = 0; i < totalChunks; i += this.maxConcurrent) {
      const batch = chunks.slice(i, i + this.maxConcurrent);
      const promises = batch.map((chunk, index) => 
        this.uploadChunk(session.data.sessionId, i + index + 1, chunk)
      );
      
      await Promise.all(promises);
      
      console.log(`Uploaded ${Math.min(i + this.maxConcurrent, totalChunks)}/${totalChunks} chunks`);
    }

    // Complete upload
    return await callTool('iconect_complete_chunked_upload', {
      sessionId: session.data.sessionId
    });
  }

  createChunks(content) {
    const chunks = [];
    for (let i = 0; i < content.length; i += this.chunkSize) {
      chunks.push(content.slice(i, i + this.chunkSize));
    }
    return chunks;
  }

  async uploadChunk(sessionId, chunkNumber, content) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await callTool('iconect_upload_chunk', {
          sessionId,
          chunkNumber,
          content: Buffer.from(content).toString('base64')
        });
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  }
}
```

### Compression

Compress files before upload when appropriate:

```javascript
const zlib = require('zlib');

async function uploadCompressed(fileData) {
  // Compress if beneficial
  if (fileData.size > 1024 * 1024 && isCompressible(fileData.mimeType)) {
    const compressed = await new Promise((resolve, reject) => {
      zlib.gzip(fileData.content, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return await callTool('iconect_upload_file', {
      ...fileData,
      content: compressed.toString('base64'),
      metadata: {
        ...fileData.metadata,
        originalSize: fileData.size,
        compressed: true,
        compressionType: 'gzip'
      }
    });
  }

  return await callTool('iconect_upload_file', fileData);
}

function isCompressible(mimeType) {
  const compressibleTypes = [
    'text/', 'application/json', 'application/xml',
    'application/javascript', 'image/svg+xml'
  ];
  return compressibleTypes.some(type => mimeType.startsWith(type));
}
```

## Query Optimization

### Efficient Filtering

```javascript
// Use indexed fields for filtering
const efficientSearch = await callTool('iconect_search_records', {
  projectId: 'proj-123',
  filters: {
    // Good - likely indexed
    status: 'active',
    createdDate: { $gte: '2024-01-01' },
    
    // Avoid complex queries on non-indexed fields
    // customField: { $regex: 'complex.*pattern' }
  },
  // Limit fields returned
  fields: ['id', 'name', 'status']
});
```

### Aggregation Optimization

```javascript
// Pre-aggregate data when possible
const aggregatedView = await callTool('iconect_create_view', {
  name: 'sales-summary',
  type: 'list',
  projectId: 'proj-123',
  baseQuery: {
    aggregations: [
      {
        field: 'invoice_amount',
        function: 'sum',
        alias: 'total_sales'
      },
      {
        field: 'id',
        function: 'count',
        alias: 'invoice_count'
      }
    ],
    grouping: ['customer_id', 'month']
  }
});

// Use the pre-aggregated view
const summary = await callTool('iconect_get_view_data', {
  id: aggregatedView.data.id
});
```

## Resource Management

### Memory Management

```javascript
// Stream large datasets
async function* streamRecords(projectId) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await callTool('iconect_list_records', {
      projectId,
      page,
      pageSize: 100
    });

    // Process and release each page
    for (const record of result.data.data) {
      yield record;
    }

    hasMore = result.data.hasMore;
    page++;

    // Force garbage collection for large datasets
    if (global.gc && page % 10 === 0) {
      global.gc();
    }
  }
}

// Usage
for await (const record of streamRecords('proj-123')) {
  await processRecord(record);
  // Record is released after processing
}
```

### Connection Cleanup

```javascript
// Implement graceful shutdown
class ManagedServer {
  constructor() {
    this.activeRequests = new Set();
  }

  async callToolManaged(toolName, params) {
    const requestId = Date.now();
    this.activeRequests.add(requestId);

    try {
      return await callTool(toolName, params);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  async shutdown() {
    // Wait for active requests
    while (this.activeRequests.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cleanup
    await callTool('iconect_logout');
  }
}
```

## Monitoring and Metrics

### Performance Tracking

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  async trackOperation(name, operation) {
    const start = Date.now();
    let success = true;
    let error = null;

    try {
      const result = await operation();
      return result;
    } catch (e) {
      success = false;
      error = e;
      throw e;
    } finally {
      const duration = Date.now() - start;
      this.recordMetric(name, duration, success, error);
    }
  }

  recordMetric(name, duration, success, error) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalDuration: 0,
        errors: 0,
        maxDuration: 0,
        minDuration: Infinity
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.totalDuration += duration;
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.minDuration = Math.min(metric.minDuration, duration);
    if (!success) metric.errors++;
  }

  getReport() {
    const report = {};
    for (const [name, metric] of this.metrics) {
      report[name] = {
        count: metric.count,
        avgDuration: metric.totalDuration / metric.count,
        maxDuration: metric.maxDuration,
        minDuration: metric.minDuration,
        errorRate: metric.errors / metric.count
      };
    }
    return report;
  }
}

// Usage
const monitor = new PerformanceMonitor();

const records = await monitor.trackOperation('list_records', async () => {
  return await callTool('iconect_list_records', { projectId: 'proj-123' });
});

// Get performance report
console.log(monitor.getReport());
```

### Resource Usage Monitoring

```javascript
function monitorResourceUsage() {
  const usage = process.memoryUsage();
  console.log({
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`
  });
}

// Monitor every 30 seconds
setInterval(monitorResourceUsage, 30000);
```

## Optimization Checklist

### Before Production

- [ ] Configure appropriate timeout values
- [ ] Set up connection pooling
- [ ] Implement caching strategy
- [ ] Enable compression for file uploads
- [ ] Set up monitoring and alerting
- [ ] Test with production-scale data
- [ ] Implement graceful shutdown
- [ ] Configure rate limiting

### Performance Targets

- API response time: < 200ms for simple queries
- Bulk operations: > 100 records/second
- File uploads: > 10MB/second
- Memory usage: < 512MB for typical workloads
- Connection pool utilization: < 80%

### Common Bottlenecks

1. **Excessive API Calls**: Use batch operations and caching
2. **Large Payloads**: Implement pagination and field selection
3. **Sequential Processing**: Use parallel processing where possible
4. **Memory Leaks**: Implement proper cleanup and streaming
5. **Network Latency**: Use connection pooling and compression