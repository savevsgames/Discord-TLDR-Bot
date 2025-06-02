import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getConfig, addMonitoredChannel, removeMonitoredChannel, setSummaryChannel } from '../utils/config.js';
import { createSummary } from '../services/summarizer.js';
import { logger } from '../utils/logger.js';

/**
 * Register the TLDR command
 */
export function registerTldrCommand() {
  return new SlashCommandBuilder()
    .setName('tldr')
    .setDescription('TLDR Bot commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('now')
        .setDescription('Generate a summary for the last hour')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('help')
        .setDescription('Show help information for TLDR Bot')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('config')
        .setDescription('Configure TLDR Bot')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Configuration action')
            .setRequired(true)
            .addChoices(
              { name: 'list', value: 'list' },
              { name: 'add', value: 'add' },
              { name: 'remove', value: 'remove' },
              { name: 'set', value: 'set' }
            )
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to configure')
            .setRequired(false)
        )
    )
    .toJSON();
}

/**
 * Handle TLDR subcommands
 * @param {Interaction} interaction - Discord.js interaction
 * @param {string} subcommand - Subcommand to handle
 */
export async function handleTldrSubcommand(interaction, subcommand) {
  switch (subcommand) {
    case 'now':
      await handleNowSubcommand(interaction);
      break;
    case 'help':
      await handleHelpSubcommand(interaction);
      break;
    case 'config':
      await handleConfigSubcommand(interaction);
      break;
    default:
      await interaction.reply({
        content: 'Unknown subcommand.',
        ephemeral: true,
      });
  }
}

/**
 * Handle the "now" subcommand to generate an immediate summary
 * @param {Interaction} interaction - Discord.js interaction
 */
async function handleNowSubcommand(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Check if there's a summary channel configured
    const config = getConfig();
    if (!config.summaryChannelId) {
      return await interaction.editReply({
        content: 'No summary channel configured. Use `/tldr config set` to set one.',
      });
    }
    
    if (config.monitoredChannelIds.length === 0) {
      return await interaction.editReply({
        content: 'No channels are being monitored. Use `/tldr config add` to add channels.',
      });
    }
    
    // Create and post the summary
    const success = await createSummary(interaction.client);
    
    if (success) {
      await interaction.editReply({
        content: 'Summary generated and posted to the summary channel.',
      });
    } else {
      await interaction.editReply({
        content: 'Failed to generate a summary. Please check the logs for more information.',
      });
    }
  } catch (error) {
    logger.error('Error handling now subcommand:', error);
    await interaction.editReply({
      content: 'An error occurred while generating the summary.',
    });
  }
}

/**
 * Handle the "help" subcommand
 * @param {Interaction} interaction - Discord.js interaction
 */
async function handleHelpSubcommand(interaction) {
  const helpEmbed = {
    color: 0x5865F2,
    title: 'TLDR Bot Help',
    description: 'TLDR Bot summarizes conversations in your Discord server.',
    fields: [
      {
        name: '/tldr now',
        value: 'Generate a summary for the last hour immediately.',
      },
      {
        name: '/tldr config list',
        value: 'Show current configuration including monitored channels and summary channel.',
      },
      {
        name: '/tldr config add [channel]',
        value: 'Add a channel to be monitored for summaries.',
      },
      {
        name: '/tldr config remove [channel]',
        value: 'Remove a channel from being monitored.',
      },
      {
        name: '/tldr config set [channel]',
        value: 'Set the channel where summaries will be posted.',
      },
      {
        name: '/tldr help',
        value: 'Show this help message.',
      },
    ],
    footer: {
      text: 'TLDR Bot - Hourly summaries made easy',
    },
  };

  await interaction.reply({
    embeds: [helpEmbed],
    ephemeral: true,
  });
}

/**
 * Handle the "config" subcommand
 * @param {Interaction} interaction - Discord.js interaction
 */
