const { SlashCommandBuilder } = require('@discordjs/builders');
const { User, Player, Baccarat, Card } = require('../db/models');
const { Deck } = require('../helpers/cards');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baccarat')
        .setDescription('Banker takes 5% commission; tie pays 8:1')
        .addIntegerOption(o => o
            .setName('points')
            .setRequired(true)
            .setDescription('How many points to bet'))
        .addStringOption(o => o
            .setName('bet')
            .addChoice('player', 'player')
            .addChoice('banker', 'banker')
            .setRequired(true)
            .setDescription('Where to place your bet'))
        .addIntegerOption(o => o
            .setName('tie')
            .setDescription('Side bet on tie')),
    async execute(interaction) {
        let points = interaction.options.getInteger('points');
        let bet = interaction.options.getString('bet');
        let tie = interaction.options.getInteger('tie') ?? 0;

        if (points < 20) return interaction.reply({ content: "This game has a minimum bet of 20 💰", ephemeral: true });

        let [user] = await User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
        if (user.balance < points + tie) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });

        let [table, newTable] = await Baccarat.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player })
        if (Date.now() > table.startTime.getTime()) return interaction.reply({ content: "A game is already in session, wait for the next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { BaccaratId: table.id, UserId: user.id }, defaults: { bet: points, baccaratBet: bet, tieBet: tie } });

        if (!newPlayer) return interaction.reply({ content: `Please wait for other players to join`, ephemeral: true });
        user.decrement({ balance: points + tie });

        interaction.reply({ content: `${interaction.user} ${newTable ? "started" : "joined"} baccarat with ${player.bet} 💰 on ${player.baccaratBet}${player.tieBet > 0 ? " and " + player.tieBet + " 💰 on tie!" : "!"}` });

        if (!newTable) return;

        // game logic starts here

        while (table.startTime.getTime() >= Date.now()) {
            await new Promise((resolve) => { setTimeout(resolve, 1250) });
        }

        let guildMembers = await interaction.guild.fetch().then(g => g.members.cache);

        let [dealer] = await Player.findCreateFind({ where: { BaccaratId: table.id, UserId: null } });

        let deck = new Deck();
        deck.shuffle();

        await deal(player, deck.draw().toString());
        await deal(dealer, deck.draw().toString());

        await deal(player, deck.draw().toString());
        await deal(dealer, deck.draw().toString());

        await player.reload();
        await dealer.reload();

        let tableMessage = await table.getHandEmbeds().then(embeds => interaction.followUp({ content: '\u200b', embeds: embeds }));

        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (player.handValue % 10 >= 8 || dealer.handValue % 10 >= 8) {
            // natural win, no one draws
        } else if (player.handValue % 10 <= 5) {
            // player draws
            let thirdCard = await deal(player, deck.draw().toString());
            await table.getHandEmbeds().then(embeds => tableMessage.edit({ content: '\u200b', embeds: embeds }));
            await new Promise((resolve) => setTimeout(resolve, 2000));

            switch (dealer.handValue % 10) {
                case 0:
                case 1:
                case 2:
                    await deal(dealer, deck.draw().toString());
                    break;
                case 3:
                    if (thirdCard.value != '8') await deal(dealer, deck.draw().toString());
                    break;
                case 4:
                    if (['2', '3', '4', '5', '6', '7'].includes(thirdCard.value)) await deal(dealer, deck.draw().toString());
                    break;
                case 5:
                    if (['4', '5', '6', '7'].includes(thirdCard.value)) await deal(dealer, deck.draw().toString());
                    break;
                case 6:
                    if (['6', '7'].includes(thirdCard.value)) await deal(dealer, deck.draw().toString());
                    break;
                default:
                    break;
            }
            // player stands
        } else if (dealer.handValue % 10 <= 5) await deal(dealer, deck.draw().toString());

        await table.getHandEmbeds().then(embeds => tableMessage.edit({ content: '\u200b', embeds: embeds }));

        await payout(dealer, player, table, guildMembers, tableMessage);
    }
}

function deal(player, card) {
    return Card.create({ PlayerId: player.id, value: card.substring(0, card.length - 1), suit: card.slice(-1) });
}

async function payout(dealer, player, table, guildMembers, tableMessage) {
    await dealer.reload();
    await player.reload();

    let players = await table.getPlayers();

    for (let p of players) {
        let user = await p.getUser();
        if (!user) continue;

        let winnings = 0;
        let member = guildMembers.find(m => m.user.tag === user.username);


        if (dealer.handValue % 10 === player.handValue % 10) {
            winnings = p.tieBet * 8;
        } else if (dealer.handValue % 10 > player.handValue % 10 && p.baccaratBet == "banker") {
            winnings = Math.ceil(p.bet * 0.95);
        } else if (player.handValue % 10 > dealer.handValue % 10 && p.baccaratBet == "player") {
            winnings = p.bet;
        } else continue;

        await user.increment({ balance: winnings + p.bet })
        if (winnings > 0) await tableMessage.reply(`${member.user} won ${winnings} 💰!`);
        await player.destroy();
    }
    await table.destroy({ force: true });
}