'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
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
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        collate: 'utf8mb4_unicode_ci'
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      remember_token: {
        type: Sequelize.STRING(100),
        allowNull: true,
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
    await queryInterface.dropTable('users');
  }
};
