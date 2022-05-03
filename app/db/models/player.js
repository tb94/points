const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Player extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Player.User = Player.belongsTo(models.User);
            Player.BlackJack = Player.belongsTo(models.Blackjack, { foreignKey: 'tableId' });
            Player.Hand = Player.hasMany(models.Hand, { onDelete: 'CASCADE' });
        }
    };

    Player.init({
        bet: DataTypes.INTEGER,
        position: DataTypes.INTEGER,
        handValue: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getHands()
                    .then(hands => {
                        let total = 0;
                        hands.forEach(h => {
                            let cardValue = h.card.substring(0, h.card.length - 1);
                            if (cardValue === "A") return;
                            if (!isNaN(cardValue)) return total += parseInt(cardValue);
                            return total += 10;
                        })
                        let aces = hands.filter(h => h.card.charAt(0) === "A");
                        for (let i = aces.length; i > 0; i--) {
                            if (total + (i * 11) <= 21) {
                                total += i * 11;
                                break;
                            }
                            total++;
                        }
                        return total;
                    });
            }
        }
    }, {
        sequelize,
        timestamps: false,
        modelName: 'Player',
    });

    return Player;
};