# Cross-Platform Architecture Plan for Raycast-Cron

## Current State
- **Primary Platform:** macOS (Raycast extension)
- **Implementation:** React + TypeScript with @raycast/api
- **OpenClaw Integration:** CLI-based API calls

## Cross-Platform Strategy

### 1. Core Architecture Principles

#### Platform Abstraction Layer
```
src/
├── platforms/
│   ├── base/           # Common interfaces and types
│   ├── raycast/        # Raycast-specific implementation
│   ├── powerToys/     # Windows PowerToys Run implementation
│   └── terminal/      # Terminal-based fallback
```

#### Component Structure
```typescript
// Platform-agnostic components
src/components/
├── CronBuilder.tsx      # Works on any platform
├── JobList.tsx          # Works on any platform  
├── JobDetails.tsx       # Works on any platform
└── common/
    ├── types.ts        # Shared TypeScript types
    ├── hooks.ts        # Shared React hooks
    └── utils.ts         # Shared utilities
```

### 2. Target Platforms

#### A. Raycast (macOS) - Current Implementation
- **Status:** Complete
- **UI:** Raycast extension with Form components
- **API:** Direct CLI calls via exec
- **Auth:** OpenClaw configuration files

#### B. PowerToys Run (Windows) - Future Target
- **UI:** Similar React component structure
- **API:** Same CLI calls (OpenClaw cross-platform)
- **Differences:**
  - Different manifest.json structure
  - Different icon requirements
  - Different packaging process
  - Different installation method

#### C. Terminal/Web Interface - Universal Fallback
- **UI:** Terminal-based or React web app
- **API:** Same CLI calls
- **Features:**
  - Cross-platform compatibility
  - No GUI framework dependency
  - Scriptable automation support

### 3. Implementation Strategy

#### Phase 1: Platform Abstraction (Current)
- Extract common logic from Raycast implementation
- Create platform-agnostic components
- Define interface contracts

#### Phase 2: PowerToys Run Implementation
- Create PowerToys-specific manifest and build process
- Adapt UI for PowerToys Run constraints
- Test on Windows environment

#### Phase 3: Terminal/Web Interface
- Create CLI version for terminal usage
- Implement basic web interface option
- Ensure all features work without GUI dependencies

### 4. Key Technical Decisions

#### Configuration Management
```typescript
// Platform-agnostic config
interface CronAppConfig {
  openclaw: {
    url?: string;
    token?: string;
    profile?: string;
  };
  platform: 'raycast' | 'powerToys' | 'terminal';
  theme: 'light' | 'dark' | 'auto';
}

// Platform-specific config loaders
class ConfigManager {
  static loadForPlatform(platform: Platform): CronAppConfig {
    // Platform-specific logic for loading config
  }
}
```

#### API Integration
```typescript
// Platform-agnostic API client
class CronApiClient {
  private platform: Platform;
  
  constructor(platform: Platform) {
    this.platform = platform;
  }
  
  // All API methods work the same regardless of platform
  async listJobs() { /* ... */ }
  async createJob() { /* ... */ }
  // etc.
}
```

#### UI Components
```typescript
// Conditional rendering based on platform
function PlatformButton({ children, onClick }) {
  if (platform === 'raycast') {
    return <Raycast.Button onClick={onClick}>{children}</Raycast.Button>;
  } else if (platform === 'powerToys') {
    return <PowerToys.Button onClick={onClick}>{children}</PowerToys.Button>;
  } else {
    return <button onClick={onClick}>{children}</button>;
  }
}
```

### 5. Build and Distribution

#### Platform-Specific Builds
```json
// package.json scripts
{
  "scripts": {
    "build:raycast": "ray build",
    "build:powerToys": "npm run build:powerToys",
    "build:terminal": "npm run build:terminal",
    "build:all": "npm run build:raycast && npm run build:powerToys && npm run build:terminal"
  }
}
```

#### Distribution Channels
- **Raycast:** Raycast extensions store
- **PowerToys:** GitHub releases, winget package
- **Terminal:** npm package, GitHub releases
- **Web:** Vercel/Netlify static deployment

### 6. Migration Path

#### Current to Future Architecture
1. **Extract common logic** from current Raycast implementation
2. **Create platform interfaces** and base components
3. **Implement Raycast adapter** (existing code becomes adapter)
4. **Add PowerToys adapter** as new platform
5. **Add terminal adapter** as universal fallback

#### Benefits of This Approach
- **Maintainability:** Common code, platform-specific isolates
- **Testability:** Can test core logic independent of platform
- **Extensibility:** Easy to add new platforms
- **User Experience:** Consistent features across platforms
- **Development:** Faster iterations on individual platforms

### 7. Future Considerations

#### Mobile Support
- **iOS:** Shortcuts app integration
- **Android:** Tasker/automation apps
- **Approach:** Focus on CLI interface for mobile automation

#### Cloud/Web Version
- **Web-based UI:** React web application
- **Same API:** Leverage existing OpenClaw integration
- **Benefits:** Cross-platform, no installation required

#### Desktop Integration
- **System tray:** Background process for status monitoring
- **Notifications:** Desktop notifications for job failures
- **Menu bar:** Quick access to common operations

This architecture ensures the cron management functionality remains consistent while adapting to different platforms and user preferences.