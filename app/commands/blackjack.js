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
            .setCustomId('stand')
            .setLabel('Stand')
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
        .setDescription('Single Deck; Dealer stands on all 17s; Blackjack pays 3:2')
        .addIntegerOption(o => o
            .setName('points')
            .setRequired(true)
            .setDescription('How many points to bet')),
    async execute(interaction) {
        let bet = interaction.options.getInteger('points');

        if (bet <= 0) return interaction.reply({ content: "You have to bet a real amount", ephemeral: true });

        let [user] = await User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
        if (user.balance < bet) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });

        let [table, newTable] = await Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player });
        if (table.startTime.getTime() < Date.now()) return interaction.reply({ content: "A game is already in session, wait for the next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { tableId: table.id, UserId: user.id }, defaults: { bet: bet, position: (table.Players?.length ?? 0) + 1 } });

        if (!newPlayer) return interaction.reply({ content: `Please wait for other players to join`, ephemeral: true });
        else if (!newTable) return interaction.reply({ content: `${interaction.user} joined blackjack!` });

        await interaction.reply({ content: `${interaction.user} started a round of blackjack! Use /blackjack to join.` });
        while (table.startTime.getTime() >= Date.now()) {
            await new Promise((resolve) => { setTimeout(resolve, 1250) });
        }

        let [dealer] = await Player.findCreateFind({ where: { tableId: table.id, UserId: null }, defaults: { position: 0 }});
        let players = await table.getPlayers();
        players.sort((p1, p2) => p1.position - p2.position);
        players.forEach(p => console.log(p.bet));

        // deal hands
        players.forEach(player => Hand.create({ PlayerId: player.id, card: table.deck.draw().toString() }));
        players.forEach(player => Hand.create({ PlayerId: player.id, card: table.deck.draw().toString() }));
        dealer.reload();

        let embeds = await table.getHandEmbeds();
        row.components.forEach(button => button.setDisabled(false));
        let tableMessage = await interaction.followUp({ content: "\u200b", embeds: embeds, components: [row] })
        let collector = tableMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: (30 * 1000) });

        // this is broken

        players.forEach(p => {
            if (!p.equals({ other: dealer })) return p.reload().then(p => p.handValue != 21 ? null : p.getUser()
                .then(u => interaction.guild.fetch()
                    .then(g => g.members.cache.find(m => m.user.tag === u.username))
                    .then(u => tableMessage.reply({ content: `${u} got Blackjack!` }))));
        });

        collector.on('collect', i => {
            collector.resetTimer();
            User.findOne({ where: { username: i.user.tag, guild: i.guildId } })
                .then(u => Player.findOne({ where: { tableId: table.id, UserId: u.id } }))
                .then(p => {
                    switch (i.customId) {
                        case 'hit':
                            if (p.handValue >= 21) throw new Error(`You already ${p.handValue === 21 ? "have 21" : "busted"}!`);
                            if (p.stay) throw new Error(`You already clicked stay`);
                            return Hand.create({ PlayerId: p.id, card: table.deck.draw().toString() })
                                .then(() => p.reload())
                        case 'stand':
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
                    if (stayed + done >= all.length - 1) collector.stop();
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
                .then(() => dealerPlay(dealer, table, tableMessage))
                // payout
                // delete blackjack instance
                .then(() => table.destroy({ force: true }))
                .catch(console.log);
        })
    }
}

async function dealerPlay(dealer, table, tableMessage) {
    console.log(dealer);
    while (dealer.handValue <= 16) {
        console.log(`dealer has ${dealer.handValue}`);
        await Hand.create({ PlayerId: dealer.id, card: table.deck.draw().toString() })
            .then(() => console.log(`\nDealer hit on ${dealer.handValue}\n`))
            .then(() => dealer.reload())
            .then(() => table.getHandEmbeds(true))
            .then(embeds => tableMessage.edit({ embeds: embeds }));
    }
}