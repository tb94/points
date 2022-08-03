const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { User, Player, Blackjack, Card, Deck } = require('../db/models');
const { Op } = require('sequelize');
const decks = require('../helpers/decks');

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('hit')
            .setLabel('Hit')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('stand')
            .setLabel('Stand')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('double')
            .setLabel('Double')
            .setStyle('PRIMARY')
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('6 Decks; Dealer stands on 17 ; Blackjack pays 3:2')
        .addIntegerOption(o => o
            .setName('points')
            .setRequired(true)
            .setDescription('How many points to bet')),
    async execute(interaction, user) {
        let bet = interaction.options.getInteger('points');

        if (bet <= 0) return interaction.reply({ content: "You have to bet a real amount", ephemeral: true });
        if (user.balance < bet) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });

        let [table, newTable] = await Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: [Player, Deck] });
        if (table.startTime == null) {
            newTable = true;
            await table.update({ startTime: Date.now() + (10 * 1000) });
        }
        if (table.startTime.getTime() < Date.now()) return interaction.reply({ content: "A game is already in session, wait for the next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { BlackjackId: table.id, UserId: user.id }, defaults: { bet: bet, position: (table.Players?.length ?? 0) + 1 } });

        if (!newPlayer) return interaction.reply({ content: `Please wait for other players to join`, ephemeral: true });
        await table.update({ startTime: table.startTime + (10 * 1000) });
        user.decrement({ balance: player.bet });
        await interaction.reply({ content: `${interaction.user} ${newTable ? "started" : "joined"} blackjack with ${player.bet} 💰 bet!` });

        if (!newTable) return;

        // game logic starts here

        while (table.startTime.getTime() >= Date.now()) {    
            await new Promise((resolve) => { setTimeout(resolve, 5000) });
            await table.reload();
        }

        if (!table.Deck || await table.Deck.cardsRemaining() <= 52) {
            await interaction.followUp("Shuffling the deck...");
            await table.Deck?.destroy();
            let newDeck = await decks.buildDeck(6);
            newDeck.setBlackjack(table);
            table.setDeck(newDeck);
            await newDeck.save();
            await table.save();
            await table.reload({ include: [Player, Deck] });
        }

        let guildMembers = await interaction.guild.fetch().then(g => g.members.cache);

        let [dealer] = await Player.findCreateFind({ where: { BlackjackId: table.id, UserId: null }, defaults: { position: 0 } });
        let players = await table.getPlayers();
        players.sort((p1, p2) => p1.position - p2.position);

        // deal hands
        for (let p of players) {
            await hit(table, p);
        }
        for (let p of players) {
            await hit(table, p);
        }

        row.components.forEach(button => button.setDisabled(false));

        let tableMessage = await table.getHandEmbeds()
            .then(embeds => interaction.followUp({ content: "\u200b", embeds: embeds, components: [row] }));

        let collector = tableMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: (30 * 1000) });

        players.forEach(p => p.reload().then(() => {
            if (p.hasBlackjack()) return p.getUser()
                .then(u => {
                    if (u == null) throw new Error("Dealer has Blackjack!");
                    return tableMessage.reply({ content: `${guildMembers.find(m => m.user.tag === u.username).user} got Blackjack!` });
                });
        }).catch(err => tableMessage.reply(err.message).then(() => collector.stop())));

        collector.on('collect', i => {
            User.findOne({ where: { snowflake: i.user.id, guild: i.guildId } })
                .then(u => {
                    if (!u) throw new Error(`That's not for you`);
                    return Player.findOne({ where: { BlackjackId: table.id, UserId: u.id } })
                })
                .then(p => {
                    if (!p) throw new Error(`That's not for you`);
                    switch (i.customId) {
                        case 'hit':
                            collector.resetTimer();
                            return hit(table, p);
                        case 'stand':
                            return stand(p);
                        case 'double':
                            return double(table, p);
                        default:
                            throw new Error("Can't do that yet");
                    }
                })
                // update table embed
                .then(() => table.getHandEmbeds())
                .then(embeds => i.update({ embeds: embeds }))
                // check if everyone has finished or busted
                .then(() => table.getPlayers())
                .then(all => {
                    let done = all.filter(p => p.handValue >= 21 || p.stay).length;
                    let busted = all.filter(p => p.handValue > 21).length;
                    let blackjack = all.filter(p => p.hasBlackjack()).length;

                    if (busted + blackjack >= all.length - 1) return dealer.update({ stay: true }).then(() => collector.stop());
                    if (done >= all.length - 1) return collector.stop();
                })
                .catch(err => i.replied ? i.followUp({ content: err.message, ephemeral: true }) : i.reply({ content: err.message, ephemeral: true }));
        });

        collector.on('end', () => {
            // disable buttons
            row.components.forEach(button => {
                button.setDisabled();
            });

            // flip dealer card
            dealer.reload()
                .then(() => table.getHandEmbeds(true))
                .then(embeds => tableMessage.edit({ components: [row], embeds: embeds }))
                // dealer hits until 17
                .then(() => dealerPlay(dealer, table, tableMessage))
                // payout
                .then(() => payout(dealer, table, guildMembers, tableMessage))
                // wipe the table
                .then(() => dealer.destroy())
                .then(() => table.update({ startTime: null }))
                .catch(console.log);
        });
    }
}

