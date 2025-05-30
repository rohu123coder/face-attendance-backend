const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

class Student extends Model {
    static associate(models) {
      Student.belongsTo(models.Standard, { foreignKey: 'class_id', as: 'class' });
      Student.belongsTo(models.Medium, { foreignKey: 'medium_id', as: 'medium' });
      Student.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      }
}

Student.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roll_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    parent_email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    parent_phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'standard',
        key: 'id',
      },
    },
    medium_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'medium',
        key: 'id',
      },
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'admin_id',
      },
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admission_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sr_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pass_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    student_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    face_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Student',
    tableName:'students',
    timestamps: false
  }
);
return Student;
}