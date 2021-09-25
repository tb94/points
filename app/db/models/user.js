const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasOne(models.VoiceState);
    }
  };

  User.init({
    username: DataTypes.STRING,
    guild: DataTypes.STRING,
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    timestamps: false,
    modelName: 'User',
    indexes: [{ unique: true, fields: ['username', 'guild']}]
  });

  return User;
};