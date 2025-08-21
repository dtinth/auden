# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auden is an open-source, hackable audience engagement platform for events, supporting live quizzes and voting systems. It was originally built for "Code in the Dark Thailand #3: CNX 2019" to enable real-time audience participation without requiring multiple separate tools.

## Development Commands

### Main Application
- `yarn install` - Install dependencies
- `yarn start` - Start development server on localhost:3000
- `yarn build` - Build for production
- `yarn test` - Run tests

### E2E Testing
- `cd e2e && yarn install` - Install E2E test dependencies
- `cd e2e && yarn playwright install` - Install browser dependencies
- `cd e2e && yarn playwright test` - Run E2E tests

### Deployment
- `yarn build` - Build for production (for Netlify hosting)
- `firebase deploy` - Deploy Firebase database rules only

## Architecture

### Technology Stack
- **Frontend**: React 16.13.1 + TypeScript, Grommet UI framework
- **State Management**: React Hooks with Firebase real-time updates via `fiery` library
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Facebook login) + Eventpop integration via external service
- **Build**: Create React App (react-scripts 3.4.3)
- **Node Version**: 16.20.0 (main app), 22.18.0 (E2E tests)

### Core Routing Pattern
Uses React Router with hash routing:
- `#/` - Audience view (mobile-optimized for participants)
- `#/display` - Presentation view (for projectors/screens)
- `#/admin` - Backstage management (admin-only)

### Scene-Based Architecture
Each feature is a "scene" with three components:
1. **Audience Component** - Mobile UI for participant interaction
2. **Presentation Component** - Large screen display
3. **Backstage Component** - Admin controls

Available scenes: `quiz` (Kahoot-style), `vote` (Mentimeter-style), `freestyle` (flexible)

### Firebase Data Structure
```
/admins/{uid} - Admin user flags
/currentScene - Active scene name
/currentScreen - Active screen ID
/screenData/{screenId}/ - Scene data with access patterns:
  - public-read/ - Read by all, write by admins
  - personal/ - Read by all, write by owner
  - events/ - Append-only event logs
  - private/ - Owner access only
  - inbox/ - Assigned data per user
  - secret/ - Admin-only access
```

## Key Files and Directories

### Configuration
- `src/config.ts` - Firebase config and scene registration
- `firebase.json` - Firebase database rules configuration
- `database.rules.bolt` - Firebase security rules
- `.nvmrc` - Node.js version specification

### Core Application Structure
- `src/core/app/` - Main app components (routing, auth, data connectors)
- `src/core/ui/` - Shared UI components and theme
- `src/core/model/` - TypeScript interfaces and data models
- `src/scenes/` - Feature implementations (quiz, vote, freestyle)

### Scene Implementation Pattern
Each scene in `src/scenes/{name}/` contains:
- `index.tsx` - Scene definition and exports
- `{Name}Audience.tsx` - Participant interface
- `{Name}Presentation.tsx` - Display screen component  
- `{Name}Backstage.tsx` - Admin controls

## Development Notes

### Adding New Scenes
1. Create directory in `src/scenes/{sceneName}/`
2. Implement Audience, Presentation, and Backstage components
3. Export scene definition in `index.tsx`
4. Register in `src/config.ts` scenes array

### Firebase Setup Requirements
1. Set up Firebase Authentication (Facebook provider)
2. Make initial user admin by setting `/admins/{uid}` to `true` in database
3. Deploy Firebase security rules from `database.rules.bolt`

### Authentication Flow
- All users must authenticate via Facebook
- Admin status determined by `/admins/{uid}` database entry
- Admins have read/write access to all data
- Regular users have structured access per security rules
- Eventpop ticket authentication handled by external service: https://github.com/dtinth/auden-eventpop

### Legacy Considerations
- Uses older React patterns and Firebase SDK v7
- Node.js 16.20.0 required for main app (specified in `.nvmrc`)
- Some TypeScript warnings exist (temporarily ignored in CI via `CI=false`)
- Consider upgrading to newer React patterns and Firebase SDK v9+ during modernization

### Testing
- E2E tests use Playwright with Node.js 22.18.0
- Tests run against built static files served on localhost:3000
- CI configured with full recording (traces, screenshots, videos)