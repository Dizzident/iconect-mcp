# Iconect MCP Server API Documentation

## Overview

The Iconect MCP Server provides a comprehensive Model Context Protocol (MCP) interface to the Iconect REST API v0.11.0. This documentation covers all available tools, their parameters, and usage examples.

## Table of Contents

1. [Authentication & Configuration](#authentication--configuration)
2. [Core Resources](#core-resources)
3. [File Operations](#file-operations)
4. [Data Management](#data-management)
5. [Job Management](#job-management)
6. [UI Components](#ui-components)
7. [Error Handling](#error-handling)

## Authentication & Configuration

### iconect_configure

Configure the Iconect MCP server with connection details.

**Parameters:**
- `baseUrl` (string, required): Iconect API base URL
- `clientId` (string, required): OAuth client ID
- `clientSecret` (string, optional): OAuth client secret
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `logLevel` (string, optional): Log level - DEBUG, INFO, WARN, ERROR (default: INFO)

**Example:**
```json
{
  "baseUrl": "https://api.iconect.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "timeout": 45000,
  "logLevel": "INFO"
}
```

### iconect_auth_password

Authenticate using username and password (OAuth 2.0 password grant).

**Parameters:**
- `username` (string, required): User's username
- `password` (string, required): User's password

**Returns:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresAt": "2024-01-30T10:00:00Z",
    "hasRefreshToken": true
  }
}
```

### iconect_auth_code

Authenticate using OAuth 2.0 authorization code flow with PKCE.

**Parameters:**
- `code` (string, required): Authorization code
- `redirectUri` (string, required): Redirect URI used in authorization
- `codeVerifier` (string, optional): PKCE code verifier

### iconect_refresh_token

Refresh an access token using a refresh token.

**Parameters:**
- `refreshToken` (string, required): Refresh token

### iconect_generate_auth_url

Generate an OAuth 2.0 authorization URL.

**Parameters:**
- `redirectUri` (string, required): Redirect URI for authorization callback
- `state` (string, optional): State parameter for CSRF protection
- `scope` (string, optional): Requested scopes
- `codeChallenge` (string, optional): PKCE code challenge

**Returns:**
```json
{
  "success": true,
  "message": "Authorization URL generated",
  "data": {
    "authUrl": "https://api.iconect.com/oauth/authorize?client_id=..."
  }
}
```

### iconect_logout

Clear authentication tokens and logout.

**Parameters:** None

### iconect_get_auth_status

Get current authentication status.

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "message": "Authentication status retrieved",
  "data": {
    "isAuthenticated": true,
    "tokenType": "Bearer",
    "expiresAt": "2024-01-30T10:00:00Z",
    "scope": "read write"
  }
}
```

## Core Resources

### Data Servers

#### iconect_list_data_servers

List all data servers with optional filtering and pagination.

**Parameters:**
- `status` (string, optional): Filter by status - active, inactive, maintenance
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Field to sort by
- `sortOrder` (string, optional): Sort order - asc, desc

#### iconect_get_data_server

Get a specific data server by ID.

**Parameters:**
- `id` (string, required): Data server ID

#### iconect_create_data_server

Create a new data server.

**Parameters:**
- `name` (string, required): Data server name
- `description` (string, optional): Description
- `url` (string, required): Server URL
- `version` (string, optional): Server version
- `status` (string, optional): Status - active, inactive, maintenance

#### iconect_update_data_server

Update an existing data server.

**Parameters:**
- `id` (string, required): Data server ID
- `name` (string, optional): Updated name
- `description` (string, optional): Updated description
- `url` (string, optional): Updated URL
- `status` (string, optional): Updated status

#### iconect_delete_data_server

Delete a data server.

**Parameters:**
- `id` (string, required): Data server ID

### Projects

#### iconect_list_projects

List all projects with filtering and pagination.

**Parameters:**
- `clientId` (string, optional): Filter by client ID
- `dataServerId` (string, optional): Filter by data server ID
- `status` (string, optional): Filter by status - active, inactive, archived
- `page` (number, optional): Page number
- `pageSize` (number, optional): Items per page
- `sortBy` (string, optional): Sort field
- `sortOrder` (string, optional): Sort order

#### iconect_get_project

Get a specific project.

**Parameters:**
- `id` (string, required): Project ID

#### iconect_create_project

Create a new project.

**Parameters:**
- `name` (string, required): Project name
- `description` (string, optional): Description
- `clientId` (string, required): Client ID
- `dataServerId` (string, required): Data server ID
- `status` (string, optional): Status
- `settings` (object, optional): Project settings

#### iconect_update_project

Update an existing project.

**Parameters:**
- `id` (string, required): Project ID
- All create parameters as optional

#### iconect_delete_project

Delete a project.

**Parameters:**
- `id` (string, required): Project ID

### Clients

Similar CRUD operations available for clients:
- `iconect_list_clients`
- `iconect_get_client`
- `iconect_create_client`
- `iconect_update_client`
- `iconect_delete_client`

## File Operations

### File Stores

#### iconect_list_file_stores

List all file stores.

**Parameters:**
- `type` (string, optional): Filter by type - local, s3, azure, gcp
- `status` (string, optional): Filter by status
- Pagination parameters

#### iconect_get_file_store_stats

Get storage statistics for a file store.

**Parameters:**
- `id` (string, required): File store ID

**Returns:**
```json
{
  "success": true,
  "data": {
    "totalCapacity": 1099511627776,
    "usedSpace": 549755813888,
    "availableSpace": 549755813888,
    "fileCount": 125430,
    "averageFileSize": 4378234
  }
}
```

### Files

#### iconect_upload_file

Upload a single file (for files < 5MB).

**Parameters:**
- `projectId` (string, required): Project ID
- `fileStoreId` (string, required): File store ID
- `folderId` (string, optional): Target folder ID
- `fileName` (string, required): File name
- `content` (string, required): Base64 encoded file content
- `mimeType` (string, optional): MIME type
- `metadata` (object, optional): File metadata

#### iconect_initiate_chunked_upload

Start a chunked upload session for large files.

**Parameters:**
- `projectId` (string, required): Project ID
- `fileStoreId` (string, required): File store ID
- `fileName` (string, required): File name
- `fileSize` (number, required): Total file size in bytes
- `chunkSize` (number, optional): Chunk size (default: 5MB)
- `mimeType` (string, optional): MIME type

**Returns:**
```json
{
  "success": true,
  "data": {
    "sessionId": "upload-session-123",
    "chunkSize": 5242880,
    "totalChunks": 20,
    "expiresAt": "2024-01-30T12:00:00Z"
  }
}
```

#### iconect_upload_chunk

Upload a file chunk.

**Parameters:**
- `sessionId` (string, required): Upload session ID
- `chunkNumber` (number, required): Chunk number (1-based)
- `content` (string, required): Base64 encoded chunk content

#### iconect_complete_chunked_upload

Complete a chunked upload session.

**Parameters:**
- `sessionId` (string, required): Upload session ID
- `metadata` (object, optional): File metadata

#### iconect_download_file

Download a file.

**Parameters:**
- `id` (string, required): File ID
- `responseType` (string, optional): Response type - base64, buffer, stream

## Data Management

### Records

#### iconect_search_records

Advanced search for records with filtering.

**Parameters:**
- `projectId` (string, required): Project ID
- `query` (string, optional): Search query
- `fields` (array, optional): Fields to search in
- `filters` (object, optional): Field filters
- `dateRange` (object, optional): Date range filter
  - `field` (string): Date field name
  - `from` (string): Start date
  - `to` (string): End date
- `tags` (array, optional): Filter by tags
- `status` (array, optional): Filter by status
- `assignedTo` (array, optional): Filter by assigned users
- `folderId` (string, optional): Filter by folder
- Pagination parameters

**Example:**
```json
{
  "projectId": "proj-123",
  "query": "invoice",
  "filters": {
    "status": "pending",
    "amount": { "$gt": 1000 }
  },
  "dateRange": {
    "field": "createdDate",
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "page": 1,
  "pageSize": 50
}
```

#### iconect_create_record

Create a new record.

**Parameters:**
- `projectId` (string, required): Project ID
- `folderId` (string, optional): Folder ID
- `fields` (object, required): Record field values
- `fileIds` (array, optional): Attached file IDs
- `tags` (array, optional): Record tags
- `priority` (string, optional): Priority - low, normal, high, critical
- `assignedTo` (string, optional): Assigned user ID
- `metadata` (object, optional): Additional metadata

#### iconect_bulk_update_records

Perform bulk operations on multiple records.

**Parameters:**
- `action` (string, required): Action - update, delete, move, tag, assign
- `recordIds` (array, required): Record IDs to update
- `projectId` (string, required): Project ID
- `parameters` (object, optional): Action-specific parameters

### Fields

#### iconect_create_field

Create a custom field.

**Parameters:**
- `projectId` (string, required): Project ID
- `name` (string, required): Field internal name
- `displayName` (string, required): Display name
- `description` (string, optional): Description
- `fieldType` (string, required): Type - text, number, date, boolean, choice, multiChoice, file, user, lookup
- `dataType` (string, required): Data type - string, integer, decimal, datetime, boolean
- `isRequired` (boolean, optional): Required field
- `isSearchable` (boolean, optional): Searchable field
- `maxLength` (number, optional): Max length for text fields
- `defaultValue` (any, optional): Default value
- `choices` (array, optional): Choice options for choice fields
- `validationRules` (object, optional): Validation rules

#### iconect_validate_field_value

Validate a field value against field rules.

**Parameters:**
- `fieldId` (string, required): Field ID
- `value` (any, required): Value to validate

### Folders

#### iconect_get_folder_tree

Get complete folder hierarchy.

**Parameters:**
- `projectId` (string, required): Project ID
- `rootFolderId` (string, optional): Start from specific folder
- `maxDepth` (number, optional): Maximum depth to traverse

**Returns nested folder structure with subfolders.**

## Job Management

### Jobs

#### iconect_create_import_job

Create an import job with field mapping.

**Parameters:**
- `name` (string, required): Job name
- `description` (string, optional): Description
- `projectId` (string, required): Project ID
- `priority` (string, optional): Priority level
- `configuration` (object, required):
  - `source` (object, required): Source configuration
    - `type` (string): Source type - file, database, api, folder
    - `location` (string): Source location
    - `format` (string): Format - csv, xlsx, json, xml, pdf, tiff, msg, eml
  - `mapping` (object, required): Field mapping
    - `fieldMappings` (array): Field mapping rules
    - `fileStoreId` (string): Target file store
  - `options` (object, optional): Import options
    - `skipDuplicates` (boolean): Skip duplicate records
    - `validateData` (boolean): Validate data before import
    - `batchSize` (number): Batch size

#### iconect_control_job

Control job execution.

**Parameters:**
- `id` (string, required): Job ID
- `action` (string, required): Action - start, pause, resume, cancel, restart

### Job Queues

#### iconect_create_job_queue

Create a job queue with processing rules.

**Parameters:**
- `name` (string, required): Queue name
- `description` (string, optional): Description
- `projectId` (string, required): Project ID
- `maxConcurrentJobs` (number, optional): Max concurrent jobs (default: 1)
- `priority` (string, optional): Queue priority - low, normal, high
- `processingOrder` (string, optional): Order - fifo, lifo, priority, scheduled
- `retryPolicy` (object, optional): Retry configuration
  - `maxRetries` (number): Maximum retries
  - `retryDelay` (number): Delay between retries
  - `backoffMultiplier` (number): Backoff multiplier

## UI Components

### Panels

#### iconect_create_panel

Create a new panel with layout configuration.

**Parameters:**
- `name` (string, required): Panel name
- `displayName` (string, required): Display name
- `type` (string, required): Type - grid, form, chart, report, dashboard, custom
- `projectId` (string, required): Project ID
- `layout` (object, required): Layout configuration
  - `columns` (array, required): Column definitions
  - `pagination` (object, optional): Pagination settings
  - `sorting` (object, optional): Sorting configuration
  - `filtering` (object, optional): Filter options

### Templates

#### iconect_render_template

Render a template with variables.

**Parameters:**
- `id` (string, required): Template ID
- `variables` (object, optional): Template variables
- `outputFormat` (string, optional): Output format - pdf, html, docx, txt, email

**Returns rendered content or download URL.**

### Views

#### iconect_share_view

Configure view sharing settings.

**Parameters:**
- `id` (string, required): View ID
- `isPublic` (boolean, required): Make view public
- `expiresAt` (string, optional): Share expiration date
- `allowAnonymous` (boolean, optional): Allow anonymous access

### Dashboards

#### iconect_add_widget

Add a widget to a dashboard.

**Parameters:**
- `dashboardId` (string, required): Dashboard ID
- `widget` (object, required): Widget configuration
  - `type` (string): Widget type - chart, metric, list, map, calendar, custom
  - `title` (string): Widget title
  - `position` (object): Position (x, y, width, height)
  - `configuration` (object): Widget-specific config
  - `refreshInterval` (number, optional): Auto-refresh interval

### Themes

#### iconect_apply_theme

Apply a theme to user, project, or globally.

**Parameters:**
- `themeId` (string, required): Theme ID
- `scope` (string, optional): Scope - global, user, project (default: user)
- `targetId` (string, optional): Target ID for project scope

#### iconect_import_theme

Import a theme from external source.

**Parameters:**
- `name` (string, required): Theme name
- `format` (string, required): Format - json, css, scss
- `data` (string, required): Theme data
- `overwrite` (boolean, optional): Overwrite existing theme

## Error Handling

All tools return a standardized response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": { ... }
  }
}
```

### Common Error Codes

- `NOT_CONFIGURED`: Server not configured
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input parameters
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `SERVER_ERROR`: Internal server error
- `REQUEST_TIMEOUT`: Request timed out

## Rate Limiting

The Iconect API implements rate limiting. The MCP server automatically handles rate limit responses with exponential backoff retry logic.

## Best Practices

1. **Configuration**: Always configure the server before using any tools
2. **Authentication**: Ensure proper authentication before accessing protected resources
3. **Error Handling**: Always check the `success` field in responses
4. **Pagination**: Use pagination for large result sets
5. **Bulk Operations**: Use bulk operations when working with multiple records
6. **Chunked Uploads**: Use chunked uploads for files larger than 5MB
7. **Caching**: The server implements internal caching for better performance

## Advanced Usage

### Filtering

Most list operations support advanced filtering:
```json
{
  "filters": {
    "field1": "exact_value",
    "field2": { "$gt": 100 },
    "field3": { "$in": ["value1", "value2"] },
    "field4": { "$regex": "pattern" }
  }
}
```

### Sorting

Multi-field sorting is supported:
```json
{
  "sorting": [
    { "field": "priority", "order": "desc" },
    { "field": "createdDate", "order": "asc" }
  ]
}
```

### Field Selection

Some operations support field selection:
```json
{
  "fields": ["id", "name", "status", "createdDate"]
}
```

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- API Documentation: https://api.iconect.com/docs