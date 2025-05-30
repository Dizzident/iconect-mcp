# Iconect MCP Server

A comprehensive Model Context Protocol (MCP) server that provides full access to the Iconect REST API v0.11.0. This server enables Claude to interact with Iconect document management systems through standardized MCP tools.

## Features

### All Phases Complete ✅

**Authentication & Configuration:**
- OAuth 2.0 password credentials flow
- OAuth 2.0 authorization code flow with PKCE support
- Automatic token refresh
- Secure token management
- Configurable server settings

**Core Resource Management:**
- Data server CRUD operations
- Project management
- Client management
- Comprehensive error handling
- Request/response validation

**File Operations & Storage:**
- File store management (local, S3, Azure, GCP)
- Single file upload for small files
- Chunked upload for large files with progress tracking
- File download with range support
- File metadata management
- Storage statistics and monitoring

**Data Management & Structure:**
- Advanced record search and filtering
- Complete record lifecycle management
- Field management with validation
- Folder hierarchy and organization
- Bulk operations with progress tracking
- Record relationships and data integrity
- Custom field types and constraints

**Job Management & Processing:**
- Complete job lifecycle management
- Import/export job automation
- Queue management with concurrency control
- Template-based job creation
- Cron-based scheduling system
- Progress tracking and monitoring
- Error handling and retry policies
- Job logging and artifact management

**UI Components & Views:**
- Panel management with layout configuration
- Template system with multiple formats and variable support
- View management with advanced queries and sharing
- User management with preferences, permissions, and activity tracking
- Dashboard and widget system with real-time data refresh
- Theme system with color palettes, typography, and import/export
- Permission-based access control for all UI components
- Export functionality for all major components
- Sharing and collaboration features

**Testing & Documentation:**
- Comprehensive test suite with Jest
- Complete API documentation
- Step-by-step tutorials and examples
- Performance optimization guide
- Security audit and best practices
- Troubleshooting guide

## Installation

```bash
npm install
npm run build
```

## Configuration

The server must be configured before use. Use the `iconect_configure` tool:

```json
{
  "baseUrl": "https://your-iconect-instance.com/api",
  "clientId": "your-oauth-client-id",
  "clientSecret": "your-oauth-client-secret",
  "timeout": 30000,
  "logLevel": "INFO"
}
```

## Available Tools

### Authentication
- `iconect_auth_password` - Authenticate with username/password
- `iconect_auth_code` - Authenticate with OAuth authorization code
- `iconect_refresh_token` - Refresh access token
- `iconect_generate_auth_url` - Generate OAuth authorization URL
- `iconect_logout` - Clear authentication tokens
- `iconect_get_auth_status` - Get current authentication status

### Data Servers
- `iconect_list_data_servers` - List all data servers
- `iconect_get_data_server` - Get specific data server
- `iconect_create_data_server` - Create new data server
- `iconect_update_data_server` - Update data server
- `iconect_delete_data_server` - Delete data server

### Projects
- `iconect_list_projects` - List all projects
- `iconect_get_project` - Get specific project
- `iconect_create_project` - Create new project
- `iconect_update_project` - Update project
- `iconect_delete_project` - Delete project

### Clients
- `iconect_list_clients` - List all clients
- `iconect_get_client` - Get specific client
- `iconect_create_client` - Create new client
- `iconect_update_client` - Update client
- `iconect_delete_client` - Delete client

### File Stores
- `iconect_list_file_stores` - List all file stores
- `iconect_get_file_store` - Get specific file store
- `iconect_create_file_store` - Create new file store
- `iconect_update_file_store` - Update file store
- `iconect_delete_file_store` - Delete file store
- `iconect_get_file_store_stats` - Get storage statistics

