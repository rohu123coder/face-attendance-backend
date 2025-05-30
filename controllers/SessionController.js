const db = require('../models');
const { Op } = require('sequelize');

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const newSession = await db.Session.create({
      admin_id: req.body.admin_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      paid_status: req.body.paid_status,
    });

    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all sessions
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await db.Session.findAll({
      include: [{ model: db.User, as: 'admin' }],
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await db.Session.findByPk(req.params.id, {
      include: [{ model: db.User, as: 'admin' }],
    });
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a session
exports.updateSession = async (req, res) => {
  try {
    const session = await db.Session.findByPk(req.params.id);
    if (session) {
      await session.update(req.body);
      res.json(session);
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const session = await db.Session.findByPk(req.params.id);
    if (session) {
      await session.destroy();
      res.json({ message: 'Session deleted successfully' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get session ID by admin_id and current date
exports.getSessionIdByAdminIdAndDate = async (req, res) => {
    try {
      const { userId } = req.query;
      const currentDate = new Date().toISOString().slice(0, 10);
  
      const session = await db.Session.findOne({
        where: {
          admin_id: userId,
          start_date: { [Op.lte]: currentDate },
          end_date: { [Op.gte]: currentDate },
        },
        attributes: ['id','paid_status'],
      });
  
      if (session) {
        res.json({ session_id: session.id });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
