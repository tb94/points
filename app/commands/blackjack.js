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

        let [table] = await Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, defaults: { startTime: (Date.now() + (3 * 1000)) } });
        if (table.startTime.getTime() < Date.now()) return interaction.reply({ content: "Game already in session, wait for next hand", ephemeral: true });

        Player.findCreateFind({ where: { tableId: table.id, UserId: user.id }, defaults: { bet: bet } });

        await interaction.reply({ content: `Hands will be dealt in ${Math.round((table.startTime.getTime() - Date.now()) / 1000)} seconds` });
        // wait for users to be seated
        while (table.startTime.getTime() > Date.now()) {
            await Promise.all([
                interaction.editReply({ content: `Hands will be dealt in ${Math.round((table.startTime.getTime() - Date.now()) / 1000)} seconds` }),
                new Promise((resolve) => { setTimeout(resolve, 950); })
            ]);
        }

        return interaction.deleteReply();
    }
}

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('hit')
            .setLabel('Hit')
            .setStyle('SUCCESS')
            .setDisabled(true),
        new MessageButton()
            .setCustomId('stay')
            .setLabel('Stay')
            .setStyle('DANGER')
            .setDisabled(true),
        // new MessageButton()
        //     .setCustomId('split')
        //     .setLabel('Split')
        //     .setStyle('SECONDARY')
        //     .setDisabled(true),
        new MessageButton()
            .setCustomId('double')
            .setLabel('Double')
            .setStyle('PRIMARY')
            .setDisabled(true)
    );