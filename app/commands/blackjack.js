const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { User, Player, Blackjack, Card } = require('../db/models');
const { Op } = require('sequelize');

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('hit')
            .setLabel('Hit')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('stand')
            .setLabel('Stand')
            .setStyle('DANGER')
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Single Deck; Dealer stands on 17 ; Blackjack pays 3:2')
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
        interaction.reply({ content: `${interaction.user} ${newTable ? "started" : "joined"} blackjack with ${player.bet} 💰 bet!` });

        if (!newTable) return;

        // game logic starts here

        while (table.startTime.getTime() >= Date.now()) {
            await new Promise((resolve) => { setTimeout(resolve, 1250) });
        }

        let [dealer] = await Player.findCreateFind({ where: { tableId: table.id, UserId: null }, defaults: { position: 0 } });
        let players = await table.getPlayers();
        players.sort((p1, p2) => p1.position - p2.position);

        // deal hands
        await dealCards(table);
        await dealCards(table);

        dealer.reload();

        let embeds = await table.getHandEmbeds();
        row.components.forEach(button => button.setDisabled(false));
        let tableMessage = await interaction.followUp({ content: "\u200b", embeds: embeds, components: [row] })
        let collector = tableMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: (30 * 1000) });

        players.forEach(p => p.reload().then(() => {
            p.getUser()
                .then(u => {
                    if (!u) return;
                    u.decrement({ balance: p.bet });

                    if (p.handValue == 21) interaction.guild.fetch()
                        .then(g => g.members.cache.find(m => m.user.tag === u.username))
                        .then(m => tableMessage.reply({ content: `${m.user} got Blackjack!` }))
                        .then(() => p.update({ stay: true }));
                });
        }));

        if (dealer.handValue == 21)
            tableMessage.reply({ content: "Dealer got Blackjack!" }).then(() => collector.stop());

        collector.on('collect', i => {
            collector.resetTimer();
            User.findOne({ where: { username: i.user.tag, guild: i.guildId } })
                .then(u => Player.findOne({ where: { tableId: table.id, UserId: u.id } }))
                .then(p => {
                    switch (i.customId) {
                        case 'hit':
                            if (p.handValue >= 21) throw new Error(`You already ${p.handValue === 21 ? "have 21" : "busted"}!`);
                            if (p.stay) throw new Error(`You already clicked stay`);
                            let c = table.deck.draw().toString();
                            return Card.create({ PlayerId: p.id, value: c.substring(0, c.length - 1), suit: c.slice(-1) })
                                .then(() => p.update({ stay: p.handValue >= 21 }))
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
                    let done = all.filter(p => p.handValue >= 21 || p.stay).length;
                    let busted = all.filter(p => p.handValue > 21).length;
                    if (busted >= all.length - 1) dealer.update({ stay: true });
                    if (done >= all.length - 1) collector.stop();
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
                .then(() => interaction.guild.fetch())
                .then(g => g.members.cache)
                .then(members => payout(dealer, table, members, tableMessage))
                // delete blackjack instance
                .then(() => table.destroy({ force: true }))
                .catch(console.log);
        })
    }
}

async function dealerPlay(dealer, table, tableMessage) {
    while (dealer.handValue <= 16 && !dealer.stay) {
        let c = table.deck.draw().toString();
        await Card.create({ PlayerId: dealer.id, value: c.substring(0, c.length - 1), suit: c.slice(-1) })
            .then(() => dealer.reload())
            .then(() => new Promise((resolve) => setTimeout(resolve, 2000)))
            .then(() => table.getHandEmbeds(true))
            .then(embeds => tableMessage.edit({ embeds: embeds }));
    }
    let reply = "Dealer ";
    if (dealer.handValue == 21 && dealer.Cards.length == 2) reply += "has Blackjack!";
    else if (dealer.handValue > 21) reply += "busted!";
    else reply += `has ${dealer.handValue}!`;
    return tableMessage.reply({ content: reply });
}

async function payout(dealer, table, guildMembers, tableMessage) {
    let players = await table.getPlayers()
    for (let player of players) {
        await player.reload();
        let user = await player.getUser();
        if (!user) continue;

        let winnings = 0;
        let member = guildMembers.find(m => m.user.tag === user.username);

        // bust or lose
        if (player.handValue > 21 || (dealer.handValue <= 21 && player.handValue < dealer.handValue)) continue;
        // push
        else if (player.handValue == dealer.handValue) winnings = 0;
        // blackjack
        else if (player.handValue == 21 && player.Cards.length == 2) winnings = Math.ceil(player.bet * 3 / 2);
        // other win
        else if (player.handValue > dealer.handValue || dealer.handValue > 21) winnings = player.bet;

        await user.increment({ balance: winnings + player.bet });
        if (winnings > 0)
            await tableMessage.reply(`${member.user} won ${winnings} 💰!`);
    }
}

async function dealCards(table) {
    let players = await table.getPlayers();

    for (let player of players) {
        let card = table.deck.draw().toString();
        await Card.create({ PlayerId: player.id, value: card.substring(0, card.length -1), suit: card.slice(-1) });
        await player.reload();
    }
}