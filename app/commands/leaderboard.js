const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('../db/models');
const { Op } = require('sequelize');
const { MessageEmbed } = require('discord.js');
const medals = ["🏆", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top members'),
    async execute(interaction) {
        let members = await interaction.guild.members.fetch();
        let users = await User.findAll({
            where: {
                guild: interaction.guild.id,
                snowflake: {
                    [Op.in]: members.map(m => m.user.id)
                }
            },
            order: [['balance', 'DESC']]
        });

        let place = 0;
        let embeds = [];
        let top3embed = new MessageEmbed()
            .setTitle("Leaderboard");

        users = users.filter(u => members.find(m => m.user.id === u.snowflake) != null);
        let leaders = users.slice(0, 3);
            
        for (let user of leaders) {
            let member = members.find(m => m.user.id == user.snowflake);
            top3embed.addFields({ name: `\u200b`, value: `${medals[place]}`, inline: true },
                { name: "\u200b", value: `${member.user}`, inline: true },
                { name: "\u200b", value: `${user.balance} 💰`, inline: true });
            place++;
        }

        embeds.push(top3embed);
        if (users.length < 5) return interaction.reply({ embeds: [top3embed] });

        let midfieldEmbed = new MessageEmbed();

        let followers = users.slice(3, 10);

        for (let user of followers) {
            let member = members.find(m => m.user.id == user.snowflake);
            midfieldEmbed.addFields({ name: `\u200b`, value: `${medals[place]}`, inline: true },
                { name: "\u200b", value: `${member.user}`, inline: true },
                { name: "\u200b", value: `${user.balance} 💰`, inline: true });
            place++;
        }
        embeds.push(midfieldEmbed);

        await interaction.reply({ embeds: embeds })
    }
};
