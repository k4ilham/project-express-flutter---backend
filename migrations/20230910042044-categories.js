'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.BIGINT(20).UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('categories');
  }
};
