const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Staff extends Model {
    static associate(models) {
      Staff.belongsTo(models.StaffDepartment, { foreignKey: 'department_id', as: 'department' });
      Staff.belongsTo(models.StaffDesignation, { foreignKey: 'designation_id', as: 'designation' });
      Staff.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      Staff.hasOne(models.StaffBankInfo, { foreignKey: 'staff_id', as: 'staffBankDetails' });

    }
  }

  Staff.init(
    {
      // Define your staffs table columns here
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      employee_id: DataTypes.STRING,
      gender: DataTypes.STRING,
      dob: DataTypes.DATE,
      joining_date: DataTypes.DATE,
      marital_status: DataTypes.STRING,
      aadhar_no: DataTypes.STRING,
      mobile_no: DataTypes.STRING,
      email: DataTypes.STRING,
      blood_group: DataTypes.STRING,
      emergency_contact: DataTypes.STRING,
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'StaffDepartment',
            key: 'id',
        },
    },
    designation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: 'StaffDesignation',
          key: 'id',
      },
  },
      r_address: DataTypes.STRING,
      r_city: DataTypes.STRING,
      r_state: DataTypes.STRING,
      r_pincode: DataTypes.STRING,
      p_address: DataTypes.STRING,
      p_city: DataTypes.STRING,
      p_state: DataTypes.STRING,
      p_pincode: DataTypes.STRING,
      staff_image: DataTypes.STRING,
      face_id:DataTypes.STRING,
      status: DataTypes.STRING,
      pan_number: DataTypes.STRING,
      basic_salary: DataTypes.INTEGER,
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'admin_id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Staff',
      tableName: 'staffs',
      timestamps: false,
    }
  );

  return Staff;
};
