# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for the Iconect REST API v0.11.0. The server provides comprehensive access to Iconect document management functionality through standardized MCP tools.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run the server (after build)
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck
```

## Architecture

### Core Components
- **HttpClient** (`src/client/http-client.ts`): Axios-based HTTP client with automatic token refresh and retry logic
- **AuthService** (`src/auth/auth-service.ts`): OAuth 2.0 authentication management
- **ConfigManager** (`src/config/index.ts`): Type-safe configuration management
- **Tool Classes** (`src/tools/`): MCP tool implementations for different API endpoints

### Key Patterns
- **Error Handling**: Custom error classes in `src/utils/errors.ts` with proper HTTP status mapping
- **Validation**: Zod schemas for request/response validation
- **Logging**: Structured logging with configurable levels
- **Token Management**: Automatic refresh with proper expiration handling

## Project Structure

```
src/
├── auth/           # Authentication services
├── client/         # HTTP client implementation
├── config/         # Configuration management
├── tools/          # MCP tool implementations
├── types/          # TypeScript type definitions
├── utils/          # Utilities (logging, errors)
└── index.ts        # Main MCP server entry point
```

## Implementation Status

- ✅ **Phase 1**: Foundation & Authentication (Complete)
- ✅ **Phase 2**: Core Resource Management (Complete)
- ✅ **Phase 3**: File Operations & Storage (Complete)
- ✅ **Phase 4**: Data Management & Structure (Complete)
- ✅ **Phase 5**: Job Management & Processing (Complete)
- ⏳ **Phase 6**: UI Components & Views (Pending)
- ⏳ **Phase 7**: Testing, Documentation & Optimization (Pending)

## Testing

- Uses Vitest for testing framework
- Test files should be placed in `src/__tests__/` directory
- Coverage reports available with `npm run test:coverage`

## Development Notes

- All HTTP requests go through the centralized HttpClient for consistent error handling
- Token refresh is handled automatically by the HTTP client interceptors
- All tools follow the same error handling pattern using IconectError classes
- Configuration must be loaded before using any API tools