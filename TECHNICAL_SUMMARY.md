# TLDR Bot - Technical Documentation

## Architecture Overview

TLDR Bot is built using a modular architecture with clear separation of concerns. The application is structured around core services and utilities that handle different aspects of the bot's functionality.

## Core Technologies

### Runtime Environment
- **Node.js**: Server-side JavaScript runtime
- **ES Modules**: Modern JavaScript module system

### Primary Dependencies
- **discord.js v14**: Core Discord bot functionality
  - Handles WebSocket connections
  - Manages slash commands
  - Processes message events
  - Supports rich embeds
- **OpenAI API**: GPT-3.5 Turbo for message summarization
- **node-cron**: Scheduled task execution
- **dotenv**: Environment variable management
- **Express**: (Optional) Keep-alive server for hosting platforms

## Authentication & Security

### Discord Authentication
- Uses Bot Token authentication
- Required Intents:
  - `GatewayIntentBits.Guilds`
  - `GatewayIntentBits.GuildMessages`
  - `GatewayIntentBits.MessageContent`
- Implements automatic reconnection handling
- Configurable retry limits

### OpenAI Authentication
- Uses API Key authentication
- Lazy initialization pattern
- Error handling for missing credentials

## System Components

### Command Handler (`src/commands/`)
- Implements slash command registration
- Supports subcommands:
  - `/tldr now`: Immediate summary generation
  - `/tldr config`: Bot configuration
  - `/tldr help`: Usage information
- Permission-based command access

### Summarizer Service (`src/services/summarizer.js`)
- Message fetching and processing
- OpenAI integration for summary generation
- Customizable prompt engineering
- Rate limit handling
- Error recovery

### Scheduler Service (`src/services/scheduler.js`)
- Cron-based scheduling
- Configurable intervals
- Job management
- Error handling and recovery

### Configuration Management (`src/utils/config.js`)
- JSON-based configuration storage
- Environment variable integration
- Dynamic configuration updates
- Persistence handling

### Logging System (`src/utils/logger.js`)
- Timestamp-based logging
- Multiple log levels (ERROR, WARN, INFO, DEBUG)
- Environment-aware logging
- Structured output format

## Data Flow

1. **Message Collection**
   - Fetches messages from monitored channels
   - Filters by timestamp and bot messages
   - Handles pagination for large message sets

2. **Message Processing**
   - Formats messages for AI processing
   - Maintains conversation context
   - Handles special message types

3. **Summary Generation**
   - Sends formatted messages to OpenAI
   - Processes AI response
   - Formats summary for Discord

4. **Summary Distribution**
   - Creates rich embeds
   - Posts to designated channel
   - Handles posting errors

## Error Handling

### Discord Connection
- Automatic reconnection
- Event replay on reconnect
- Connection state logging
- Graceful degradation

### OpenAI Integration
- API error handling
- Rate limit management
- Fallback strategies
- Error reporting

### Configuration Errors
- Validation on load
- Fallback to defaults
- Save failure recovery
- Configuration integrity checks

## Performance Considerations

### Message Fetching
- Implements pagination
- Respects Discord API rate limits
- Optimizes fetch window size
- Caches where appropriate

### Summary Generation
- Batches messages efficiently
- Manages token limits
- Implements retry logic
- Handles timeouts

### Resource Usage
- Minimal memory footprint
- Efficient CPU utilization
- Controlled API usage
- Optimized storage

## Deployment

### Environment Variables
Required:
```env
DISCORD_TOKEN=your_bot_token
OPENAI_API_KEY=your_openai_key
```

Optional:
```env
LOG_LEVEL=INFO
SUMMARY_CHANNEL_ID=channel_id
MONITORED_CHANNEL_IDS=id1,id2,id3
```

### Platform Considerations
- Supports containerization
- Compatible with serverless
- Handles platform restarts
- Manages state persistence

## Monitoring & Maintenance

### Health Checks
- Discord connection status
- OpenAI API availability
- Configuration integrity
- Job scheduler status

### Logging Strategy
- Structured logging
- Error tracking
- Performance metrics
- Usage statistics

### Recovery Procedures
- Automatic reconnection
- Configuration reload
- Job rescheduling
- Error reporting

## Future Considerations

### Scalability
- Multiple guild support
- Message volume handling
- Configuration distribution
- Resource optimization

### Feature Expansion
- Additional summary types
- Custom prompt templates
- Enhanced configuration
- Analytics integration