'use strict';
const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserSession, { as: 'sessions', foreignKey: 'userId', onDelete: 'CASCADE' });

    }
  };

  User.init({
    admin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    entity_name: { type: DataTypes.STRING, allowNull: true },
    username: DataTypes.STRING,
    password: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.INTEGER, default: true },
    role: { type: DataTypes.INTEGER, allowNull: false },
    mobile: { type: DataTypes.STRING, allowNull: true },
    auth_token_socket: { type: DataTypes.STRING, allowNull: true },
    isLoggedIn: { type: DataTypes.INTEGER, default: false },
    last_logged_in:{ type: 'TIMESTAMP', allowNull: true },
    resetLink: { type: DataTypes.STRING, allowNull: true },
    max_logins: { type: DataTypes.INTEGER,},
    student_limit: { type: DataTypes.INTEGER,},
    staff_limit: { type: DataTypes.INTEGER,},
    entity_logo: { type: DataTypes.STRING,}
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });

  return User;

};