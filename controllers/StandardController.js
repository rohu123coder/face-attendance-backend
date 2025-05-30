const db = require('../models');

class StandardController {
  static async createStandard(req, res) {
    try {

      let adminId = req.userId;
      let sessionId = req.sessionId;
      let classes = req.body.classes;
      console.log(classes)

      for (const val of classes) {
        let existingStandard = await db.Standard.findOne({
          where: {
            order: val.order_no,
            admin_id: adminId,
            session_id: sessionId,
          },
        });
        if(existingStandard){
          existingStandard.class_name = val.class_name
          await existingStandard.save();
        }
        else
          await db.Standard.create({order: val.order_no, class_name: val.class_name , admin_id: adminId , session_id: sessionId});
      }

      return res.status(201).json({message:"standard created"});
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: 'Unable to create standard.' });
    }
  }

  static async getAllStandards(req, res) {
    try {
      const standards = await db.Standard.findAll({ where: { admin_id: req.userId, session_id: req.sessionId}});
      return res.json(standards);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to fetch standards.' });
    }
  }

  static async getStandardById(req, res) {
    try {
      const { id } = req.params;
      const standard = await db.Standard.findByPk(id);

      if (!standard) {
        return res.status(404).json({ error: 'Standard not found.' });
      }

      return res.json(standard);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Unable to fetch standard.' });
    }
  }

  static async updateStandard(req, res) {
    try {
      const { id } = req.params;
      const { class_name } = req.body;

      const standard = await db.Standard.findByPk(id);

      if (!standard) {
        return res.status(404).json({ error: 'Standard not found.' });
      }

      await standard.update({ class_name });

      return res.json(standard);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to update standard.' });
    }
  }

  static async deleteStandard(req, res) {
    try {
      const { id } = req.params;
      const standard = await db.Standard.findByPk(id);

      if (!standard) {
        return res.status(404).json({ error: 'Standard not found.' });
      }

      await standard.destroy();

      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: 'Unable to delete standard.' });
    }
  }
}

module.exports = StandardController;