async function dealerPlay(dealer, table, tableMessage) {
    while (dealer.handValue <= 16 && !dealer.stay) {
        await dealer.reload()
            .then(() => hit(table, dealer))
            .then(() => table.reload())
            .then(() => table.getHandEmbeds(true))
            .then(embeds => tableMessage.edit({ embeds: embeds }))
            .then(() => dealer.reload());
    }
}

async function payout(dealer, table, guildMembers, tableMessage) {
    let players = await table.getPlayers()
    await dealer.reload();
    for (let player of players) {
        await player.reload();
        let user = await player.getUser();
        if (!user) continue;

        let winnings = 0;
        let member = guildMembers.find(m => m.user.id === user.snowflake);

        if (player.handValue > 21                                                   // bust
            || (dealer.hasBlackjack() && !player.hasBlackjack())                    // dealer has blackjack
            || (dealer.handValue <= 21 && player.handValue < dealer.handValue)) {}  // dealer has better hand
        else if (player.hasBlackjack() && !dealer.hasBlackjack()) {                 // player has blackjack
            winnings = Math.ceil(player.bet * 3 / 2);
            await user.increment({ balance: winnings + player.bet });
        }
        else if (player.handValue == dealer.handValue)                              // push
            await user.increment({ balance: player.bet });
        else if (player.handValue > dealer.handValue || dealer.handValue > 21) {    // other win
            winnings = player.bet;
            await user.increment({ balance: winnings + player.bet });
        }

        if (winnings > 0)
            await tableMessage.reply(`${member.user} won ${winnings} 💰!`);
        
        await Card.destroy({ where: {
            playerId: player.id
        }});
        await player.destroy();
    }

    await Card.destroy({ where: {
        playerId: dealer.id
    }});
}

async function hit(table, player) {
    if (player.handValue >= 21) throw new Error(`You already ${player.handValue === 21 ? "have 21" : "busted"}!`);
    if (player.stay) throw new Error(`You already clicked stand`);

    let cards = await table.Deck.getCards();
    let card = cards[0];
    await table.Deck.removeCard(card);
    await player.addCard(card);
    await table.Deck.save();
    return player.save();
}

function double(table, player) {
    return player.getUser()
        .then(user => {
            if (user.balance < player.bet) throw new Error("You don't have enough points for that");
            return user.decrement({ balance: player.bet });
        })
        .then(() => player.getCards())
        .then(cards => {
            if (cards.length > 2) throw new Error("You can't double after hitting");
        })
        .then(() => player.increment({ bet: player.bet }))
        .then(() => hit(table, player))
        .then(() => player.update({ stay: true }))
}

function stand(player) {
    if (!player.stay) return player.update({ stay: true });
}