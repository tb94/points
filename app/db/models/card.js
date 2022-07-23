const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Card extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Card.belongsTo(models.Player);
            Card.belongsTo(models.Deck);
        }

        isAce() {
            return this.value === "A";
        }

        isFace() {
            return ["J", "Q", "K"].includes(this.value);
        }
    };

    Card.init({
        value: DataTypes.STRING,
        suit: DataTypes.STRING
    }, {
        sequelize,
        timestamps: false,
        modelName: 'Card',
    });

    return Card;
};