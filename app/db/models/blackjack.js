const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Blackjack extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Blackjack.hasMany(models.Player, { onDelete: 'CASCADE' });
        }
    }

    Blackjack.init({
        guild: DataTypes.STRING,
        channel: DataTypes.STRING,
        startTime: DataTypes.DATE
    }, {
        hooks: {
            beforeCreate: (table, options) => { table.startTime = Date.now() + (10 * 1000); }
        },
        sequelize,
        timestamps: false,
        modelName: 'Blackjack',
    });

    return Blackjack;
}

