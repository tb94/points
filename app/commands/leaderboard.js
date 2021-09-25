const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top members'),
    async execute(interaction) {
        let members = await interaction.guild.members.fetch();
        let users = await User.findAll({ where: { guild: interaction.guild.id } });

        users = users.filter(u => u.guild == interaction.guild.id);
        users.sort((u1, u2) => u2.balance - u1.balance);
        users = users.slice(0,3);

        await interaction.reply(`${users.map(u => `${members.find(m => m.user.tag == u.username)} \t ${u.balance}`).join('\n')}`);
    }
};
