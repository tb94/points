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
    position: DataTypes.INTEGER
  }, {
    sequelize,
    timestamps: false,
    modelName: 'Player',
  });

  return Player;
};