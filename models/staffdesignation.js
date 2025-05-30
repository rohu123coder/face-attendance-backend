const { DataTypes, Model } = require('sequelize');
const sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StaffDesignation extends Model {
        static associate(models) {
            StaffDesignation.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
            StaffDesignation.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
            StaffDesignation.belongsTo(models.StaffDepartment, { foreignKey: 'department_id', as: 'department' });
        }
    }

    StaffDesignation.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            designation_name: {
                type:DataTypes.STRING,
                allowNull: false,
            },
            des_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            entry_time: {
                type: DataTypes.TIME,
                allowNull: true,
              },
              exit_time: {
                type: DataTypes.TIME,
                allowNull: true,
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
            department_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'StaffDepartment',
                    key: 'id',
                },
            },
        },
        {
            sequelize,
            modelName: 'StaffDesignation',
            tableName: 'staff_designation',
            timestamps: false,
        }
    );

    return StaffDesignation;
};
