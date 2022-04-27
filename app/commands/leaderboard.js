const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top members'),
    async execute(interaction) {
        var guildMembers = interaction.guild.members.fetch();

        User.findAll({
            where: { 
                guild: interaction.guild.id,
                username: {
                    [Op.in]: guildMembers.map(m => m.user.tag)
                }
             },
            order: [['balance', 'DESC']],
            limit: 3
        }).then(users => interaction.guild.members.fetch()
            .then(members => interaction.reply(`${users.map(u => `${members.find(m => m.user.tag == u.username)} \t ${u.balance}`).join('\n')}`)));
    }
};
