const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class StaffAttendance extends Model {
    static associate(models) {
      // Define associations with other models if needed
      StaffAttendance.belongsTo(models.Staff, { foreignKey: 'staff_id', as: 'staff' });
      StaffAttendance.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      StaffAttendance.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
    }
  }

  StaffAttendance.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      staff_id: {
        type: DataTypes.BIGINT.UNSIGNED,
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
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      admin_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      session_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'StaffAttendance',
      tableName: 'staff_attendance',
      timestamps: false,
    }
  );

  return StaffAttendance;
};
