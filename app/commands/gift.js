const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../db/models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gift')
		.setDescription('Gift points to someone')
        .addIntegerOption(o => o
            .setName('gift')
            .setRequired(true)
            .setDescription('How many points to gift'))
		.addUserOption(o => o
			.setName('recipient')
            .setRequired(true)
			.setDescription('Who gets the points')),
	async execute(interaction, user) {
        let gift = interaction.options.getInteger('gift');
        
        if (gift <= 0) return interaction.reply({ content: "You have to gift a real amount", ephemeral: true });
        if (user.balance < gift) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });
        
		const target = await interaction.options.getUser('recipient');

        if (target.id == interaction.user.id) return interaction.reply({ content: "You cannot gift points to yourself", ephemeral: true });
		if (target.bot) return interaction.reply({ content: `${target} cannot earn points`, ephemeral: true });

        await user.decrement({ balance: gift });

        let [recipient] = await User.findCreateFind({
            where: { snowflake: target.id, guild: interaction.guild.id },
            defaults: { username: target.tag }
        });

        await recipient.increment({ balance: gift });

		return interaction.reply(`${target} recieved a gift of ${gift}💰`);
	}
}