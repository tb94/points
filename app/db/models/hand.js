const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Hand extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Hand.Player = Hand.belongsTo(models.Player);
      Hand.Dealer = Hand.belongsTo(models.Blackjack)
    }

    static refresh() {
      Hand.destroy({ where: { card: {[Op.not]: null } } });
    }

  };

  Hand.init({
    card: DataTypes.STRING,
  }, {
    sequelize,
    timestamps: false,
    modelName: 'Hand',
  });

  return Hand;
};