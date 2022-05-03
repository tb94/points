const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { User, Player, Blackjack, Hand } = require('../db/models');
const { Op } = require('sequelize');

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('hit')
            .setLabel('Hit')
            .setStyle('SUCCESS'),
        // .setDisabled(true),
        new MessageButton()
            .setCustomId('stay')
            .setLabel('Stay')
            .setStyle('DANGER'),
        // .setDisabled(true),
        // new MessageButton()
        //     .setCustomId('split')
        //     .setLabel('Split')
        //     .setStyle('SECONDARY')
        //     .setDisabled(true),
        // new MessageButton()
        //     .setCustomId('double')
        //     .setLabel('Double')
        //     .setStyle('PRIMARY'),
        // .setDisabled(true)
    );

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

        let [table, newTable] = await Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId } });
        if (table.startTime.getTime() < Date.now()) return interaction.reply({ content: "A game is already in session, wait for the next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { tableId: table.id, UserId: user.id }, defaults: { bet: bet } });

        if (!newPlayer) return interaction.reply({ content: `Please wait for other players to join`, ephemeral: true });
        else if (!newTable) return interaction.reply({ content: `${interaction.user} joined blackjack!` });

        await interaction.reply({ content: `${interaction.user} started a round of blackjack! Use /blackjack to join.` });
        while (table.startTime.getTime() >= Date.now()) {
            await new Promise((resolve) => { setTimeout(resolve, 1250) });
        }

        // add player order here
        let players = await table.getPlayers();
        // deal hands
        players.forEach(player => { Hand.create({ PlayerId: player.id, card: table.deck.draw().toString() }) });
        Hand.create({ BlackjackId: table.id, card: table.deck.draw().toString() });
        players.forEach(player => { Hand.create({ PlayerId: player.id, card: table.deck.draw().toString() }) });
        Hand.create({ BlackjackId: table.id, card: table.deck.draw().toString() });

        let embeds = await table.getHandEmbeds();
        row.components.forEach(button => button.setDisabled(false));
        let tableMessage = await interaction.followUp({ content: "\u200b", embeds: embeds, components: [row] })
        let collector = tableMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: (30 * 1000) });

        players.forEach(player => {
            player.reload().then(p => p.handValue != 21 ? null : p.getUser()
                .then(u => interaction.guild.members.find(m => m.user.tag === u.username))
                .then(u => tableMessage.reply({ content: `${u} got Blackjack!` })));
        });

        collector.on('collect', i => {
            collector.resetTimer();
            User.findOne({ where: { username: i.user.tag, guild: i.guildId } })
                .then(u => Player.findOne({ where: { tableId: table.id, UserId: u.id } }))
                .then(p => {
                    if (p.handValue >= 21) throw new Error(`You already ${p.handValue === 21 ? "have 21" : "busted"}!`);
                    switch (i.customId) {
                        case 'hit':
                            if (p.stay) throw new Error(`You already clicked stay`);
                            return Hand.create({ PlayerId: p.id, card: table.deck.draw().toString() })
                                .then(() => p.reload())
                        case 'stay':
                            return p.update({ stay: true });
                        default:
                            throw new Error("Can't do that yet");
                    }
                })
                .then((p) => i.reply({ content: `${i.user} ${p.handValue > 21 ? "You busted!" : "You have " + p.handValue}`, ephemeral: true }))
                // update table embed
                .then(() => table.getHandEmbeds())
                .then(embeds => tableMessage.edit({ embeds: embeds }))
                // check if everyone has finished or busted
                .then(() => Player.findAll({ where: { tableId: table.id } }))
                .then(all => {
                    let done = all.filter(p => p.handValue >= 21).length;
                    let stayed = all.filter(p => p.stay).length;
                    console.log(`${stayed} players stayed; ${done} players busted or 21; ${all.length} players total`);
                    if (stayed + done >= all.length) collector.stop();
                })
                .catch(err => i.reply({ content: err.message, ephemeral: true }));
        });

        collector.on('end', collection => {
            // disable buttons
            row.components.forEach(button => {
                button.setDisabled();
            });

            // flip dealer card
            table.getHandEmbeds(true).then(embeds => tableMessage.edit({ components: [row], embeds: embeds }))
                // dealer hits until 17
                // payout
                // delete blackjack instance
                .then(() => table.destroy({ force: true }))
                .catch(console.log);
        })
    }
}