### Files
- `iconect_list_files` - List files with filtering
- `iconect_get_file` - Get file metadata
- `iconect_upload_file` - Upload single file
- `iconect_initiate_chunked_upload` - Start chunked upload session
- `iconect_upload_chunk` - Upload file chunk
- `iconect_complete_chunked_upload` - Complete chunked upload
- `iconect_get_upload_session` - Get upload session status
- `iconect_download_file` - Download file content
- `iconect_delete_file` - Delete file

### Records
- `iconect_search_records` - Advanced search with filtering
- `iconect_get_record` - Get record with related data
- `iconect_create_record` - Create new records
- `iconect_update_record` - Update existing records
- `iconect_delete_record` - Delete records (soft/hard delete)
- `iconect_bulk_update_records` - Bulk operations on records
- `iconect_create_record_relationship` - Create record relationships
- `iconect_get_record_relationships` - Get record relationships
- `iconect_delete_record_relationship` - Delete relationships
- `iconect_get_bulk_operation_status` - Monitor bulk operations

### Fields
- `iconect_list_fields` - List project fields with filtering
- `iconect_get_field` - Get field definition
- `iconect_create_field` - Create custom fields
- `iconect_update_field` - Update field configuration
- `iconect_delete_field` - Delete custom fields
- `iconect_validate_field_value` - Validate field values
- `iconect_get_field_usage` - Field usage statistics
- `iconect_duplicate_field` - Duplicate fields across projects

### Folders
- `iconect_list_folders` - List folders with hierarchy
- `iconect_get_folder` - Get folder with related data
- `iconect_create_folder` - Create new folders
- `iconect_update_folder` - Update folder properties
- `iconect_delete_folder` - Delete folders with content handling
- `iconect_move_folder` - Move folders in hierarchy
- `iconect_copy_folder` - Copy folders with contents
- `iconect_get_folder_tree` - Get complete folder tree
- `iconect_get_folder_path` - Get folder path from root

### Jobs
- `iconect_list_jobs` - List jobs with comprehensive filtering
- `iconect_get_job` - Get detailed job information
- `iconect_create_import_job` - Create import jobs with field mapping
- `iconect_create_delete_job` - Create deletion jobs with criteria
- `iconect_create_custom_job` - Create custom job types
- `iconect_update_job` - Update job configuration
- `iconect_control_job` - Control job execution (start, pause, resume, cancel, restart)
- `iconect_delete_job` - Remove jobs
- `iconect_get_job_logs` - Retrieve job execution logs

### Job Queues
- `iconect_list_job_queues` - List and filter job queues
- `iconect_get_job_queue` - Get queue details and statistics
- `iconect_create_job_queue` - Create job queues with processing rules
- `iconect_update_job_queue` - Update queue configuration
- `iconect_delete_job_queue` - Remove job queues

### Job Templates & Scheduling
- `iconect_list_job_templates` - List available job templates
- `iconect_get_job_template` - Get template configuration
- `iconect_create_job_from_template` - Create jobs from templates
- `iconect_list_job_schedules` - List scheduled jobs
- `iconect_create_job_schedule` - Create recurring job schedules
- `iconect_update_job_schedule` - Update schedule configuration
- `iconect_delete_job_schedule` - Remove schedules

### UI Components & Views
- `iconect_list_panels` - List panels with filtering and pagination
- `iconect_get_panel` - Get specific panel with optional data
- `iconect_create_panel` - Create new panels with layout configuration
- `iconect_update_panel` - Update existing panels
- `iconect_delete_panel` - Delete panels
- `iconect_duplicate_panel` - Duplicate panels with new configuration
- `iconect_export_panel` - Export panel data in various formats
- `iconect_get_panel_data` - Get panel data with filtering

### Templates
- `iconect_list_templates` - List templates with filtering
- `iconect_get_template` - Get template with optional content
- `iconect_create_template` - Create new templates
- `iconect_update_template` - Update existing templates
- `iconect_delete_template` - Delete templates
- `iconect_duplicate_template` - Duplicate templates
- `iconect_render_template` - Render templates with variables
- `iconect_validate_template` - Validate template with variables
- `iconect_get_template_variables` - Get template variables

