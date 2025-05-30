const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StaffBankInfo extends Model {

    static associate(models) {
      // Define associations here if necessary
        StaffBankInfo.belongsTo(models.Staff, { foreignKey: 'staff_id', as: 'staff' });
    }
  }

  StaffBankInfo.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      staff_id: DataTypes.INTEGER, // Foreign key to associate with staffs table
      bank_name: DataTypes.STRING,
      bank_branch: DataTypes.STRING,
      bank_ifsc: DataTypes.STRING,
      acc_no: DataTypes.STRING,
      pf_no: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'StaffBankInfo',
      tableName: 'staff_bank_info',
      timestamps: false,
    }
  );

  return StaffBankInfo;
};
