import { Client, GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import { setupCommands } from "./commands/index.js";
import { setupScheduler } from "./services/scheduler.js";
import { loadConfig } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { initializeOpenAI } from "./services/summarizer.js";

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  logger.error(
    "DISCORD_TOKEN is required but not found in environment variables"
  );
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  logger.error(
    "OPENAI_API_KEY is required but not found in environment variables"
  );
  process.exit(1);
}

// Initialize OpenAI client
initializeOpenAI();

// Initialize the Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  // Add reconnection options
  failIfNotExists: false,
  retryLimit: 5,
  presence: {
    status: "online",
  },
});

// Setup Express server for keeping the bot alive on Replit
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("TLDR Bot is running!");
});

app.listen(PORT, () => {
  logger.info(`Keep-alive server running on port ${PORT}`);
});

// Handle client ready event
client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Logged in as ${readyClient.user.tag}`);

  // Load configuration
  await loadConfig();

  // Setup commands
  setupCommands(client);

  // Setup scheduler for hourly summaries
  setupScheduler(client);
});

// Handle errors and reconnection
client.on(Events.Error, (error) => {
  logger.error("Discord client error:", error);
});

client.on(Events.Disconnect, () => {
  logger.warn("Bot disconnected from Discord, attempting to reconnect...");
});

client.on(Events.Reconnecting, () => {
  logger.info("Bot is reconnecting to Discord...");
});

client.on(Events.Resume, (replayed) => {
  logger.info(`Bot reconnected to Discord! Replayed ${replayed} events.`);
});

// Login to Discord with better error handling
try {
  await client.login(process.env.DISCORD_TOKEN).catch((error) => {
    logger.error("Failed to login to Discord:", error);
    process.exit(1);
  });
} catch (error) {
  logger.error("Critical error during Discord login:", error);
  process.exit(1);
}

// Handle process termination
process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
});
