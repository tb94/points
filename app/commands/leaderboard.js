const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top members'),
    async execute(interaction) {
        interaction.guild.members.fetch()
            .then(members => User.findAll({
                where: {
                    guild: interaction.guild.id,
                    username: {
                        [Op.in]: members.map(m => m.user.tag)
                    }
                },
                order: [['balance', 'DESC']],
                limit: 3
            }).then(users => {
                const embed = {
                    title: 'Leaderboard',
                    fields: users.map(u => {
                        return {
                            name: members.find(m => m.user.tag == u.username),
                            value: u.balance
                        }
                    })
                }

                interaction.reply({embeds: [embed]})
            }));
        // interaction.reply(`${users.map(u => `${members.find(m => m.user.tag == u.username)} \t ${u.balance}`).join('\n')}`)));
    }
};
