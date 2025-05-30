const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {

class StaffLeaves extends Model {
  static associate(models) {
    // Define associations
    StaffLeaves.belongsTo(models.StaffDesignation, { foreignKey: 'designation_id', as: 'designation' });
    StaffLeaves.belongsTo(models.User, { foreignKey: 'admin_id', as: 'user' });
    StaffLeaves.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
  }
}

StaffLeaves.init(
  {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
    designation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'StaffDesignation',
          key: 'id',
        },
      },
      admin_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      session_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          references: {
            model: 'Session',
            key: 'id',
          },
        },
      desc: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      day: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
   
  },
  {
    sequelize,
    modelName: 'StaffLeaves',
    tableName: 'staff_leaves',
    timestamps: false,
  }
);
return StaffLeaves;
}

