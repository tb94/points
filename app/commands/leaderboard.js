const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');
const { Op } = require('sequelize');
const { MessageEmbed } = require('discord.js');

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
                var medals = ["🥇", "🥈" , "🥉"];
                var place = 0;
                var embed = new MessageEmbed()
                .setTitle("Leaderboard")

                for (var user of users) {
                    member = members.find(m => m.user.tag == user.username);
                    embed.addFields({ name: "\u200b", value:`${medals[place]}`, inline: true},
                    { name: "\u200b", value: `${member.user}`, inline: true},
                    { name: "\u200b", value: `${user.balance} 💰`, inline: true},
                    { name: "\u200b", value: "\u200b"});
                    place++;
                }

                interaction.reply({ embeds: [embed] })
            }));
        // interaction.reply(`${users.map(u => `${members.find(m => m.user.tag == u.username)} \t ${u.balance}`).join('\n')}`)));
    }
};
