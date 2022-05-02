const { User } = require("../db/models");
const { BlackjackGame } = require("../games/blackjack");

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
        if (!interaction.user.bot)
        User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guild.id } });

        switch (true) {
            case interaction.isCommand():
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (err) {
                    console.error(err);
                    await interaction.reply({ content: `There was an error executing command: ${command.name}`, ephemeral: true });
                }
                break;
            case interaction.isButton():
                switch (interaction.message.content) {
                    case "Blackjack":
                        interaction.deferUpdate();
                        BlackjackGame.buttonInteraction(interaction);
                        break;
                    default:
                        // interaction.update({ content: `Sorry, something went wrong`, ephemeral: true });
                        break;
                }
                break;
            case interaction.isSelectMenu():
                console.log(interaction);
                break;
            default:
                break;
        }
    }
};