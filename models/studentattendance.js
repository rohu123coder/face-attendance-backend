const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {

class StudentAttendance extends Model {
  static associate(models) {
    // Define associations
    StudentAttendance.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
    StudentAttendance.belongsTo(models.User, { foreignKey: 'admin_id', as: 'user' });
    StudentAttendance.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
  }
}

StudentAttendance.init(
  {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
    student_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Student',
        key: 'id',
      },
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    day: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    entrance_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    exit_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'StudentAttendance',
    tableName: 'student_attendance',
    timestamps: false,
  }
);
return StudentAttendance;
}

