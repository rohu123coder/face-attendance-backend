const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');



// Get session ID by admin_id and current date
module.exports = payment = async (req, res, next) => {
  try {
    const userId = req.userId
    // Assuming 'currentDate' is a UTC date or any other time zone date
    // Convert it to IST (Indian Standard Time)
   // Get the current date
    const today = moment().tz('Asia/Kolkata');
    const currentDate = today.format('YYYY-MM-DD');
    console.log(currentDate); // This will print the previous 1st of July
    // Calculate the previous 1st of July
    const previousJuly = today.month(6).date(1);

    // If the calculated date is after the current date, subtract a year
    if (previousJuly.isAfter(today)) {
      previousJuly.subtract(1, 'year');
    }

    // Format the result as 'YYYY-MM-DD'
    const sessionStartDate = previousJuly.format('YYYY-MM-DD');
    console.log(sessionStartDate); // This will print the previous 1st of July

    const sessionEndDate = previousJuly.clone().add(1, 'year').subtract(1, "days").format('YYYY-MM-DD');
    console.log(sessionEndDate); // This will print the previous 1st of July

    const subscription = await  db.Subscription.findOne({
      where: {
        admin_id: userId,
        start_date: { [Op.lte]: currentDate },
        end_date: { [Op.gte]: currentDate },
      },
      attributes: ['id','payment_status'],
    });

    if (!subscription || subscription.payment_status !== 'paid') {
        res.status(404).json({ error: 'Payment Required' });
    }else{
        const session = await  db.Session.findOne({
          where: {
            admin_id: userId,
            start_date: { [Op.lte]: currentDate },
            end_date: { [Op.gte]: currentDate },
          },
          attributes: ['id','start_date','end_date'],
        });
        if (!session) {
          // Session doesn't exist, create a new one.
        
          const newSession = await db.Session.create({
            admin_id: userId,
            start_date: sessionStartDate,
            end_date: sessionEndDate,
          });
        
          req.sessionId = newSession.id;
          req.sessionStart = newSession.start_date;
          req.sessionEnd = newSession.end_date;

        } else {
          req.sessionId = session.id;
          req.sessionStart = session.start_date;
          req.sessionEnd = session.end_date;
        }
        next()
    }

  } catch (err) {
    console.log("payment failed");
    res.status(500).json({ code:"payment", error: err.message });
  }
};
