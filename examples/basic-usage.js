/**
 * Basic Usage Example for Iconect MCP Server
 * 
 * This example demonstrates common workflows using the Iconect MCP Server
 */

// Note: In a real implementation, you would use the MCP client SDK
// This example shows the conceptual flow of operations

async function main() {
  console.log('=== Iconect MCP Server Basic Usage Example ===\n');

  // Step 1: Configure the server
  console.log('1. Configuring server...');
  await callTool('iconect_configure', {
    baseUrl: 'https://api.iconect.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    timeout: 30000,
    logLevel: 'INFO'
  });
  console.log('✓ Server configured\n');

  // Step 2: Authenticate
  console.log('2. Authenticating...');
  const authResult = await callTool('iconect_auth_password', {
    username: 'demo@example.com',
    password: 'demo-password'
  });
  console.log('✓ Authenticated successfully');
  console.log(`  Token expires at: ${authResult.data.expiresAt}\n`);

  // Step 3: List available projects
  console.log('3. Listing projects...');
  const projects = await callTool('iconect_list_projects', {
    status: 'active',
    page: 1,
    pageSize: 10
  });
  console.log(`✓ Found ${projects.data.total} projects`);
  
  if (projects.data.data.length > 0) {
    const firstProject = projects.data.data[0];
    console.log(`  Using project: ${firstProject.name} (${firstProject.id})\n`);

    // Step 4: Create a custom field
    console.log('4. Creating custom field...');
    const field = await callTool('iconect_create_field', {
      projectId: firstProject.id,
      name: 'customer_email',
      displayName: 'Customer Email',
      fieldType: 'text',
      dataType: 'string',
      isRequired: true,
      isSearchable: true,
      validationRules: {
        pattern: '^[^@]+@[^@]+\\.[^@]+$'
      }
    });
    console.log(`✓ Created field: ${field.data.displayName}\n`);

    // Step 5: Create a record
    console.log('5. Creating a record...');
    const record = await callTool('iconect_create_record', {
      projectId: firstProject.id,
      fields: {
        customer_email: 'john.doe@example.com',
        customer_name: 'John Doe',
        invoice_amount: 1250.50,
        status: 'pending'
      },
      tags: ['new-customer', 'high-value'],
      priority: 'high'
    });
    console.log(`✓ Created record: ${record.data.id}\n`);

    // Step 6: Search for records
    console.log('6. Searching records...');
    const searchResults = await callTool('iconect_search_records', {
      projectId: firstProject.id,
      query: 'john',
      filters: {
        status: 'pending'
      },
      page: 1,
      pageSize: 20
    });
    console.log(`✓ Found ${searchResults.data.total} matching records\n`);

    // Step 7: Upload a file
    console.log('7. Uploading a file...');
    const fileContent = Buffer.from('Sample document content').toString('base64');
    const fileUpload = await callTool('iconect_upload_file', {
      projectId: firstProject.id,
      fileStoreId: 'default-store', // Use actual file store ID
      fileName: 'sample-document.txt',
      content: fileContent,
      mimeType: 'text/plain',
      metadata: {
        description: 'Sample document for demo'
      }
    });
    console.log(`✓ Uploaded file: ${fileUpload.data.name}\n`);

    // Step 8: Create a simple dashboard
    console.log('8. Creating a dashboard...');
    const dashboard = await callTool('iconect_create_dashboard', {
      name: 'demo-dashboard',
      description: 'Demo Dashboard',
      layout: {
        columns: 12,
        widgets: []
      }
    });
    console.log(`✓ Created dashboard: ${dashboard.data.name}`);

    // Add a metric widget
    await callTool('iconect_add_widget', {
      dashboardId: dashboard.data.id,
      widget: {
        type: 'metric',
        title: 'Total Records',
        position: { x: 0, y: 0, width: 3, height: 1 },
        configuration: {
          dataSource: 'records',
          projectId: firstProject.id,
          aggregation: {
            field: 'id',
            function: 'count'
          }
        }
      }
    });
    console.log('✓ Added metric widget\n');

    // Step 9: Create a job to process data
    console.log('9. Creating an import job...');
    const importJob = await callTool('iconect_create_import_job', {
      name: 'Demo Import',
      projectId: firstProject.id,
      priority: 'normal',
      configuration: {
        source: {
          type: 'file',
          location: fileUpload.data.id,
          format: 'csv'
        },
        mapping: {
          fieldMappings: [
            { sourceField: 'Email', targetField: 'customer_email' },
            { sourceField: 'Name', targetField: 'customer_name' }
          ],
          fileStoreId: 'default-store'
        },
        options: {
          skipDuplicates: true,
          validateData: true
        }
      }
    });
    console.log(`✓ Created import job: ${importJob.data.name}\n`);

    // Step 10: Check authentication status
    console.log('10. Checking authentication status...');
    const authStatus = await callTool('iconect_get_auth_status');
    console.log(`✓ Authentication status: ${authStatus.data.isAuthenticated ? 'Active' : 'Expired'}`);
  }

  console.log('\n=== Demo completed successfully! ===');
}

// Mock function to simulate tool calls
// In real usage, this would be replaced with actual MCP client calls
async function callTool(toolName, params) {
  console.log(`  → Calling ${toolName}...`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock responses for demo
  const mockResponses = {
    'iconect_configure': { success: true },
    'iconect_auth_password': {
      success: true,
      data: {
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hasRefreshToken: true
      }
    },
    'iconect_list_projects': {
      success: true,
      data: {
        data: [{
          id: 'proj-123',
          name: 'Demo Project',
          status: 'active'
        }],
        total: 1,
        page: 1,
        pageSize: 10,
        hasMore: false
      }
    },
    'iconect_create_field': {
      success: true,
      data: {
        id: 'field-456',
        name: 'customer_email',
        displayName: 'Customer Email'
      }
    },
    'iconect_create_record': {
      success: true,
      data: {
        id: 'rec-789',
        fields: params.fields
      }
    },
    'iconect_search_records': {
      success: true,
      data: {
        data: [],
        total: 1
      }
    },
    'iconect_upload_file': {
      success: true,
      data: {
        id: 'file-012',
        name: params.fileName
      }
    },
    'iconect_create_dashboard': {
      success: true,
      data: {
        id: 'dash-345',
        name: params.name
      }
    },
    'iconect_add_widget': {
      success: true
    },
    'iconect_create_import_job': {
      success: true,
      data: {
        id: 'job-678',
        name: params.name
      }
    },
    'iconect_get_auth_status': {
      success: true,
      data: {
        isAuthenticated: true
      }
    }
  };

  return mockResponses[toolName] || { success: true };
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}