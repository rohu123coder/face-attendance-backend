const db = require('../models');

//const Parent = require('../models/parent');

class ParentController {
  async getParentList(req, res) {
    try {
      const parents = await db.Parent.findAll({ where: { admin_id: req.userId}});
      res.json(parents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async createParent(req, res) {
    try {
      req.body.admin_id = req.userId
      const { name, email, phone, childId, username, password, status, otp , admin_id } = req.body;
      const parent = await db.Parent.create({ name, email, phone, childId, username, password, status, otp, admin_id });
      res.status(201).json(parent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

    // Get a parent by ID
    async getParentById (req, res) {
    try {
      const parent = await db.Parent.findOne({
        where: {
          id: req.params.id,
          admin_id: req.userId // Replace this with the actual admin_id value you want to filter with
        }
      });
      if (parent) {
        res.json(parent);
      } else {
        res.status(404).json({ error: 'Student not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

  async updateParent(req, res) {
    try {
      const { parentId } = req.params;
      const { name, email, phone, childId, username, password, status, otp } = req.body;

      const parent = await db.Parent.findOne({
        where: {
          id: req.params.id,
          admin_id: req.userId // Replace this with the actual admin_id value you want to filter with
        }
      });
      if (!parent) {
        return res.status(404).json({ message: 'Parent not found' });
      }

      parent.name = name;
      parent.email = email;
      parent.phone = phone;
      parent.childId = childId;
      parent.username = username;
      parent.password = password;
      parent.status = status;
      parent.otp = otp;

      await parent.save();

      res.json(parent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
};

async getStudentsByParentId(req, res) {
  try {
    console.log("in controller")
    const parent = await db.Parent.findOne({
      where: {
        id: req.parentId,
      },
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const parentAssoc = await db.ParentAssoc.findAll({
      where: {
        parent_id: parent.id,
      },
    });

    const studentIds = parentAssoc.map((assoc) => assoc.student_id);

    const students = await db.Student.findAll({
      where: {
        id: studentIds,
      },
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

};

module.exports = new ParentController();
