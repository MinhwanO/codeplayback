const Sequelize = require('sequelize');

class classTime extends Sequelize.Model {
  static initiate(sequelize) {
    classTime.init({
      number: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      score: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      grade: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      big: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gyogua: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cstime: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      place: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      daehak: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gaeseol: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gshak: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pfname: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      language: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'classTime',
      tableName: 'test',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
  }
};

module.exports = classTime;