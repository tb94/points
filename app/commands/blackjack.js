const { SlashCommandBuilder } = require('@discordjs/builders');
const { Player, Blackjack } = require('../db/models');
const { Blackjack: Game } = require('../games/blackjack');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Single Deck; Dealer stands on 17 ; Blackjack pays 3:2')
        .addIntegerOption(o => o
            .setName('points')
            .setRequired(true)
            .setDescription('How many points to bet')),
    async execute(interaction, user) {
        let bet = interaction.options.getInteger('points');

        if (bet <= 0) return interaction.reply({ content: "You have to bet a real amount", ephemeral: true });
        if (user.balance < bet) return interaction.reply({ content: "You don't have that many points!", ephemeral: true });

        let [table, newTable] = await Blackjack.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player });
        if (!table.startTime) newTable = true;
        else if (table.startTime.getTime() < Date.now()) return interaction.reply({ content: "A game is already in session, wait for the next hand", ephemeral: true });

        let [player, newPlayer] = await Player.findCreateFind({ where: { BlackjackId: table.id, UserId: user.id }, defaults: { bet: bet, position: (table.Players?.length ?? 0) + 1 } });

        if (!newPlayer) return interaction.reply({ content: `Please wait for other players to join`, ephemeral: true });
        await user.decrement({ balance: player.bet });
        await interaction.reply({ content: `${interaction.user} ${newTable ? "started" : "joined"} blackjack with ${player.bet} 💰 bet!` });
        await table.update({ startTime: Date.now() + (10 * 1000)})
        if (newTable)
            new Game(table, interaction.guild);
    }
}
