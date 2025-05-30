'use strict';
const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class UserSession extends Model {
    static associate(models) {
    }
  };

  UserSession.init({
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'admin_id',
        },
      },
    session_identifier: { type: DataTypes.STRING, allowNull: true },
   
  }, {
    sequelize,
    modelName: 'UserSession',
    tableName: 'user_sessions',
    timestamps: false
  });

  return UserSession;

};