const { Card, Deck } = require('../db/models');

const SUITS = ["♠", "♣", "♥", "♦"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

module.exports = {
    async buildDeck(size) {
        let cards = [];
        for (let i = 0; i < size; i++) {
            let deck = await this.freshDeck();
            cards.push(... deck);
        }
        
        this.shuffle(cards);
        this.shuffle(cards);
        this.shuffle(cards);

        let d = await Deck.create({ Cards: cards }, { include: Card });
        return d;
    },

    async freshDeck() {
        let cards = SUITS.flatMap(s => VALUES.map(v => ({ suit: s, value: v })));
        return cards;
    },

    shuffle(cards) {
        for (let i = cards.length - 1; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i + 1));
            const oldValue = cards[newIndex];
            cards[newIndex] = cards[i];
            cards[i] = oldValue;
        }
    }
}