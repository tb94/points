const { User } = require("../db/models");

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
        User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guild.id } });

        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: `There was an error executing command: ${command.name}`, ephemeral: true });
        }
	}
};