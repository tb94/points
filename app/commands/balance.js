const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { User } = require('../db/models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Gets a user\'s balance')
		.addUserOption(o => o
			.setName('user')
			.setDescription('Whose balance to check')),
	async execute(interaction) {
		const target = await interaction.options.getUser('user') ?? interaction.user;

		if (target.bot) {
			interaction.reply({ content: `${target} cannot earn points`, ephemeral: true });
		} else {
			User.findCreateFind({ where: { username: target.tag, guild: interaction.guildId } })
				.then(([u]) => interaction.reply(`${target} has ${u.balance} 💰`))
				.catch(err => console.error(err));
		}
	},
};

// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files