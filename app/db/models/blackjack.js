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
      models.Player.Blackjack = Blackjack.hasMany(models.Player)
    }
  };

  Blackjack.init({
    guild: DataTypes.STRING,
    channel: DataTypes.STRING,
    startTime: DataTypes.DATE
  }, {
    sequelize,
    timestamps: false,
    modelName: 'Blackjack',
  });

  return Blackjack;
};