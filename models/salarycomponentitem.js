const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

class SalaryComponentItem extends Model {
    static associate(models) {
        SalaryComponentItem.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
        SalaryComponentItem.belongsTo(models.SalaryComponent, { foreignKey: 'component_id', as: 'salary_component' });
      }
}

SalaryComponentItem.init(
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
    component_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'SalaryComponent',
          key: 'id',
        },
    },
    component_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    component_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    component_value: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SalaryComponentItem',
    tableName:'salary_component_items',
    timestamps: false
  }
);
return SalaryComponentItem;
}