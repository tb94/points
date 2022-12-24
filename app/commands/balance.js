const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../db/models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Gets a user\'s balance')
		.addUserOption(o => o
			.setName('user')
			.setDescription('Whose balance to check')),
	async execute(interaction, user) {
		const target = await interaction.options.getUser('user') ?? interaction.user;

		if (target.bot) return interaction.reply({ content: `${target} cannot earn points`, ephemeral: true });

		if (target.id != interaction.user.id) {
			[user] = await User.findCreateFind({
				where: { snowflake: target.id, guild: interaction.guildId },
				defaults: { username: target.tag }
			});
		}

		return interaction.reply(`${target} has ${user.balance} 💰`);
	}
}