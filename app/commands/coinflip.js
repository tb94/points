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
		let bet = interaction.options.getInteger('points');
		let win = Math.round(Math.random()) == 1;

		if (bet <= 0) return interaction.reply({ content: "You have to bet a real amount", ephemeral: true });

		User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
			.then(([user]) => {
				if (user.balance < bet) return interaction.reply("You don't have that many points!");

				if (win) {
					return user.increment('balance', { by: bet }).then(() => user.reload());
				} else {
					return user.decrement('balance', { by: bet }).then(() => user.reload());
				}
			})
			.then(user => interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`))
			.catch(err => console.error(err));
	}
};

// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files