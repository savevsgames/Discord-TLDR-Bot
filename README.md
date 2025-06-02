# TLDR Bot

TLDR Bot is a Discord bot that helps development teams and project communities stay informed by summarizing conversations. The bot reads messages from configured channels and posts a summary to a designated channel using OpenAI's language models.

## Features

- **Automated Hourly Summaries**: Fetches messages from configured channels every hour and sends summaries to a designated channel.
- **On-Demand Summary**: Generate a summary of the last hour immediately with the `/tldr now` command.
- **Configuration**: Add/remove monitored channels and set the summary output channel with the `/tldr config` command.
- **Help**: Get usage instructions with the `/tldr help` command.

## Setup

### Prerequisites

- Node.js (v16.9.0 or higher)
- A Discord Bot Token
- An OpenAI API Key

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/tldr-bot.git
   cd tldr-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the bot:
   ```
   npm start
   ```

### Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and add a bot
3. Enable the Message Content Intent
4. Invite the bot to your server with the following permissions:
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
   - Use Slash Commands

## Usage

### Commands

- `/tldr now` - Generate a summary for the last hour immediately
- `/tldr config list` - Show current configuration
- `/tldr config add [channel]` - Add a channel to be monitored
- `/tldr config remove [channel]` - Remove a channel from monitoring
- `/tldr config set [channel]` - Set the channel where summaries will be posted
- `/tldr help` - Show help information

### Deployment on Replit

1. Create a new Replit project
2. Upload the bot files or clone the repository
3. Add the environment variables in the Secrets tab
4. Run the bot with `npm start`

## License

MIT

## Acknowledgements

- [Discord.js](https://discord.js.org/)
- [OpenAI](https://openai.com/)
- [node-cron](https://github.com/node-cron/node-cron)