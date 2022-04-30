'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Players', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      table: {
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING
      },
      bet: {
        type: Sequelize.INTEGER
      },
      handId: {
        type: Sequelize.INTEGER
      },
      position: {
        type: Sequelize.INTEGER
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Players');
  }
};