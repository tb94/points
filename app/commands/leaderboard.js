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
                limit: 10
            }).then(users => {
                let medals = ["🏆", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
                let place = 0;
                let embed = new MessageEmbed()
                    .setTitle("Leaderboard");
                let leaders;

                if (users.length >= 10) leaders = users;
                else if (users.length >= 5) leaders = users.slice(0, 5);
                else leaders = users.slice(0, 3);

                for (var user of leaders) {
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
