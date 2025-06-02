import { REST, Routes } from 'discord.js';
import { logger } from '../utils/logger.js';
import { registerTldrCommand } from './tldrCommand.js';

/**
 * Setup all commands for the bot
 * @param {Client} client - Discord.js client
 */
export async function setupCommands(client) {
  try {
    const commands = [
      registerTldrCommand(),
    ];

    logger.info('Registering slash commands...');

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    // Register commands globally (for production)
    // If you want to register commands per guild for testing, you can use:
    // Routes.applicationGuildCommands(client.user.id, 'YOUR_GUILD_ID_HERE')
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );

    logger.info('Slash commands registered successfully');

    // Handle command interactions
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'tldr') {
        try {
          await handleTldrCommand(interaction);
        } catch (error) {
          logger.error('Error handling tldr command:', error);
          
          // Respond to the user if we haven't already
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'An error occurred while processing your command.',
              ephemeral: true,
            });
          } else if (interaction.deferred && !interaction.replied) {
            await interaction.editReply({
              content: 'An error occurred while processing your command.',
            });
          }
        }
      }
    });
  } catch (error) {
    logger.error('Error setting up commands:', error);
  }
}

/**
 * Handle the tldr command
 * @param {Interaction} interaction - Discord.js interaction
 */
async function handleTldrCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  // Import the handler dynamically to avoid circular dependencies
  const { handleTldrSubcommand } = await import('./tldrCommand.js');
  await handleTldrSubcommand(interaction, subcommand);
}