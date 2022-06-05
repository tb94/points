const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class RouletteBet extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            RouletteBet.belongsTo(models.Player, { onDelete: 'CASCADE' });
        }
    }

    RouletteBet.init({
        bet: {
            type: DataTypes.STRING,
            // get() {
            //     return this.bet?.split(",")?.map(Number);
            // }
        },
        points: DataTypes.INTEGER,
        type: DataTypes.STRING,
    }, {
        sequelize,
        timestamps: false
    });

    return RouletteBet
}