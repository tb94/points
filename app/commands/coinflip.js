const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Offer some points and flip a coin! Double your money, or lose it')
		.addIntegerOption(o => o
			.setName('points')
			.setRequired(true)
			.setDescription('How many points to bet')),
	async execute(interaction, user) {
		let bet = interaction.options.getInteger('points');
		let win = Math.round(Math.random()) == 1;

		if (bet <= 0) return interaction.reply({ content: "You have to bet a real amount", ephemeral: true });

		if (user.balance < bet) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });
		await user.decrement( { balance: bet });

		if (win) await user.increment({ balance: bet * 2 });

		await user.reload();
		return interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`);
	}
};

// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files