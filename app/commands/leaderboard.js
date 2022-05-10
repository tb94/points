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
                    snowflake: {
                        [Op.in]: members.map(m => m.user.id)
                    }
                },
                order: [['balance', 'DESC']],
                limit: 3
            }).then(users => {
                let medals = ["🥇", "🥈", "🥉"];
                let place = 0;
                let embed = new MessageEmbed()
                    .setTitle("Leaderboard")

                for (var user of users) {
                    let member = members.find(m => m.user.id == user.snowflake);
                    embed.addFields({ name: "\u200b", value: `${medals[place]}`, inline: true },
                        { name: "\u200b", value: `${member.user}`, inline: true },
                        { name: "\u200b", value: `${user.balance} 💰`, inline: true });
                    place++;
                }

                interaction.reply({ embeds: [embed] })
            }));
    }
};