### Views
- `iconect_list_views` - List views with filtering
- `iconect_get_view` - Get specific view with optional data
- `iconect_create_view` - Create new views
- `iconect_update_view` - Update existing views
- `iconect_delete_view` - Delete views
- `iconect_duplicate_view` - Duplicate views
- `iconect_share_view` - Configure view sharing
- `iconect_get_view_data` - Get view data with filtering
- `iconect_export_view` - Export view data

### Users
- `iconect_list_users` - List users with filtering
- `iconect_get_user` - Get specific user information
- `iconect_get_current_user` - Get current authenticated user
- `iconect_update_user` - Update user information (admin)
- `iconect_update_current_user` - Update current user profile
- `iconect_update_user_preferences` - Update user preferences
- `iconect_update_current_user_preferences` - Update current user preferences
- `iconect_change_password` - Change current user password
- `iconect_reset_user_password` - Reset user password (admin)
- `iconect_get_user_permissions` - Get user permissions
- `iconect_update_user_roles` - Update user roles
- `iconect_get_user_activity` - Get user activity logs

### Dashboards & Widgets
- `iconect_list_dashboards` - List dashboards with filtering
- `iconect_get_dashboard` - Get dashboard with optional widget data
- `iconect_create_dashboard` - Create new dashboards
- `iconect_update_dashboard` - Update existing dashboards
- `iconect_delete_dashboard` - Delete dashboards
- `iconect_duplicate_dashboard` - Duplicate dashboards
- `iconect_add_widget` - Add widgets to dashboards
- `iconect_update_widget` - Update dashboard widgets
- `iconect_remove_widget` - Remove widgets from dashboards
- `iconect_get_widget_data` - Get widget data
- `iconect_refresh_widget` - Force refresh widget data
- `iconect_export_dashboard` - Export dashboards
- `iconect_share_dashboard` - Configure dashboard sharing

### Themes
- `iconect_list_themes` - List themes with filtering
- `iconect_get_theme` - Get specific theme
- `iconect_create_theme` - Create new themes
- `iconect_update_theme` - Update existing themes
- `iconect_delete_theme` - Delete themes
- `iconect_duplicate_theme` - Duplicate themes
- `iconect_apply_theme` - Apply themes to users/projects
- `iconect_get_current_theme` - Get currently applied theme
- `iconect_preview_theme` - Preview theme on components
- `iconect_validate_theme` - Validate theme data
- `iconect_export_theme` - Export themes in various formats
- `iconect_import_theme` - Import themes from external sources

## Development

```bash
# Development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck
```

## Usage Example

1. **Configure the server:**
```javascript
await callTool('iconect_configure', {
  baseUrl: 'https://api.iconect.com',
  clientId: 'your-client-id'
});
```

2. **Authenticate:**
```javascript
await callTool('iconect_auth_password', {
  username: 'your-username',
  password: 'your-password'
});
```

3. **List projects:**
```javascript
await callTool('iconect_list_projects', {
  page: 1,
  pageSize: 20
});
```

## Architecture

- **HTTP Client**: Axios-based client with connection pooling and automatic retry
- **Authentication**: Comprehensive OAuth 2.0 support with token management
- **Error Handling**: Structured error responses with proper HTTP status mapping
- **Validation**: Zod-based request/response validation
- **Logging**: Configurable logging with multiple levels
- **Configuration**: Type-safe configuration management

## Roadmap

- ✅ Phase 1: Foundation & Authentication
- ✅ Phase 2: Core Resource Management
- ✅ Phase 3: File Operations & Storage
- ✅ Phase 4: Data Management & Structure
- ✅ Phase 5: Job Management & Processing
- ✅ Phase 6: UI Components & Views
- ✅ Phase 7: Testing, Documentation & Optimization

## Requirements

- Node.js 18+
- TypeScript 5+
- Iconect API v0.11.0+

## License

MIT