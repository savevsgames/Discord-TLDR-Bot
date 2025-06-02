import { EmbedBuilder } from 'discord.js';
import OpenAI from 'openai';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

// Initialize OpenAI client as null initially
let openai = null;

/**
 * Initialize the OpenAI client with the API key
 */
export function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  logger.info('OpenAI client initialized');
}

/**
 * Create a summary of messages from monitored channels
 * @param {Client} client - Discord.js client
 * @returns {boolean} - Whether the summary was created and posted successfully
 */
export async function createSummary(client) {
  try {
    const config = getConfig();
    const { summaryChannelId, monitoredChannelIds, lastSummaryTime } = config;
    
    // Check if there's a summary channel
    const summaryChannel = await client.channels.fetch(summaryChannelId);
    if (!summaryChannel) {
      logger.error('Summary channel not found');
      return false;
    }
    
    // Set the time period for messages (last hour or since last summary)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const startTime = lastSummaryTime ? new Date(lastSummaryTime) : oneHourAgo;
    
    // Fetch messages from all monitored channels
    const channelSummaries = [];
    let totalMessages = 0;
    
    for (const channelId of monitoredChannelIds) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) continue;
        
        // Fetch messages since the start time
        const messages = await fetchMessages(channel, startTime);
        
        if (messages.length > 0) {
          channelSummaries.push({
            channelId,
            channelName: channel.name,
            messages,
          });
          totalMessages += messages.length;
        }
      } catch (error) {
        logger.error(`Error fetching messages from channel ${channelId}:`, error);
      }
    }
    
    // If no messages were found, don't create a summary
    if (totalMessages === 0) {
      logger.info('No new messages found in monitored channels. Skipping summary.');
      return true; // Return true because this is not an error
    }
    
    // Create summaries for each channel
    const summaryEmbeds = [];
    
    for (const channelData of channelSummaries) {
      const { channelId, channelName, messages } = channelData;
      
      if (messages.length > 0) {
        // Format messages for the AI
        const formattedMessages = formatMessagesForAI(messages);
        
        // Generate a summary using OpenAI
        const summary = await generateSummary(formattedMessages, channelName);
        
        if (summary) {
          // Create an embed for the channel summary
          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`Summary for #${channelName}`)
            .setDescription(summary)
            .setFooter({
              text: `${messages.length} messages summarized • ${new Date().toLocaleString()}`,
            });
          
          summaryEmbeds.push(embed);
        }
      }
    }
    
    // If we have summaries, post them to the summary channel
    if (summaryEmbeds.length > 0) {
      const header = `# TLDR Summary ${new Date().toLocaleString()}`;
      await summaryChannel.send({ content: header, embeds: summaryEmbeds });
      logger.info('Summary posted to summary channel');
      return true;
    } else {
      logger.warn('No summaries were generated');
      return false;
    }
  } catch (error) {
    logger.error('Error creating summary:', error);
    return false;
  }
}

/**
 * Fetch messages from a channel since a specific time
 * @param {TextChannel} channel - Discord.js text channel
 * @param {Date} startTime - Start time for messages
 * @returns {Array} - Array of messages
 */
async function fetchMessages(channel, startTime) {
  const messages = [];
  let lastId;
  
  // Discord API allows fetching up to 100 messages at a time
  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    
    const fetchedMessages = await channel.messages.fetch(options);
    if (fetchedMessages.size === 0) break;
    
    // Filter messages by time and add them to the array
    fetchedMessages.forEach(msg => {
      if (msg.createdAt > startTime && !msg.author.bot) {
        messages.push(msg);
      }
    });
    
    // If we have fetched messages older than the start time, we can stop
    const oldestMessage = fetchedMessages.last();
    if (oldestMessage.createdAt < startTime) break;
    
    lastId = fetchedMessages.last().id;
    
    // If we have less than 100 messages, we've reached the end
    if (fetchedMessages.size < 100) break;
  }
  
  // Sort messages by timestamp (oldest first)
  return messages.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Format messages for the OpenAI API
 * @param {Array} messages - Array of Discord.js messages
 * @returns {string} - Formatted messages
 */
function formatMessagesForAI(messages) {
  return messages.map(msg => {
    const timestamp = msg.createdAt.toLocaleTimeString();
    return `[${timestamp}] ${msg.author.username}: ${msg.content}`;
  }).join('\n');
}

/**
 * Generate a summary using OpenAI
 * @param {string} messagesText - Formatted messages
 * @param {string} channelName - Name of the channel
 * @returns {string} - Generated summary
 */
async function generateSummary(messagesText, channelName) {
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `Summarize the following Discord chat from the #${channelName} channel. Focus on the main topics, key points, and any decisions or action items. Keep the summary concise but informative:

${messagesText}

Summary:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes Discord conversations accurately and concisely.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    logger.error('Error generating summary with OpenAI:', error);
    return null;
  }
}