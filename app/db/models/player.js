const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Player extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Player.belongsTo(models.User);
            Player.belongsTo(models.Blackjack);
            Player.belongsTo(models.Baccarat);
            Player.hasMany(models.Card, { onDelete: 'CASCADE' });
            Player.addScope('defaultScope', { include: models.Card });
        }

        hasBlackjack() {
            return this.handValue == 21 && this.Cards.length == 2;
        }
    };

    Player.init({
        bet: DataTypes.INTEGER,
        position: DataTypes.INTEGER,
        stay: DataTypes.BOOLEAN,
        playerBet: DataTypes.INTEGER,
        bankerBet: DataTypes.INTEGER,
        tieBet: DataTypes.INTEGER,
        handValue: {
            type: DataTypes.VIRTUAL,
            get() {
                let total = 0;
                this.Cards.forEach(c => {
                    if (c.isAce()) return;
                    total += (c.isFace() ? 10 : parseInt(c.value));
                })
                let aces = this.Cards.filter(c => c.isAce());
                for (let i = aces.length; i > 0; i--) {
                    if (total + (i * 11) <= 21) {
                        total += i * 11;
                        break;
                    }
                    total++;
                }
                return total;
            }
        }
    }, {
        sequelize,
        timestamps: false,
        modelName: 'Player',
    });

    return Player;
};