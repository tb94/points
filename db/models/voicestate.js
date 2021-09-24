'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VoiceState extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      VoiceState.belongsTo(models.User);
    }
  };
  VoiceState.init({
    channelId: DataTypes.STRING,
    timestamp: DataTypes.DATE
  }, {
    sequelize,
    timestamps: false,
    modelName: 'VoiceState',
  });
  return VoiceState;
};