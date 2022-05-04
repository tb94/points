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
            Blackjack.hasMany(models.Player, { foreignKey: 'tableId', onDelete: 'CASCADE' });
        }

        async startGame() {
            this.deck = new Deck();
            this.deck.shuffle();
        }
        
        async getHandEmbeds(show = false) {
            let embeds = [];
            let players = await this.getPlayers()

            for (let player of players) {
                let user = await player.getUser();
                let hands = await player.getHands();
                let embed = new MessageEmbed();

                if (!user) {
                    embed.setTitle("Dealer");
                    hands.forEach((hand, index) => embed.addFields({ name: `\u200b`, value: `${index == 0 && !show ? "🂠" : hand.card}`, inline: true }));
                } else {
                    embed.setTitle(`${user.username.split('#')[0]}`);
                    hands.forEach(hand => embed.addFields({ name: "\u200b", value: hand.card, inline: true }));
                }
                embeds.unshift(embed);
            }    
            return embeds;
        }
    };

    Blackjack.init({
        guild: DataTypes.STRING,
        channel: DataTypes.STRING,
        startTime: DataTypes.DATE
    }, {
        hooks: {
            beforeCreate: (table, options) => { table.startTime = Date.now() + (30 * 1000); },
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
