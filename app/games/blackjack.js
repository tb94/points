const { Hand } = require('../db/models');
const { MessageEmbed } = require('discord.js');

const SUITS = ["♠", "♣", "♥", "♦"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

class BlackjackGame {
    constructor(table, client) {
        this.table = table;
        this.client = client;
        this.deck;
        this.startGame();
    }

    async startGame() {
        console.log(`starting game ${this.table.id}`);
        while (this.table.startTime.getTime() > Date.now()) {
            await new Promise((resolve) => { setTimeout(resolve, 250); });
        }

        this.deck = new Deck();
        this.deck.shuffle();

        let players = await this.table.getPlayers();
        this.deal(players);

        let channel = this.client.channels.cache.get(this.table.channel);
        let message = await channel.send(`Blackjack`);
        let embeds = [];

        this.table.getHands()
            .then(dealerCards => {
                let dealerEmbed = new MessageEmbed()
                    .setTitle("Dealer Hand");

                dealerCards.forEach((hand, index) => {
                    dealerEmbed.addFields({ name: `\u200b`, value: `${index == 0 ? "🂠" : hand.card}`, inline: true });
                });
                embeds.push(dealerEmbed);
            });

        for (let player of players) {
            let playerCards = await player.getHands();
            let user = await player.getUser();

            let playerEmbed = new MessageEmbed()
                .setTitle(`${user.username.split('#')}`)
                .setDescription(`${player.bet} 💰`);

            playerCards.forEach(hand => {
                playerEmbed.addFields({ name: "\u200b", value: `${hand.card}`, inline: true });
            });

            embeds.push(playerEmbed);
            message.edit({ embeds: embeds });
        }
    }

    deal(players) {
        players.forEach((player, index) => {
            player.update({ position: index });
            Hand.create({ PlayerId: player.id, card: this.deck.draw().toString() });
        });

        Hand.create({ BlackjackId: this.table.id, card: this.deck.draw().toString() });

        players.forEach(player => Hand.create({ PlayerId: player.id, card: this.deck.draw().toString() }));

        Hand.create({ BlackjackId: this.table.id, card: this.deck.draw().toString() });
    }
}

class Deck {
    constructor(cards = freshDeck()) {
        this.cards = cards
    }

    get numberOfCards() {
        return this.cards.length
    }

    draw() {
        return this.cards.shift()
    }

    shuffle() {
        for (let i = this.numberOfCards - 1; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i + 1))
            const oldValue = this.cards[newIndex]
            this.cards[newIndex] = this.cards[i]
            this.cards[i] = oldValue
        }
    }
}

class Card {
    constructor(suit, value) {
        this.suit = suit
        this.value = value
    }

    get color() {
        return this.suit === "♣" || this.suit === "♠" ? "black" : "red"
    }

    toString() {
        return this.value + this.suit;
    }
}

function freshDeck() {
    return SUITS.flatMap(suit => {
        return VALUES.map(value => {
            return new Card(suit, value)
        })
    })
}

module.exports = { BlackjackGame }