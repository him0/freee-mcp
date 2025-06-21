# Test Setup Documentation

This document outlines the comprehensive test setup implemented for the freee-mcp project using Vitest.

## Testing Framework

- **Test Runner**: Vitest - Fast unit test framework for Vite
- **Environment**: jsdom for DOM simulation
- **Coverage**: V8 coverage provider with lcov, json, html, and text reports
- **Mocking**: Vitest's built-in mocking capabilities with vi.mock()

## Test Structure

### Test Files Created
- `src/config.test.ts` - Configuration validation tests
- `src/index.test.ts` - Main entry point tests  
- `src/api/client.test.ts` - API client functionality tests
- `src/auth/oauth.test.ts` - OAuth authentication flow tests
- `src/auth/tokens.test.ts` - Token management tests
- `src/mcp/handlers.test.ts` - MCP server handler tests
- `src/mcp/tools.test.ts` - MCP tools functionality tests
- `src/openapi/converter.test.ts` - OpenAPI to tools conversion tests
- `src/openapi/schema.test.ts` - Schema conversion utility tests

### Coverage Areas

#### Core Configuration (`config.test.ts`)
- Environment variable handling
- Default value validation
- OAuth and server configuration validation

#### Authentication Flow (`auth/oauth.test.ts`, `auth/tokens.test.ts`)
- PKCE code generation and verification
- OAuth URL building
- Token exchange and refresh logic
- Token storage and retrieval
- Token validation and expiration handling

#### API Client (`api/client.test.ts`)
- Request formatting and authentication
- Error handling for different HTTP status codes
- Query parameter handling
- Request body processing

#### MCP Integration (`mcp/handlers.test.ts`, `mcp/tools.test.ts`)
- Server startup and shutdown
- Tool registration and execution
- Authentication tool functionality
- Error handling and user feedback

#### OpenAPI Processing (`openapi/converter.test.ts`, `openapi/schema.test.ts`)
- Dynamic tool generation from OpenAPI schema
- Parameter schema conversion
- Path-to-tool-name transformation
- Request/response handling

## npm Scripts

- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ui` - Run tests with UI interface

## GitHub Actions Integration

A comprehensive CI workflow (`.github/workflows/test.yml`) that:

### Test Matrix
- Tests against Node.js versions 18, 20, and 22
- Runs on Ubuntu latest

### Build Pipeline
1. **Type Checking** - TypeScript compilation without emit
2. **Linting** - ESLint validation 
3. **Testing** - Full test suite execution
4. **Coverage** - Test coverage analysis with Codecov integration
5. **Build Verification** - Ensures project builds correctly

### Parallel Jobs
- **Test Job**: Runs linting, type checking, and tests in parallel across Node versions
- **Build Job**: Validates the build process after tests pass

## Coverage Configuration

- **Provider**: V8 for accurate coverage reporting
- **Reporters**: text, json, html, lcov formats
- **Exclusions**: node_modules, dist, build files, and test files themselves
- **Integration**: Codecov for coverage tracking and reporting

## Testing Best Practices Implemented

1. **Comprehensive Mocking**: All external dependencies properly mocked
2. **Error Scenarios**: Both success and failure paths tested
3. **Type Safety**: TypeScript compliance maintained in all tests
4. **Isolation**: Each test file is independent and can run in isolation
5. **Real-world Scenarios**: Tests simulate actual usage patterns
6. **CI Integration**: Automated testing on every push and pull request

## Running Tests Locally

```bash
# Install dependencies
pnpm install

# Run all tests once
pnpm test:run

# Run tests in watch mode for development
pnpm test

# Generate coverage report
pnpm test:coverage

# Open test UI
pnpm test:ui
```

## Test Statistics

- **Total Test Files**: 9
- **Total Tests**: 71
- **Code Coverage**: High coverage across all modules
- **CI Status**: ✅ All tests passing in GitHub Actions

This test setup ensures code quality, prevents regressions, and provides confidence in the freee-mcp integration functionality.