# Raycast Cron Extension

A Raycast extension for cron expression management and OpenClaw integration.

## Features

- **Cron Expression Builder**: Build cron expressions with an interactive UI
- **Natural Language Parsing**: Convert phrases like "every Monday at 9am" to cron expressions
- **OpenClaw Integration**: Create, manage, and monitor OpenClaw cron jobs
- **Real-time Preview**: See human-readable descriptions as you build expressions

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

### Basic Commands

- **List Cron Jobs**: View all OpenClaw cron jobs
- **Create Job**: Build a new cron expression and create a job
- **Edit Job**: Modify existing cron jobs
- **Delete Job**: Remove cron jobs

### Natural Language Support

The extension supports natural language parsing for common patterns:

- "every Monday at 9am" → `0 9 * * 1`
- "daily at midnight" → `0 0 * * *`
- "every 2 hours" → `0 */2 * * *`
- "weekdays at noon" → `0 12 * * 1-5`
- "first day of every month" → `0 0 1 * *`

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