const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

class SalaryComponent extends Model {
    static associate(models) {
        SalaryComponent.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
        SalaryComponent.hasMany(models.SalaryComponentItem, {
          foreignKey: 'component_id',
          as: 'items',
        });
      }
}

SalaryComponent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'admin_id',
        },
    },
    min_range: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    max_range: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SalaryComponent',
    tableName:'salary_components',
    timestamps: false
  }
);
return SalaryComponent;
}