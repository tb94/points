const { Model } = require('sequelize');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const SUITS = ["♠", "♣", "♥", "♦"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

module.exports = (sequelize, DataTypes) => {
    class Blackjack extends Model {
        deck;
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Blackjack.Players = Blackjack.hasMany(models.Player, { foreignKey: 'tableId', onDelete: 'CASCADE' });
            Blackjack.Dealer = Blackjack.hasMany(models.Hand, { onDelete: 'CASCADE' });
        }

        async startGame() {
            this.deck = new Deck();
            this.deck.shuffle();
        }
        
        async getHandEmbeds(show = false) {
            let embeds = [];
            let dealerCards = await this.getHands()
            let dealerEmbed = new MessageEmbed()
                .setTitle("Dealer Hand");
    
            dealerCards.forEach((hand, index) => {
                dealerEmbed.addFields({ name: `\u200b`, value: `${index == 0 && !show ? "🂠" : hand.card}`, inline: true });
            });
            embeds.push(dealerEmbed);
    
            let players = await this.getPlayers();

            await Promise.all(players.map(async (player) => {
                let user = await player.getUser();
                let playerCards = await player.getHands();
                let playerEmbed = new MessageEmbed()
                    .setTitle(`${user.username.split('#')[0]}`);
    
                playerCards.forEach(hand => {
                    playerEmbed.addFields({ name: "\u200b", value: `${hand.card}`, inline: true });
                });
    
                embeds.push(playerEmbed);
            }));
    
            return embeds;
        }
    };

    Blackjack.init({
        guild: DataTypes.STRING,
        channel: DataTypes.STRING,
        startTime: DataTypes.DATE
    }, {
        hooks: {
            beforeCreate: (table, options) => { table.startTime = Date.now() + (3 * 1000); },
            afterCreate: (table, options) => { table.startGame(); }
        },
        sequelize,
        timestamps: false,
        modelName: 'Blackjack',
    });

    return Blackjack;
};

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
