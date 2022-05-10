const { SlashCommandBuilder } = require('@discordjs/builders');
const { User, Player, Baccarat, Card } = require('../db/models');
const { Deck } = require('../helpers/cards');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baccarat')
        .setDescription('Banker takes 5% commission; tie pays 8:1')
        .addIntegerOption(o => o
            .setName('player')
            .setDescription('Points to bet on player'))
        .addIntegerOption(o => o
            .setName('banker')
            .setDescription('Points to bet on banker'))
        .addIntegerOption(o => o
            .setName('tie')
            .setDescription('Points to bet on tie')),
    async execute(interaction) {
        let playerBet = interaction.options.getInteger('player') ?? 0;
        let bankerBet = interaction.options.getInteger('banker') ?? 0;
        let tieBet = interaction.options.getInteger('tie') ?? 0;

        if (playerBet < 0 || bankerBet < 0 || tieBet < 0) return interaction.reply({ content: "That's not a real bet!", ephemeral: true });
        if (playerBet + bankerBet + tieBet == 0) return interaction.reply({ content: 'You have to bet on something!', ephemeral: true });

        let [user] = await User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
        if (user.balance < playerBet + bankerBet + tieBet) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });

        let [table, newTable] = await Baccarat.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player })
        if (Date.now() > table.startTime.getTime()) return interaction.reply({ content: "A game is already in session, wait for the next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { BaccaratId: table.id, UserId: user.id }, defaults: { playerBet: playerBet, bankerBet: bankerBet, tieBet: tieBet } });

        if (!newPlayer) return interaction.reply({ content: `Please wait for other players to join`, ephemeral: true });
        user.decrement({ balance: playerBet + bankerBet + tieBet });

        let content = `${interaction.user} ${newTable ? 'started' : 'joined'} baccarat `;
        if (player.playerBet > 0) content += `with ${player.playerBet} 💰 on player`
        if (player.bankerBet > 0) content += `${player.playerBet > 0 ? ', and' : 'with'} ${player.bankerBet} 💰 on banker`
        if (player.tieBet > 0) content += `${player.playerBet > 0 || player.bankerBet > 0 ? ', and' : 'with'} ${player.tieBet} 💰 on tie`;
        content += '!';
        interaction.reply({ content: content });

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
            await user.increment({ balance: winnings + p.tieBet + p.playerBet + p.bankerBet })
        } else if (dealer.handValue % 10 > player.handValue % 10) {
            winnings = Math.ceil(p.bankerBet * 0.95);
            await user.increment({ balance: winnings + p.bankerBet })
        } else if (player.handValue % 10 > dealer.handValue % 10) {
            winnings = p.playerBet;
            await user.increment({ balance: winnings + p.playerBet })
        } 

        if (winnings > 0) await tableMessage.reply(`${member.user} won ${winnings} 💰!`);
        await player.destroy();

    }
    await table.destroy({ force: true });
}