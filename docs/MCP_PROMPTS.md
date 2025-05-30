# MCP Prompts Guide

This guide provides examples of how to interact with the Iconect MCP Server using natural language prompts. These prompts can be used with any MCP-compatible client (like Claude Desktop) to perform various operations.

## Table of Contents

1. [Authentication & Configuration](#authentication--configuration)
2. [Project Management](#project-management)
3. [File Operations](#file-operations)
4. [Record Management](#record-management)
5. [Job Automation](#job-automation)
6. [Dashboard Creation](#dashboard-creation)
7. [User Management](#user-management)
8. [Advanced Workflows](#advanced-workflows)

## Authentication & Configuration

### Initial Setup
```
"Configure the Iconect server with the URL https://api.iconect.com, client ID 'my-client-id', and client secret 'my-secret'"
```

### Password Authentication
```
"Authenticate to Iconect using username john.doe@example.com and password mypassword123"
```

### OAuth Flow
```
"Generate an OAuth authorization URL for Iconect with redirect URI http://localhost:3000/callback"
```

### Check Authentication Status
```
"Check if I'm currently authenticated to Iconect"
```

## Project Management

### List Projects
```
"Show me all active projects in Iconect"
```

```
"List the first 20 projects sorted by creation date"
```

### Create Project
```
"Create a new project called 'Customer Portal 2024' with description 'Main customer-facing portal for 2024 initiatives'"
```

### Update Project
```
"Update project proj-123 to set status as 'completed' and add a note 'Phase 1 complete'"
```

### Search Projects
```
"Find all projects that contain 'marketing' in their name or description"
```

## File Operations

### Upload Files
```
"Upload the file report.pdf to project proj-123 in the default file store"
```

```
"Upload a large video file presentation.mp4 to project proj-456 using chunked upload"
```

### List Files
```
"Show me all PDF files in project proj-123 uploaded in the last 7 days"
```

### Download Files
```
"Download file file-789 and save it as quarterly-report.pdf"
```

### File Management
```
"Create a new file store called 'Archive Storage' using S3 backend with bucket 'company-archive'"
```

## Record Management

### Create Records
```
"Create a new customer record in project proj-123 with name 'Acme Corp', email 'contact@acme.com', status 'active', and contract value 50000"
```

### Search Records
```
"Find all customer records in project proj-123 where status is 'pending' and contract value is greater than 10000"
```

### Bulk Operations
```
"Update all records in project proj-123 with status 'pending' to set status as 'in_review' and add tag 'q4-review'"
```

### Complex Queries
```
"Search for records in project proj-123 that were created last month, have 'enterprise' tag, and either status is 'active' or contract value exceeds 100000"
```

## Job Automation

### Import Jobs
```
"Create an import job to load data from customers.csv into project proj-123, mapping 'Company Name' to 'name' field and 'Email Address' to 'email' field"
```

### Scheduled Jobs
```
"Schedule a daily export job at 2 AM EST that exports all new records from project proj-123 to an Excel file"
```

### Job Management
```
"Show me all running jobs and their current progress"
```

```
"Pause job job-456 and then check its logs for any errors"
```

## Dashboard Creation

### Create Dashboard
```
"Create a new dashboard called 'Sales Overview' with a 12-column layout"
```

### Add Widgets
```
"Add a metric widget to dashboard dash-123 showing total record count for project proj-456"
```

```
"Add a chart widget displaying monthly revenue trends from project proj-789 records"
```

### Complex Dashboard
```
"Create a dashboard with:
1. A metric showing total active customers
2. A pie chart of customers by status
3. A line chart showing customer growth over time
4. A table of recent customer activities"
```

## User Management

### User Operations
```
"List all users with admin role who have been active in the last 30 days"
```

```
"Update user preferences for john.doe@example.com to set theme to 'dark' and timezone to 'America/New_York'"
```

### Permissions
```
"Show me what permissions user jane.smith@example.com has for project proj-123"
```

```
"Grant user mike.jones@example.com editor access to projects proj-123, proj-456, and proj-789"
```

## Advanced Workflows

### Multi-Step Import Process
```
"I need to import customer data:
1. First check if 'customers' file store exists, create if not
2. Upload customers.csv to the file store
3. Create an import job that validates email addresses
4. Map 'Company' to 'name' and 'Contact Email' to 'email'
5. Skip duplicates based on email field
6. Start the job and monitor its progress"
```

### Data Migration
```
"Migrate all records from project 'Old Customer DB' to 'New Customer Portal':
1. Export all records from the old project
2. Create matching fields in the new project
3. Import records with field mapping
4. Verify record count matches
5. Create a report of any issues"
```

### Automated Reporting
```
"Set up automated weekly reporting:
1. Create a view showing all high-value customers
2. Create a dashboard with key metrics
3. Create a template for the weekly report
4. Schedule a job to email the report every Monday at 9 AM"
```

### Field Validation Setup
```
"Create a validated customer form:
1. Create email field with regex validation
2. Create phone field that accepts only US format
3. Create revenue field that must be positive number
4. Create status field with choices: prospect, active, inactive
5. Make email and phone required fields"
```

## Tips for Effective Prompts

### Be Specific
Instead of: "Upload a file"
Use: "Upload invoice.pdf to project proj-123 in the documents file store"

### Provide Context
Instead of: "Create a job"
Use: "Create an import job to load customer data from Excel file into project proj-123 with email validation"

### Chain Operations
```
"First authenticate with username admin@company.com and password, then list all projects, and finally create a dashboard for the first active project"
```

### Use Filters
```
"Show me all PDF files larger than 5MB uploaded last week by users in the marketing department"
```

### Specify Output
```
"Export all customer records from project proj-123 to Excel format, including only name, email, and status fields"
```

## Common Patterns

### CRUD Operations
- Create: "Create a new [resource] with [properties]"
- Read: "Show me [resource] with [filters]"
- Update: "Update [resource] [id] to set [properties]"
- Delete: "Delete [resource] [id]"

### Filtering and Searching
- "Find all [resources] where [condition]"
- "List [resources] with [property] equal to [value]"
- "Search for [resources] containing [text]"

### Batch Operations
- "For all [resources] with [condition], [action]"
- "Bulk update [resources] to [new values]"
- "Process multiple [resources] and [action]"

### Scheduling
- "Schedule [action] to run [frequency] at [time]"
- "Create recurring [job] every [interval]"
- "Set up automated [task] with cron expression [expression]"

## Error Handling

### Authentication Errors
```
"If authentication fails, refresh the token and retry the operation"
```

### Validation Errors
```
"Create a record and if validation fails, show me which fields have issues"
```

### Bulk Operation Monitoring
```
"Start bulk update and check status every 30 seconds until complete or failed"
```

## Best Practices

1. **Start Simple**: Begin with basic operations before complex workflows
2. **Test First**: Use list/get operations to verify data before updates
3. **Use Pagination**: For large datasets, specify page size and number
4. **Handle Errors**: Plan for validation and authentication errors
5. **Monitor Progress**: Check job status for long-running operations
6. **Validate Data**: Use field validation before importing large datasets
7. **Backup Important Data**: Export data before major updates
8. **Use Descriptive Names**: Make resource names self-documenting

## Example Conversation Flow

```
User: "Configure Iconect server at https://api.iconect.com with my credentials"
Assistant: [Configures server]

User: "Authenticate using my admin account"
Assistant: [Authenticates]

User: "Show me all projects"
Assistant: [Lists projects]

User: "Create a dashboard for project proj-123 with customer metrics"
Assistant: [Creates dashboard with widgets]

User: "Schedule a daily export of new customers at midnight"
Assistant: [Creates scheduled job]
```

This natural conversation flow allows for intuitive interaction with the Iconect system through the MCP server.