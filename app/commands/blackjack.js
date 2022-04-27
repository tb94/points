const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { User } = require('../db/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Dealer hits on soft 17; Blackjack pays 3:2')
        .addIntegerOption(o => o
            .setName('points')
            .setRequired(true)
            .setDescription('How many points to bet')),
    async execute(interaction) {
        let bet = interaction.options.getInteger('points');
        if (bet < 0) return interaction.reply("You have to bet a real amount");

        User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
            .then(([user]) => {
                if (user.balance < bet) return interaction.reply("You don't have that many points!");

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('hit')
                            .setLabel('Hit')
                            .setStyle('PRIMARY')
                    );

                    interaction.reply({ content: 'Hand: 3♥,9♣  Dealer: 7♠,🎴'})
                        .then(() => {});

                if (win) {
                    return user.increment('balance', { by: bet }).then(() => user.reload());
                } else {
                    return user.decrement('balance', { by: bet }).then(() => user.reload());
                }
            })
            .then(user => interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`))
            .catch(err => console.error(err));
    }
};

// https://discordjs.guide/creating-your-bot/command-handling.html#individual-command-files