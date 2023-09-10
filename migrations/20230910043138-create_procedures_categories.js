'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE CategoriesList(IN searchTerm VARCHAR(255), IN offsetParam INT, IN limitParam INT, OUT totalCount INT)
      BEGIN
          IF searchTerm IS NULL OR searchTerm = '' THEN
              SET searchTerm = '%';
          ELSE 
              SET searchTerm = CONCAT('%', searchTerm, '%');
          END IF;
          SELECT COUNT(*) INTO totalCount FROM categories WHERE name LIKE searchTerm;
          SELECT * FROM categories WHERE name LIKE searchTerm ORDER BY id ASC LIMIT offsetParam, limitParam;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE CategoryAdd(IN inputName VARCHAR(255), IN inputSlug VARCHAR(255), IN inputImage VARCHAR(255), OUT result VARCHAR(255))
      BEGIN
          DECLARE existingNameCount INT;
          SELECT COUNT(*) INTO existingNameCount FROM categories WHERE name = inputName;
          IF existingNameCount = 0 THEN
              INSERT INTO categories (name, slug, image, created_at, updated_at) VALUES (inputName, inputSlug, inputImage, NOW(), NOW());
              SET result = 'Insert successful';
          ELSE 
              SET result = 'Error: Name already exists in categories';
          END IF;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE CategoryByIdGet(IN categoryId BIGINT(20) UNSIGNED)
      BEGIN
          SELECT * FROM categories WHERE id = categoryId;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE CategoryDelete(IN categoryId BIGINT(20) UNSIGNED, OUT result VARCHAR(255))
      BEGIN
          DELETE FROM categories WHERE id = categoryId;
          IF ROW_COUNT() = 0 THEN
              SET result = 'Error: Category not found';
          ELSE
              SET result = 'Delete successful';
          END IF;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE CategoryUpdate(IN categoryId BIGINT(20) UNSIGNED, IN newName VARCHAR(255), IN newSlug VARCHAR(255), IN newImage VARCHAR(255), OUT result VARCHAR(255))
      BEGIN
          DECLARE existingNameCount INT;
          SET result = 'Update successful';
          IF (SELECT name FROM categories WHERE id = categoryId) != newName THEN
              SELECT COUNT(*) INTO existingNameCount FROM categories WHERE name = newName;
              IF existingNameCount > 0 THEN
                  SET result = 'Error: Name already exists in categories';
              ELSE
                  UPDATE categories SET name = newName, slug = newSlug, image = newImage, updated_at = NOW() WHERE id = categoryId;
              END IF;
          ELSE
              UPDATE categories SET name = newName, slug = newSlug, image = newImage, updated_at = NOW() WHERE id = categoryId;
          END IF;
      END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS CategoriesList;');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS CategoryAdd;');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS CategoryByIdGet;');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS CategoryDelete;');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS CategoryUpdate;');
  }
};
