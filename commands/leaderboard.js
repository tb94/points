const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top members'),
    async execute(interaction) {
        const users = await User.findAll();
        users.sort((u1, u2) => u2.balance - u1.balance);

        let members = await interaction.guild.members.fetch();

        await interaction.reply(`${users.map(u => `${members.find(m => m.user.tag == u.username)} \t ${u.balance}`).join('\n')}`);
    }
};
