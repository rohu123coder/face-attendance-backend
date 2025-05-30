const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');
const db = require('../models');


module.exports = (sequelize, DataTypes) => {


class Standard extends Model {
    static associate(models) {
      Standard.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      Standard.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
      Standard.hasOne(models.Student,{ foreignKey: 'class_id', as: 'class' })
    }
}

Standard.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    class_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'admin_id',
      },
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Session',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Standard',
    tableName:'standards',
    timestamps: false
  }
);
return Standard;
}





