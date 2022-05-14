const { Card, Player, User } = require("../db/models");
const { Deck } = require("../helpers/cards");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

class Blackjack {
    guild;
    actionRow;
    table;
    deck;
    dealer;
    collector;
    message;

    constructor(table, guild) {
        this.guild = guild;
        this.table = table;
        this.deck = new Deck();
        this.deck.shuffle();
        this.actionRow = new MessageActionRow()
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
        this.#deal().then(r => console.log("Playing Blackjack!"));
    }

    async #deal() {
        [this.dealer] = await Player.findCreateFind({
            where: { BlackjackId: this.table.id, UserId: null },
            defaults: { position: 0 }
        });


        while (this.table.Players?.length <= 1 || this.table.startTime?.getTime() >= Date.now()) {
            await new Promise((resolve) => {
                this.deck.shuffle();
                this.table.reload({ include: [{ all: true, nested: true }] })
                    .then(() => setTimeout(resolve, 1000))
            });
        }

        let channel = await this.guild.channels.fetch(this.table.channel);
        let members = await this.guild.members.fetch();
        let mentions = this.table.Players.map(p => members.find(m => m.user.tag === p.User?.username)?.user);
        this.message = await channel.send(`${mentions.filter(m => m != null)}`)

        for (let p of this.table.Players)
            await this.#hit(p);
        for (let p of this.table.Players) {
            await this.#hit(p);
        }

        await this.table.reload({ include: [{ all: true, nested: true }] });
        await this.dealer.reload({ include: [{ all: true, nested: true }] });

        await this.message.edit({ embeds: await this.#getEmbeds(), components: [this.actionRow] });

        for (let p of this.table.Players) {
            if (p.hasBlackjack())
                await this.message.reply(`${members.find(m => m.user.id === p.User?.snowflake) ?? 'Dealer'} has Blackjack!`);
        }

        await this.message.edit({ embeds: await this.#getEmbeds(), components: [this.actionRow] });

        this.collector = this.message.createMessageComponentCollector({ componentType: 'BUTTON', time: (30 * 1000) });
        this.collector.on('collect', i => this.#collect(i));
        this.collector.on('end', () => this.#end());

        if (this.dealer.hasBlackjack())
            this.collector.stop();

        if (this.table.Players.filter(p => !p.hasBlackjack() && p.User != null).length == 0)
            await this.#stand(this.dealer)
                .then(() => this.collector.stop());
    }

    async #getEmbeds(show = false) {
        let embeds = [];
        await this.table.reload({ include: [{ all: true, nested: true }] });

        for (let p of this.table.Players){
            let embed = new MessageEmbed().setColor("DARK_GREEN");

            if (p.User == null) {
                embed.setTitle("Dealer");
                p.Cards.forEach((card, index) => embed.addFields({ name: `\u200b`, value: `${index == 0 && !show ? "🂠" : card.value + card.suit}`, inline: true }));
                if (show) embed.setFooter(`Total: ${p.handValue}`);
            } else {
                embed.setTitle(`${p.User.username.split('#')[0]}\t\t\t${p.bet} 💰`);
                p.Cards.forEach(card => embed.addField("\u200b", card.value + card.suit, true ));
                embed.setFooter(`Total: ${p.handValue}`);
            }
            embeds.unshift(embed);
        }
        return embeds;
    }

    async #collect(interaction) {
        let user = await User.findOne({ where: { snowflake: interaction.user.id, guild: interaction.guildId}})
        if (!user) return interaction.reply({ content: `That's not for you`, ephemeral: true });

        await this.table.reload({ include: [{ all: true, nested: true }] });

        let player = await Player.findOne({ where: { BlackjackId: this.table.id, UserId: user.id }})
        if (!player) return interaction.reply({ content: `That's not for you`, ephemeral: true });

        try {
            switch (interaction.customId) {
                case 'hit':
                    await this.#hit(player);
                    break;
                case 'stand':
                    await this.#stand(player);
                    break;
                case 'double':
                    await this.#double(player);
                    break;
                default:
                    throw new Error("Can't do that yet");
            }
        } catch (e) {
            return interaction.reply({ content: e.message, ephemeral: true });
        }

        await this.table.reload({ include: [{ all: true, nested: true }] });

        await interaction.update({ embeds: await this.#getEmbeds() });

        let all = this.table.Players.filter(p => p.User != null);
        let done = all.filter(p => p.handValue >= 21 || p.stay);
        if (done.length >= all.length)
            this.collector.stop();
    }

    async #end() {
        this.actionRow.components.forEach(button => button.setDisabled());

        await this.message.edit({ embeds: await this.#getEmbeds(true), components: [this.actionRow] });
        await this.table.reload({ include: [{ all: true, nested: true }] });
        await this.dealer.reload();
        let all = this.table.Players.filter(p => p.User != null);
        let out = all.filter(p => p.handValue > 21 || p.hasBlackjack());
        await this.dealer.update({ stay: this.dealer.stay || all.length - out.length <= 0})

        while (this.dealer.handValue <= 16 && !this.dealer.stay) {
            await this.#hit(this.dealer);
            await this.table.reload({ include: [{ all: true, nested: true }] });
            await this.message.edit({ embeds: await this.#getEmbeds(true) })
            await this.dealer.reload();
        }

        let members = await this.guild.members.fetch();

        for (let player of this.table.Players) {
            await player.reload({ include: [{ all: true, nested: true }] });
            if (!player.User) continue;

            let winnings = 0;

            if (player.handValue > 21
                || (this.dealer.hasBlackjack() && !player.hasBlackjack())
                || (this.dealer.handValue <= 21 && player.handValue < this.dealer.handValue)) {
                await player.destroy();
                continue;
            } else if (player.hasBlackjack() && !this.dealer.hasBlackjack())
                winnings = Math.ceil(player.bet * 3/2)
            else if (player.handValue > this.dealer.handValue || this.dealer.handValue > 21)
                winnings = player.bet;

            await player.User.increment({ balance: winnings + player.bet });
            if (winnings > 0)
                await this.message.reply(`${members.find(m => m.user.id === player.User.snowflake)} won ${winnings} 💰!`);
            await player.destroy();
        }
        await this.dealer.destroy();
        await Card.destroy({ where: { PlayerId: null } });
        await this.table.update({ startTime: null });
    }

    async #hit(player) {
        if (player.handValue >= 21) throw new Error(`You already ${player.handValue === 21 ? "have 21" : "busted"}!`);
        if (player.stay) throw new Error(`You already clicked stand`);

        this.collector?.resetTimer();

        let card = this.deck.draw().toString();
        await Card.create({
            PlayerId: player.id,
            value: card.substring(0, card.length - 1),
            suit: card.slice(-1)
        });
    }

    async #double(player) {
        let user = await player.getUser();
        let cards = await player.getCards();

        if (user.balance < player.bet) throw new Error("You don't have enough points for that");
        if (cards.length > 2) throw new Error("You can't double after hitting");

        this.collector?.resetTimer();

        await user.decrement({ balance: player.bet });
        await player.increment({ bet: player.bet})
        await this.#hit(player);
        return this.#stand(player);
    }

    async #stand(player) {
        if (!player.stay) return player.update({ stay: true });
    }
}

module.exports = { Blackjack }