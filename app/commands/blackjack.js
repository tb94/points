const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
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

        User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guildId } })
            .then(([user]) => {
                if (user.balance < bet) {
                    interaction.reply({ content: "You don't have that many points!", ephemeral: true });
                    throw new Error('User bet more than they had');
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
                        new MessageButton()
                            .setCustomId('split')
                            .setLabel('Split')
                            .setStyle('SECONDARY')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('double')
                            .setLabel('Double Down')
                            .setStyle('PRIMARY')
                            .setDisabled(true)
                    );

                // create table specific to the channel and server, add user to the table if it already exists
                Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player })
                    .then(([table]) => {
                        // set start time 1 minute from now
                        table.startTime = Date.now() + (60 * 60 * 1000);
                        table.save();
                        return Player.findCreateFind({ where: { tableId: table.id, userId: user.username } })
                    }).then(([player]) => {
                        player.bet = bet;
                        player.save();
                        return player.getBlackjack();
                    }).then((table) => interaction.reply({ content: `Hands will be dealt in ${Math.round((table.startTime.getTime() - Date.now())  / 60000)} seconds`, components: [row] }))
                    // if table is already started, respond with ephemeral to try the next hand
                    // each table should have a dealer, deck, and 1+ users (timestamp of when the hand will be dealt - can be extended as users enter - show countown in embed)
                    // reply with notification to join the table and wait for more users to join
                    .then(() => {
                        // wait for users to be seated

                        // deal one card to each hand (dealer card should be face down)

                        // deal second card to each hand (dealer card should be face up)

                        // respond to bets with the appropriate buttons in order of seats at the table
                        // deal appropriately
                    })
                    // .then(user => interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`))
                    .catch(err => console.error(err));
            });
    }

}
// if (win) {
//     return user.increment('balance', { by: bet }).then(() => user.reload());
// } else {
//     return user.decrement('balance', { by: bet }).then(() => user.reload());
// }
