const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { User } = require('../db/models');

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
                            .setStyle('PRIMARY')
                    );

                interaction.reply({ content: 'this is a message with a button', components: [row] })
                    .then(() => { });

            })
            .then(user => interaction.reply(`You ${win ? "Won" : "Lost"}! Your current balance is ${user.balance} 💰`))
            .catch(err => console.error(err));
    }
};

// if (win) {
//     return user.increment('balance', { by: bet }).then(() => user.reload());
// } else {
//     return user.decrement('balance', { by: bet }).then(() => user.reload());
// }
