'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UploadedExcels extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UploadedExcels.init({
    user_id: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    excel_path: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UploadedExcels',
  });
  return UploadedExcels;
};