const { SlashCommandBuilder, SlashCommandIntegerOption } = require('@discordjs/builders');
const { User, Player, Roulette, RouletteBet } = require('../db/models');
const pointsOption = new SlashCommandIntegerOption()
    .setName('points')
    .setDescription('how many points to bet')
    .setRequired(true)
    .setMinValue(0);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Play Roulette!')
        .addSubcommandGroup(g => g.setName('inside')
            .setDescription('bet on a number, or group of numbers (split, street, corner, line, five')
            .addSubcommand(c => c.setName('straight')
                .setDescription('bet on a single number')
                .addIntegerOption(pointsOption)
                .addIntegerOption(o => o.setName('number')
                    .setDescription('number to bet on')
                    .setRequired(true)
                    .setMinValue(0)
                    .setMaxValue(36))))
        .addSubcommandGroup(g => g.setName('outside')
            .setDescription('bet on a category, or range of numbers (color, half, even/odd, third or dozen, column')
            .addSubcommand(c => c.setName('color')
                .setDescription('bet on a color')
                .addStringOption(o => o.setName('color')
                        .setDescription('color to bet on')
                        .setRequired(true)
                        .addChoices({ name: "red", value: "red" }, { name: 'black', value: 'black' }))
                .addIntegerOption(pointsOption)))
        .addSubcommandGroup(g => g.setName('clear')
            .setDescription('Clear some or all of your bets')
            .addSubcommand(c => c.setName('all')
                .setDescription('clear all bets'))
            .addSubcommand(c => c.setName('inside')
                .setDescription('clear all bets inside'))
            .addSubcommand(c => c.setName('outside')
                .setDescription('clear all bets outside'))
            .addSubcommand(c => c.setName('last')
                .setDescription('clear last bet'))),
    async execute(interaction, user) {
        let [table, newTable] = await Roulette.findCreateFind({ where: { guild: interaction.guildId, channel: interaction.channelId }, include: Player });
        if (!newTable && table.startTime.getTime() < Date.now()) return interaction.reply({ content: "A game is already in session, wait for the next roll please", ephemeral: true });

        // need to send a message that the table has started

        let [player] = await Player.findCreateFind({ where: { RouletteId: table.id, UserId: user.id }, include: [RouletteBet, User] });
        player = await player.reload();

        let reply;
        switch (interaction.options.getSubcommandGroup()) {
            case 'inside':
                reply = await betInside(interaction, player);
                break;
            case 'outside':
                reply = await betOutside(interaction, player);
                break;
            case 'clear':
                clear(interaction, user);
                break;
            default:
                return interaction.reply({ content: "Something went wrong", ephemeral: true });
        }

        return interaction.reply(reply);
    }
}

function bet(interaction, user) {
    switch (interaction.options.getSubcommand()) {
        case 'straight':
            betInside(interaction, user);
            break;
        case 'outside':
            betOutside(interaction, user);
            break;
        default:
            console.log("something went wrong");
    }
}

function clear(interaction, user) {
    switch (interaction.options.getSubcommand()) {
        case 'inside':
            clearInside(interaction, user);
            break;
        case 'outside':
            clearOutside(interaction, user);
            break;
        default:
            console.log("something went wrong");
    }
}

async function betInside(interaction, player) {
    let points = interaction.options.getInteger('points');
    let reply = {};

    if (points > player.User.balance) return { content: "You don't have that many points!", ephemeral: true }

    switch (interaction.options.getSubcommand()) {
        case 'straight':
            let bet = interaction.options.getInteger('number');

            let [rouletteBet, newBet] = await RouletteBet.findCreateFind({
                where: { PlayerId: player.id, bet: bet },
                defaults: { points: points }
            });
            if (!newBet) await rouletteBet.increment({ points: points });
            await rouletteBet.reload();
            console.log(player);

            await player.User.decrement({ balance: points })
            reply.content = `You bet ${points} on ${bet}. Your total bet on ${bet} is ${rouletteBet.points}`;
            break;
        case 'split':
            break;
    }

    return reply;
}

async function betOutside(interaction, player) {
    let points = interaction.options.getInteger('points');
    let reply = {};

    if (points > player.User.balance) return { content: "You don't have that many points!", ephemeral: true }

    switch (interaction.options.getSubcommand()) {
        case 'color':
            let bet = interaction.options.getString('color');

            let [rouletteBet, newBet] = await RouletteBet.findCreateFind({
                where: { PlayerId: player.id, bet: bet },
                defaults: { points: points }
            });
            if (!newBet) await rouletteBet.increment({ points: points });
            await rouletteBet.reload();
            await player.User.decrement({ balance: points })
            reply.content = `You bet ${points} on ${bet}. Your total bet on ${bet} is ${rouletteBet.points}`;
            break;
        default:
            reply.content = "something went wrong";
            reply.ephemeral = true;
    }

    return reply;
}