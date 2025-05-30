const db = require('../models');

  exports.getAllDesignation= async (req, res) => { 
    try {
      const designation = await db.StaffDesignation.findAll({ where: { admin_id: req.userId, session_id: req.sessionId}});
      return res.json(designation);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to fetch designation.' });
    }
  }

  exports.getAllDesignationByDepartments= async (req, res) => { 
    console.log('inside')
    try {
      const { departmentId } = req.query;
      const designation = await db.StaffDesignation.findAll({ where: { admin_id: req.userId, session_id: req.sessionId, department_id: departmentId}});
      return res.json(designation);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to fetch designation.' });
    }
  }

  exports.createDesignation = async (req, res) => { 
    try {

        let adminId = req.userId;
        let sessionId = req.sessionId;
        let designations = req.body.designations;

        console.log(designations)
  
        for (const val of designations) {
          let existingDesignation = await db.StaffDesignation.findOne({
            where: {
              des_id: val.order_no,
              department_id: val.department_id,
              admin_id: adminId,
              session_id: sessionId,
            },
          });

          if(existingDesignation){
            existingDesignation.designation_name = val.designation_name
            existingDesignation.department_id = val.department_id
            existingDesignation.entry_time = val.entry_time
            existingDesignation.exit_time = val.exit_time

            await existingDesignation.save();
          }
          else
            await db.StaffDesignation.create({des_id: val.order_no, department_id: val.department_id, designation_name: val.designation_name , entry_time: val.entry_time, exit_time: val.exit_time, admin_id: adminId , session_id: sessionId});
        }
  
        return res.status(201).json({message:"designation created"});
      } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Unable to create designation.' });
      }
  }