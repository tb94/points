const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Deck extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Deck.hasMany(models.Card, { onDelete: 'CASCADE' });
            Deck.belongsTo(models.Blackjack);
            Deck.belongsTo(models.Baccarat);
            Deck.addScope('defaultScope', { include: models.Card })
        }
        
        // async shuffle(cards) {
        //     for (let i = cards.length -1; i > 0; i--) {
        //         const newIndex = Math.floor(math.random() * (i + 1))
        //     }
        // }

        async cardsRemaining() {
            let cards = await this.getCards();
            return cards.length;
        }
    }

    Deck.init({
    }, {
        // hooks: {
        //     beforeCreate: (deck, options) => {
        //         cards = await deck.getCards();
        //         deck.Cards = await shuffle(cards);
        //     }
        // },
        sequelize,
        timestamps: false,
        modelName: 'Deck',
    });

    return Deck;
};