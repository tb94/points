const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the top members'),
	async execute(interaction) {
        let leaderboard = [];
        const users = await User.findAll();
        users.sort((u1, u2) => u1.balance < u2.balance);

        let members = await interaction.guild.members.fetch();
        users.forEach(u => {
            leaderboard.push({
                tag: members.find(m => m.user.tag == u.username),
                balance: u.balance
            });
        });

        await interaction.reply(`${leaderboard.map(u => `${u.tag} ${u.balance}`).join('\n')}`);
	}
};
