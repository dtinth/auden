# GitHub Copilot Instructions for Auden

## Essential Reading

**Before working on this project**, read these comprehensive guides:

- **`CLAUDE.md`** - Complete developer guide with project overview, architecture, technology stack, development commands, and implementation patterns
- **`TESTING.md`** - Comprehensive testing strategy including Playwright setup, Firebase emulator configuration, page object architecture, and test implementation patterns

## Quick Reference

### Development Setup
- Node.js version: 22.18.0 (specified in `.nvmrc`)
- Package manager: `yarn`
- Main commands: `yarn install`, `yarn start`, `yarn build`, `yarn test:e2e`

### Technology Stack
- Frontend: React 18 + TypeScript + Grommet UI
- Backend: Firebase Realtime Database
- Testing: Playwright + Firebase Emulator Suite
- Build: Create React App

### Architecture Overview
Auden is a real-time audience engagement platform with three user interfaces:
- **Audience View** (`#/`) - Mobile-optimized participant interface
- **Presentation View** (`#/display`) - Large screen display for projectors  
- **Admin View** (`#/admin`) - Backstage management interface

### Firebase Emulator Testing
The project uses Firebase Emulator Suite for testing. See `.github/workflows/ci.yml` for the complete CI setup:
- Database Emulator: `localhost:9000`
- Auth Emulator: `localhost:9099` 
- Docker image: `ghcr.io/dtinth/firebase-emulator-suite:main`

Tests use isolated database namespaces and custom JWT tokens for authentication.

### Key Directories
- `src/core/` - Core application components (auth, routing, UI)
- `src/scenes/` - Feature implementations (quiz, vote, freestyle)
- `tests/lib/` - Page object classes and testing utilities
- `.github/workflows/` - CI/CD configuration with Firebase emulator setup

### Development Guidelines
- Follow the scene-based architecture pattern
- Use page object pattern for tests (see `tests/lib/`)
- Ensure Firebase operations are properly awaited
- Follow the established locator strategies in testing
- Test multi-user real-time scenarios

## Important Notes
- Read the complete guides in `CLAUDE.md` and `TESTING.md` for detailed implementation patterns
- Firebase emulator configuration is essential for testing - reference the CI workflow
- The codebase uses modern React patterns and requires specific Node.js version
- All testing should follow the established page object architecture