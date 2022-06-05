const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Roulette extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Roulette.hasMany(models.Player, { onDelete: 'CASCADE' });
        }
    }

    Roulette.init({
        guild: DataTypes.STRING,
        channel: {
            type: DataTypes.STRING,
            unique: true
        },
        startTime: DataTypes.DATE
    }, {
        hooks: {
            beforeCreate: (table, options) => { table.startTime = Date.now() + (300 * 1000); }
        },
        sequelize,
        timestamps: false
    });

    return Roulette
}