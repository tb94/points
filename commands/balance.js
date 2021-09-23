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
		const target = interaction.options.getUser('user') ?? interaction.user;
		await interaction.reply(`${target} has ${currency.getBalance(target.id)} 💰`);
	},
};

// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files