async function handleConfigSubcommand(interaction) {
  // Check if user has administrator permissions
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: 'You need administrator permissions to configure TLDR Bot.',
      ephemeral: true,
    });
  }

  const action = interaction.options.getString('action');
  const channel = interaction.options.getChannel('channel');
  const config = getConfig();

  switch (action) {
    case 'list':
      await handleConfigList(interaction, config);
      break;
    case 'add':
      await handleConfigAdd(interaction, channel, config);
      break;
    case 'remove':
      await handleConfigRemove(interaction, channel, config);
      break;
    case 'set':
      await handleConfigSet(interaction, channel, config);
      break;
    default:
      await interaction.reply({
        content: 'Unknown configuration action.',
        ephemeral: true,
      });
  }
}

/**
 * Handle the "config list" action
 * @param {Interaction} interaction - Discord.js interaction
 * @param {Object} config - Current configuration
 */
async function handleConfigList(interaction, config) {
  const { summaryChannelId, monitoredChannelIds } = config;
  
  const summaryChannel = summaryChannelId 
    ? `<#${summaryChannelId}>` 
    : 'Not configured';
  
  const monitoredChannels = monitoredChannelIds.length > 0
    ? monitoredChannelIds.map(id => `<#${id}>`).join('\n')
    : 'No channels are being monitored';
  
  const configEmbed = {
    color: 0x5865F2,
    title: 'TLDR Bot Configuration',
    fields: [
      {
        name: 'Summary Channel',
        value: summaryChannel,
      },
      {
        name: 'Monitored Channels',
        value: monitoredChannels,
      },
    ],
  };

  await interaction.reply({
    embeds: [configEmbed],
    ephemeral: true,
  });
}

/**
 * Handle the "config add" action
 * @param {Interaction} interaction - Discord.js interaction
 * @param {Channel} channel - Channel to add
 * @param {Object} config - Current configuration
 */
async function handleConfigAdd(interaction, channel, config) {
  if (!channel) {
    return await interaction.reply({
      content: 'You need to specify a channel to add.',
      ephemeral: true,
    });
  }
  
  // Only allow text channels
  if (!channel.isTextBased()) {
    return await interaction.reply({
      content: 'Only text channels can be monitored.',
      ephemeral: true,
    });
  }
  
  // Check if channel is already being monitored
  if (config.monitoredChannelIds.includes(channel.id)) {
    return await interaction.reply({
      content: `${channel} is already being monitored.`,
      ephemeral: true,
    });
  }
  
  // Add channel to monitored channels
  const success = await addMonitoredChannel(channel.id);
  
  if (success) {
    await interaction.reply({
      content: `${channel} has been added to monitored channels.`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: `Failed to add ${channel} to monitored channels.`,
      ephemeral: true,
    });
  }
}

/**
 * Handle the "config remove" action
 * @param {Interaction} interaction - Discord.js interaction
 * @param {Channel} channel - Channel to remove
 * @param {Object} config - Current configuration
 */
async function handleConfigRemove(interaction, channel, config) {
  if (!channel) {
    return await interaction.reply({
      content: 'You need to specify a channel to remove.',
      ephemeral: true,
    });
  }
  
  // Check if channel is being monitored
  if (!config.monitoredChannelIds.includes(channel.id)) {
    return await interaction.reply({
      content: `${channel} is not being monitored.`,
      ephemeral: true,
    });
  }
  
  // Remove channel from monitored channels
  const success = await removeMonitoredChannel(channel.id);
  
  if (success) {
    await interaction.reply({
      content: `${channel} has been removed from monitored channels.`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: `Failed to remove ${channel} from monitored channels.`,
      ephemeral: true,
    });
  }
}

/**
 * Handle the "config set" action
 * @param {Interaction} interaction - Discord.js interaction
 * @param {Channel} channel - Channel to set as summary channel
 * @param {Object} config - Current configuration
 */
async function handleConfigSet(interaction, channel, config) {
  if (!channel) {
    return await interaction.reply({
      content: 'You need to specify a channel to set as the summary channel.',
      ephemeral: true,
    });
  }
  
  // Only allow text channels
  if (!channel.isTextBased()) {
    return await interaction.reply({
      content: 'Only text channels can be set as the summary channel.',
      ephemeral: true,
    });
  }
  
  // Set summary channel
  const success = await setSummaryChannel(channel.id);
  
  if (success) {
    await interaction.reply({
      content: `${channel} has been set as the summary channel.`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: `Failed to set ${channel} as the summary channel.`,
      ephemeral: true,
    });
  }
}