const { Medium } = require('../models');

class MediumController {
  // Create a new medium
  async createMedium(req, res) {
    try {

      let adminId = req.userId;
      let sessionId = req.sessionId;
      let mediums = req.body.mediums;
      console.log(mediums)

      for (const val of mediums) {
        let existingMedium = await Medium.findOne({
          where: {
            mid: val.order_no,
            admin_id: adminId,
            session_id: sessionId,
          },
        });
        if(existingMedium){
          existingMedium.type = val.medium_name
          await existingMedium.save();
        }
        else
          await Medium.create({mid: val.order_no, type: val.medium_name , admin_id: adminId , session_id: sessionId});
      }
      return res.status(201).json({message: 'medium updated successfully'});
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: 'Unable to create standard.' });
    }

  }

  // Get all mediums
  async getAllMediums(req, res) {
    try {
      const mediums = await Medium.findAll({ where: { admin_id: req.userId,session_id: req.sessionId}});
      res.json(mediums);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get a medium by ID
  async getMediumById(req, res) {
    try {
      const medium = await Medium.findByPk(req.params.id);
      if (medium) {
        res.json(medium);
      } else {
        res.status(404).json({ error: 'Medium not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update a medium
  async updateMedium(req, res) {
    try {
      const medium = await Medium.findByPk(req.params.id);
      if (medium) {
        await medium.update(req.body);
        res.json(medium);
      } else {
        res.status(404).json({ error: 'Medium not found' });
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Delete a medium
  async deleteMedium(req, res) {
    try {
      const medium = await Medium.findByPk(req.params.id);
      if (medium) {
        await medium.destroy();
        res.json({ message: 'Medium deleted successfully' });
      } else {
        res.status(404).json({ error: 'Medium not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new MediumController();
