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
                var leaders = [];
                var first = interaction.client.emojis.cache.find(emoji => emoji.name === "first_place");
                var second = interaction.client.emojis.cache.find(emoji => emoji.name === "second_place");
                var third = interaction.client.emojis.cache.find(emoji => emoji.name === "third_place");

                var medal = [first, second, third];

                var place = 0;

                console.log(medal);
                for (var user of users) {
                    member = members.find(m => m.user.tag == user.username);
                    leaders.push({ name: `${medal[place]} \t ${member.user.username}`, value: `\t ${user.balance}`})
                    place++;
                }
                const embed = {
                    title: 'Leaderboard',
                    fields: leaders
                }

                interaction.reply({ embeds: [embed] })
            }));
        // interaction.reply(`${users.map(u => `${members.find(m => m.user.tag == u.username)} \t ${u.balance}`).join('\n')}`)));
    }
};
