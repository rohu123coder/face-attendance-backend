const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Parent extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        //Parent.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
        // Parent.hasMany(models.ParentAssoc, {
        //   foreignKey: 'parent_id',
        //   as: 'parentAssoc',
        // });
      }
    };

Parent.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
  },
  otp: {
    type: DataTypes.STRING,
  },
  auth_token: {
    type: DataTypes.STRING,
  },
  device_token: {
    type: DataTypes.STRING,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'admin_id',
    },
  },
}, {
    sequelize,
    modelName: 'Parent',
    tableName: 'parents',
    timestamps: false
});
return Parent;
}