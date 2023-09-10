'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // UserByIdGet Procedure
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE UserByIdGet(IN inputUserId BIGINT(20))
      BEGIN
        SELECT id, name, email FROM users WHERE id = inputUserId;
      END
    `);

    // UserLogin Procedure
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE UserLogin(IN inputEmail VARCHAR(255), IN inputPassword VARCHAR(255), OUT userId BIGINT(20), OUT result VARCHAR(255))
      BEGIN
        DECLARE userIdFound BIGINT(20) DEFAULT 0;
        SELECT id INTO userIdFound FROM users WHERE email = inputEmail AND password = SHA2(inputPassword, 256);
        IF userIdFound != 0 THEN
          SET userId = userIdFound;
          SET result = 'Login successful';
        ELSE 
          SET userId = NULL;
          SET result = 'Error: Invalid email or password';
        END IF;
      END
    `);

    // UserRegister Procedure
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE UserRegister(IN inputName VARCHAR(255), IN inputEmail VARCHAR(255), IN inputPassword VARCHAR(255), OUT result VARCHAR(255))
      BEGIN
        DECLARE existingEmailCount INT;
        SELECT COUNT(*) INTO existingEmailCount FROM users WHERE email = inputEmail;
        IF existingEmailCount = 0 THEN
          INSERT INTO users (name, email, password, created_at, updated_at) VALUES (inputName, inputEmail, SHA2(inputPassword, 256), NOW(), NOW());
          SET result = 'Registration successful';
        ELSE 
          SET result = 'Error: Email already exists';
        END IF;
      END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop procedures when rolling back
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS UserByIdGet;');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS UserLogin;');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS UserRegister;');
  }
};
