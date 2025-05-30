const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {

class StudentLeaves extends Model {
  static associate(models) {
    // Define associations
    StudentLeaves.belongsTo(models.Standard, { foreignKey: 'class_id', as: 'class' });
    StudentLeaves.belongsTo(models.Medium, { foreignKey: 'medium_id', as: 'medium' });
    StudentLeaves.belongsTo(models.User, { foreignKey: 'admin_id', as: 'user' });
    StudentLeaves.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
  }
}

StudentLeaves.init(
  {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
    class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Standard',
          key: 'id',
        },
      },
      medium_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Medium',
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
    modelName: 'StudentLeaves',
    tableName: 'student_leaves',
    timestamps: false,
  }
);
return StudentLeaves;
}

