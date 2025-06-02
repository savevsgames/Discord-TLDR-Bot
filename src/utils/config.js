import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '../../config.json');

// Default configuration
const defaultConfig = {
  summaryChannelId: process.env.SUMMARY_CHANNEL_ID || null,
  monitoredChannelIds: process.env.MONITORED_CHANNEL_IDS 
    ? process.env.MONITORED_CHANNEL_IDS.split(',') 
    : [],
  lastSummaryTime: null,
};

// Global configuration object
let config = { ...defaultConfig };

/**
 * Load configuration from file or create default
 */
export async function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const fileData = await fs.readFile(CONFIG_PATH, 'utf8');
      const loadedConfig = JSON.parse(fileData);
      config = { ...defaultConfig, ...loadedConfig };
      logger.info('Configuration loaded successfully');
    } else {
      logger.info('No configuration file found, using defaults');
      await saveConfig();
    }
    return config;
  } catch (error) {
    logger.error('Error loading configuration:', error);
    await saveConfig();
    return config;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig() {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    logger.info('Configuration saved successfully');
    return true;
  } catch (error) {
    logger.error('Error saving configuration:', error);
    return false;
  }
}

/**
 * Get the current configuration
 */
export function getConfig() {
  return { ...config };
}

/**
 * Update configuration
 * @param {Object} newConfig - New configuration values
 */
export async function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  return saveConfig();
}

/**
 * Add a channel to monitored channels
 * @param {string} channelId - Channel ID to add
 */
export async function addMonitoredChannel(channelId) {
  if (!config.monitoredChannelIds.includes(channelId)) {
    config.monitoredChannelIds.push(channelId);
    return saveConfig();
  }
  return true;
}

/**
 * Remove a channel from monitored channels
 * @param {string} channelId - Channel ID to remove
 */
export async function removeMonitoredChannel(channelId) {
  config.monitoredChannelIds = config.monitoredChannelIds.filter(id => id !== channelId);
  return saveConfig();
}

/**
 * Set the summary channel
 * @param {string} channelId - Channel ID for summaries
 */
export async function setSummaryChannel(channelId) {
  config.summaryChannelId = channelId;
  return saveConfig();
}

/**
 * Update the last summary time
 * @param {Date} time - Time of the last summary
 */
export async function updateLastSummaryTime(time = new Date()) {
  config.lastSummaryTime = time.toISOString();
  return saveConfig();
}