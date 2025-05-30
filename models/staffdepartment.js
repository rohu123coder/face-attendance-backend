const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StaffDepartment extends Model {
        static associate(models) {
            StaffDepartment.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
            StaffDepartment.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
        }
    }

    StaffDepartment.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            department_name: {
                type:DataTypes.STRING,
                allowNull: false,
            },
            dep_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            admin_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
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
        },
        {
            sequelize,
            modelName: 'StaffDepartment',
            tableName: 'staff_department',
            timestamps: false,
        }
    );

    return StaffDepartment;
};
