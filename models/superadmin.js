'use strict';
const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class SuperAdmin extends Model {
    static associate(models) {
    }
  };

  SuperAdmin.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
   
    username: DataTypes.STRING,
    password: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.INTEGER, allowNull: false },
    otp: { type: DataTypes.INTEGER, allowNull: false },

  }, {
    sequelize,
    modelName: 'SuperAdmin',
    tableName: 'superadmin',
    timestamps: false
  });

  return SuperAdmin;

};