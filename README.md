# Raycast Cron Extension

A Raycast extension for cron expression management and OpenClaw integration.

## Features

- **🔄 Cron Expression Builder**: Build cron expressions with an interactive UI
- **🗣️ Natural Language Parsing**: Convert phrases like "every Monday at 9am" to cron expressions
- **🔗 OpenClaw Integration**: Create, manage, and monitor OpenClaw cron jobs
- **👀 Real-time Preview**: See human-readable descriptions as you build expressions
- **⚡ Job Management**: Enable, disable, delete, and run cron jobs
- **🔍 Connection Status**: Monitor OpenClaw gateway connectivity

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/luinbytes/raycast-cron.git
   cd raycast-cron
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Open in Raycast:
   ```bash
   npm run dev
   ```

## Usage

### 📋 Job Listing View

The main interface shows all your OpenClaw cron jobs with:
- Job names and descriptions
- Cron expressions
- Enable/disable status
- Quick actions (run, edit, delete)

### 🔧 Cron Builder

Create new cron jobs with the interactive builder:
- **Quick Presets**: Select from common patterns
- **Manual Input**: Fine-tune each cron field
- **Natural Language**: Type phrases like "every Monday at 9am"
- **Live Preview**: See human-readable descriptions instantly

### 🗣️ Natural Language Examples

The extension supports these natural language patterns:

| Phrase | Cron Expression | Description |
|--------|----------------|-------------|
| "every Monday at 9am" | `0 9 * * 1` | Every Monday at 9:00 AM |
| "daily at midnight" | `0 0 * * *` | Every day at 12:00 AM |
| "every 2 hours" | `0 */2 * * *` | Every 2 hours |
| "weekdays at noon" | `0 12 * * 1-5` | Monday to Friday at 12:00 PM |
| "weekends at noon" | `0 12 * * 0,6` | Saturday and Sunday at 12:00 PM |
| "first day of month" | `0 0 1 * *` | First day of each month |
| "every 30 minutes" | `*/30 * * * *` | Every 30 minutes |

### 🎯 Quick Actions

- **Run Now**: Execute a cron job immediately for testing
- **Enable/Disable**: Toggle job execution status
- **Delete**: Remove jobs with confirmation
- **Edit**: Modify existing expressions (coming soon)

## Configuration

OpenClaw integration requires the following environment variables:

- `OPENCLAW_GATEWAY_URL`: URL to your OpenClaw gateway
- `OPENCLAW_TOKEN`: Authentication token for OpenClaw API

## Architecture

- `src/index.tsx`: Main extension entry point and job listing
- `src/lib/`: Utility functions and OpenClaw API client
- `src/components/`: Reusable UI components

## Development

```bash
npm run dev    # Start development mode
npm run lint   # Run linting
npm run fix-lint  # Fix linting issues
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.