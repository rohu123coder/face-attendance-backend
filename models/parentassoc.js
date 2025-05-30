const { Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ParentAssoc extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        // ParentAssoc.belongsTo(models.Student, {
        //     foreignKey: 'student_id',
        //     as: 'student',
        //   });
        //   ParentAssoc.belongsTo(models.Parent, {
        //     foreignKey: 'parent_id',
        //     as: 'parent',
        //   })

      }
    };

ParentAssoc.init({
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
      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Parent',
          key: 'id',
        },
      },
}, {
    sequelize,
    modelName: 'ParentAssoc',
    tableName: 'parent_assoc',
    timestamps: false
});
return ParentAssoc;
}