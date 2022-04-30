const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { User, Player, Blackjack, Hand } = require('../db/models');
const { Deck } = require("../helpers/cards");

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

        let [[user], [table]] = await Promise.all([
            User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } }),
            Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player })
        ]);

        if (user == null || table == null) return interaction.reply({ content: "something went wrong", ephemeral: true });

        if (user.balance < bet) {
            return interaction.reply({ content: "You don't have that many points!", ephemeral: true });
        }
        // TODO: if table is already started, respond with ephemeral to try the next hand

        // set start time 10s from now
        let player = await table.update({ startTime: Date.now() + (3 * 1000) })
            .then(table => Player.findCreateFind({ where: { tableId: table.id, UserId: user.id } }))
            .then(([player, exists]) => {
                return player.update({ bet: bet })
            });

        await interaction.reply({ content: `Hands will be dealt in ${Math.round((table.startTime.getTime() - Date.now()) / 1000)} seconds`, components: [row] });
        // each table should have 1+ users (timestamp of when the hand will be dealt - can be extended as users enter - show countown in embed)
        // reply with notification to join the table and wait for more users to join

        // wait for users to be seated
        while (table.startTime.getTime() > Date.now()) {
            await Promise.all([
                interaction.editReply({ content: `Hands will be dealt in ${Math.round((table.startTime.getTime() - Date.now()) / 1000)} seconds` }),
                sleep(950)
            ]);
        }

        let embeds = [];

        let deck = new Deck();
        deck.shuffle();
        // deal to each hand (dealer card should be face down)
        await Promise.all([
            Hand.create({ PlayerId: player.id, card: deck.draw().toString() }),
            Hand.create({ BlackjackId: table.id, card: deck.draw().toString() }),
            Hand.create({ PlayerId: player.id, card: deck.draw().toString() }),
            Hand.create({ BlackjackId: table.id, card: deck.draw().toString() }),
            interaction.editReply({ content: "\u200b" })
        ]).then(() => table.getHands())
            .then(dealerCards => {
                let dealerEmbed = new MessageEmbed()
                .setTitle("Dealer Hand");
        
                dealerCards.forEach((hand, index) => {
                    dealerEmbed.addFields({ name: `\u200b`, value: `${index == 0 ? "🂠" : hand.card}`, inline: true });
                })
                embeds.push(dealerEmbed);
                return interaction.editReply({ embeds: embeds });
            })
            .then(() => player.getHands())
            .then(playerCards => {
                let playerEmbed = new MessageEmbed()
                .setTitle(`${interaction.user.username}`)
                .setDescription(`${player.bet} 💰`);

                for (let hand of playerCards) {
                    playerEmbed.addFields({ name: "\u200b", value: `${hand.card}`, inline: true });
                }
                embeds.push(playerEmbed);
                return interaction.editReply({ embeds: embeds });
            })

        // respond to bets with the appropriate buttons in order of seats at the table
        // deal appropriately
        // .then(user => interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`))

        // allows multiple tries for debugging purposes
        Hand.refresh();
    }
}
function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms); });
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
