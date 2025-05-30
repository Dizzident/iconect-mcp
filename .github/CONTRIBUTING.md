# Contributing to Iconect MCP Server

Thank you for your interest in contributing to the Iconect MCP Server! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We expect all contributors to be respectful, inclusive, and professional.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your contribution
5. Make your changes
6. Test your changes
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/iconect-mcp.git
cd iconect-mcp

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Setup

1. Copy example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your development environment in `.env`

## Contributing Process

### 1. Issues First

- Check existing issues before creating a new one
- Use issue templates for bug reports and feature requests
- Discuss major changes in an issue before implementing

### 2. Branch Naming

Use descriptive branch names:
- `feature/add-new-tool`
- `fix/authentication-bug`
- `docs/update-api-reference`
- `refactor/improve-error-handling`

### 3. Development Workflow

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run tests
npm test

# Run linting
npm run lint

# Build the project
npm run build

# Commit your changes
git add .
git commit -m "feat: add new authentication tool"

# Push to your fork
git push origin feature/your-feature-name
```

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide proper type annotations
- Avoid `any` types when possible
- Use interfaces for object shapes
- Use enums for constants

### Code Style

- Use Prettier for formatting (automatic)
- Follow ESLint rules (enforced in CI)
- Use meaningful variable and function names
- Write self-documenting code with JSDoc comments

### File Organization

```
src/
├── auth/           # Authentication logic
├── client/         # HTTP client
├── config/         # Configuration management
├── tools/          # MCP tool definitions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── __tests__/      # Test files
```

## Testing Guidelines

### Test Structure

- Unit tests for individual functions/classes
- Integration tests for complete workflows
- Use Jest testing framework
- Aim for good test coverage on core logic

### Writing Tests

```typescript
describe('AuthService', () => {
  it('should authenticate with valid credentials', async () => {
    // Arrange
    const authService = new AuthService();
    const credentials = { username: 'test', password: 'pass' };
    
    // Act
    const result = await authService.authenticate(credentials);
    
    // Assert
    expect(result.success).toBe(true);
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Documentation

### API Documentation

- Document all public APIs with JSDoc
- Include parameter types and return types
- Provide usage examples
- Update docs/API.md for tool changes

### README Updates

- Update README.md for significant changes
- Include installation and usage instructions
- Keep examples current and working

### Inline Documentation

```typescript
/**
 * Authenticates a user with the Iconect API
 * @param credentials - User credentials
 * @returns Promise that resolves to authentication result
 * @throws IconectError when authentication fails
 */
async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
  // Implementation
}
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add OAuth 2.0 PKCE support

Add support for authorization code flow with PKCE for enhanced security
in browser-based applications.

Closes #123
```

```
fix(tools): handle malformed API responses

- Add validation for API response structure
- Improve error messages for debugging
- Add tests for edge cases

Fixes #456
```

## Pull Request Process

### Before Submitting

- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Changes are covered by tests
- [ ] No sensitive information is exposed

### PR Description

Use the provided PR template and include:

- Clear description of changes
- Link to related issues
- Testing information
- Screenshots if applicable
- Breaking changes (if any)

### Review Process

1. Automated checks must pass (CI)
2. Code review by maintainers
3. Address feedback promptly
4. Maintain clean commit history

### Merging

- Use "Squash and merge" for feature branches
- Use "Rebase and merge" for small fixes
- Ensure commit messages follow conventions

## Tool Development

### Adding New Tools

1. Define tool schema in appropriate tool file
2. Implement handler method
3. Add comprehensive tests
4. Update documentation
5. Add usage examples

### Tool Guidelines

- Follow consistent naming patterns (`iconect_verb_resource`)
- Use Zod schemas for input validation
- Provide meaningful error messages
- Include proper JSDoc documentation
- Test both success and error cases

## Performance Considerations

- Use connection pooling for HTTP requests
- Implement proper caching where appropriate
- Avoid blocking operations in tool handlers
- Consider memory usage for large datasets
- Profile performance-critical code paths

## Security Guidelines

- Never commit sensitive information
- Validate all inputs thoroughly
- Use secure HTTP client configuration
- Follow OAuth 2.0 best practices
- Implement proper error handling to avoid information leakage

## Getting Help

- Check existing documentation
- Search through issues
- Ask questions in discussions
- Reach out to maintainers

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- README.md contributors section
- Release notes

Thank you for contributing to the Iconect MCP Server!