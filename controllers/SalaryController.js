const db = require('../models');
const { Op } = require('sequelize');

class SalaryController {

  static async createSalaryComponent(req, res) {
    const transaction = await db.sequelize.transaction();
    try {

      let adminId = req.userId;
      let components = req.body.components;
      console.log(components)

        let existingSalaryComponent = await db.SalaryComponent.findOne({
            where: {
                admin_id: adminId,
                [Op.or]: [
                {
                    min_range: {
                    [Op.between]: [components.min_range, components.max_range],
                    },
                },
                {
                    max_range: {
                    [Op.between]: [components.min_range, components.max_range],
                    },
                },
                ],
            },
        });

        if(!existingSalaryComponent){
            let component = await db.SalaryComponent.create({min_range: components.min_range, max_range: components.max_range , admin_id: adminId},{ transaction });
            let componentId = component.id
            let items = components.items;
    
            for(const item of items){
                await db.SalaryComponentItem.create({admin_id: adminId,component_name: item.component_name, component_value: item.component_value , component_type: item.component_type, component_id: componentId},{ transaction });
            }
            await transaction.commit()
            return res.status(201).json({message:" Salary Components created"});
        } else{
            //await transaction.rollback()
            res.status(400).json({ error: 'Salary Components with given range overrides.' })
        }
      // }

    } catch (error) {
      await transaction.rollback()
      console.log(error)
      return res.status(500).json({ error: 'Unable to create Salary Components.' });
    }
  }

  static async getAllSalaryComponents(req, res) {
    try {
      const salaryComponents = await db.SalaryComponent.findAll(
        { 
            where: { admin_id: req.userId},
            include: [ {model:db.SalaryComponentItem, as: 'items' } ]
        }
        );
      return res.json(salaryComponents);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAllSalaryComponentsBySalary(req, res) {
    try {
      const { salary } = req.query;
      console.log(salary);
      const salaryComponents = await db.SalaryComponent.findOne(
        { 
          where: {
            admin_id: req.userId,
            min_range: { [Op.lte]: salary },
            max_range: { [Op.gte]: salary },
          },
            include: [ {model:db.SalaryComponentItem, as: 'items' } ]
        }
        );
      return res.json(salaryComponents);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteSalaryComponents(req, res) {
    const { ids } = req.body; // Assuming you send an array of IDs in the request body
  
    const transaction = await db.sequelize.transaction();
    try {
  
      // Delete SalaryComponent records
      await db.SalaryComponent.destroy({
        where: {
          id: ids, // Use the array of IDs to match records to delete
        },
        transaction,
      });
  
      // Delete associated records from salary_component_items
      await db.SalaryComponentItem.destroy({
        where: {
          component_id: { [Op.in]: ids }, // Use the array of IDs to match associated records
        },
        transaction,
      });
  
      // Commit the transaction
      await transaction.commit();
  
      return res.status(204).end();
    } catch (error) {
      // Rollback the transaction if there's an error
      await transaction.rollback();
      console.log(error);
      return res.status(500).json({ error: 'Unable to delete Salary Components.' });
    }
  }
  
}

module.exports = SalaryController;
