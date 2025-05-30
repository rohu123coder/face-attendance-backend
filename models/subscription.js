const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

class Subscription extends Model {
    static associate(models) {
     
        Subscription.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      }
}

Subscription.init(
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
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName:'subscription',
    timestamps: false
  }
);
return Subscription;
}