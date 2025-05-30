const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');


module.exports = (sequelize, DataTypes) => {


class Medium extends Model {
    static associate(models) {
      Medium.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      Medium.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
    }
}

Medium.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mid: {
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
    modelName: 'Medium',
    tableName:'mediums',
    timestamps: false
  }
);
return Medium;
}





