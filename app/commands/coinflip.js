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
	async execute(interaction) {
		let user = await User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } });
		let bet = interaction.options.getInteger('points');
		let win = Math.round(Math.random()) == 1;

		if (user.balance < bet) { 
			await interaction.reply("You don't have that many points!");
			return;
		} else if (bet <=0) {
			await interaction.reply("You have to bet a real amount");
			return;
		}
		
		if (win) {
			await user.increment('balance', { by: bet })
		} else {
			await user.decrement('balance', { by: bet });
		}
		await user.reload();
		await interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`);
	},
};

// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files