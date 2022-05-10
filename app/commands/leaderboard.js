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
            order: [['balance', 'DESC']],
            limit: 10
        });

        let place = 0;
        let embed = new MessageEmbed()
            .setTitle("Leaderboard");
        let leaders = users.filter(u => members.find(m => m.user.id === u.snowflake) != null);
        
        if (leaders.length >= 5 && leaders.length < 10 ) leaders = leaders.slice(0, 5);
        else if (leaders.length < 10) leaders = leaders.slice(0, 3);

        for (var user of leaders) {
            let member = members.find(m => m.user.id == user.snowflake);
            console.log(`adding user to leaderboard:`);
            console.log(member);
            console.log(user);
            embed.addFields({ name: "\u200b", value: `${medals[place]}`, inline: true },
                { name: "\u200b", value: `${member.user}`, inline: true },
                { name: "\u200b", value: `${user.balance} 💰`, inline: true });
            place++;
        }

        await interaction.reply({ embeds: [embed] })
    }
};
