const db = require('../models');

exports.getAllDepartments= async (req, res) => { 
    try {
      const departments = await db.StaffDepartment.findAll({ 
        // where: { 
        //   admin_id: req.userId, 
        //   //session_id: req.sessionId
        // }
      });
      return res.json(departments);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to fetch departments.' });
    }
  }

  exports.createDepartments = async (req, res) => { 
    try {

        let adminId = req.userId;
        let sessionId = req.sessionId;
        let departments = req.body.departments;

        console.log(departments)
  
        for (const val of departments) {
          let existingDepartment = await db.StaffDepartment.findOne({
            where: {
              dep_id: val.order_no,
              admin_id: adminId,
              session_id: sessionId,
            },
          });

          if(existingDepartment){
            existingDepartment.department_name = val.department_name
            await existingDepartment.save();
          }
          else
            await db.StaffDepartment.create({dep_id: val.order_no, department_name: val.department_name , admin_id: adminId , session_id: sessionId});
        }
  
        return res.status(201).json({message:"standard created"});
      } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Unable to create standard.' });
      }
  }