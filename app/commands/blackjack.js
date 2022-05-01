const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { User, Player, Blackjack, Hand } = require('../db/models');

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

        if (bet <= 0) return interaction.reply({ content: "You have to bet a real amount", ephemeral: true });

        let [user] = await User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
        if (user.balance < bet) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });

        let [table, newTable] = await Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, defaults: { startTime: (Date.now() + (10 * 1000)) } });
        if (table.startTime.getTime() < Date.now()) return interaction.reply({ content: "Game already in session, wait for next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { tableId: table.id, UserId: user.id }, defaults: { bet: bet } });

        if (!newPlayer) return interaction.reply({ content: `You are already playing blackjack! Please wait for other players to join`, ephemeral: true });
        if (newTable) return interaction.reply({ content: `${interaction.user} has started a round of blackjack! Use /blackjack to join in.`});
        return interaction.reply({ content: `${interaction.user} has joined blackjack!`});
    }
}