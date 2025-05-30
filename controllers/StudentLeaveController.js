const db = require('../models');

function getDatesByWeekdays(startDate, endDate, weekdays) {

    console.log('weekdays',weekdays);
    const result = [];
    const IST_OFFSET_MINUTES = 330; // IST is UTC+5:30

    // Create new Date objects with the provided start and end dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Adjust the start and end dates for the IST timezone offset
    start.setMinutes(start.getMinutes() + IST_OFFSET_MINUTES);
    end.setMinutes(end.getMinutes() + IST_OFFSET_MINUTES);

    const daysToIncrement = weekdays.map(day => parseInt(day));
  
    while (start <= end) {
      if (daysToIncrement.includes(start.getDay())) {
        result.push(new Date(start));
      }
      start.setDate(start.getDate() + 1);
    }
    console.log(result.length);
    return result;
  }

  function getDatesBetween(start_date, end_date) {

    const IST_OFFSET_MINUTES = 330; // IST is UTC+5:30

    // Create new Date objects with the provided start and end dates
    const start = new Date(start_date);
    const end = new Date(end_date);

    // Adjust the start and end dates for the IST timezone offset
    start.setMinutes(start.getMinutes() + IST_OFFSET_MINUTES);
    end.setMinutes(end.getMinutes() + IST_OFFSET_MINUTES);

    const dates = [];
    while (start <= end) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    //console.log(dates);
    return dates;
  }

exports.createStudentLeaves = async (req, res) => {
  try {

    const { classIds, mediumIds, type, description , action } = req.body;
    console.log(classIds, mediumIds, type, description , action);

    let dates =[] ;

    if(type === 'days'){
      let session = await db.Session.findByPk(req.sessionId);
      let startDate = session.start_date;
      let endDate = session.end_date;
      let days = req.body.days
      dates = getDatesByWeekdays(startDate,endDate,days);
    }
    
    if( type === 'range'){
      dates = getDatesBetween(req.body.startDate, req.body.endDate);
    }
    
    if ( type === 'single'){
      const IST_OFFSET_MINUTES = 330; // IST is UTC+5:30
      const mDate = new Date(req.body.singleDate)
      mDate.setMinutes(mDate.getMinutes() + IST_OFFSET_MINUTES)
      dates.push(mDate)
    }

    console.log("dates",dates)

    if(classIds.length < 0 && mediumIds.length < 0 && dates.length < 0){
        res.status(401).send({error: 'Invalid params'});
    }

    // Use transactions to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
    // Create student leaves data
    for (const date of dates ){
        for (const mediumId of mediumIds) {
            for (const classId of classIds) {
              let existingRecord = await db.StudentLeaves.findOne({
                where: {
                  day: date,
                  admin_id: req.userId,
                  session_id: req.sessionId,
                  class_id: classId,
                  medium_id: mediumId,
                },
              });

              if(existingRecord){
                existingRecord.desc = description
                await existingRecord.save();
              }
              else
                await db.StudentLeaves.create({
                  day: date,
                  admin_id: req.userId,
                  session_id: req.sessionId,
                  class_id: classId,
                  medium_id: mediumId,
                  desc: description,
                });
            }
        }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Student leaves created successfully.' });

    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error creating student leaves:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (error) {
    console.error('Error in createStudentLeaves:', error);
    res.status(400).json({ error: 'Bad request.' });
  }
};


exports.deleteStudentLeaves = async (req, res) => {
  try {

    const { classIds, mediumIds, type, description , action } = req.body;
    console.log(classIds, mediumIds, type, description , action);

    let dates =[] ;

    if(type === 'days'){
      let session = await db.Session.findByPk(req.sessionId);
      let startDate = session.start_date;
      let endDate = session.end_date;
      let days = req.body.days
      dates = getDatesByWeekdays(startDate,endDate,days);
    }
    
    if( type === 'range'){
      dates = getDatesBetween(req.body.startDate, req.body.endDate);
    }
    
    if ( type === 'single'){
      const IST_OFFSET_MINUTES = 330; // IST is UTC+5:30
      const mDate = new Date(req.body.singleDate)
      mDate.setMinutes(mDate.getMinutes() + IST_OFFSET_MINUTES)
      dates.push(mDate)
    }

    console.log("dates",dates)

    if(classIds.length < 0 && mediumIds.length < 0 && dates.length < 0){
        res.status(401).send({error: 'Invalid params'});
    }

    // Use transactions to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
    
    // delete student leaves data
    for (const date of dates ){
        for (const mediumId of mediumIds) {
            for (const classId of classIds) {
              await db.StudentLeaves.destroy({
                where: {
                  day: date,
                  admin_id: req.userId,
                  session_id: req.sessionId,
                  class_id: classId,
                  medium_id: mediumId,
                },
              });
            }
        }
    }

      await transaction.commit();

      res.status(200).json({ message: 'Student leaves created successfully.' });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error creating student leaves:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (error) {
    console.error('Error in createStudentLeaves:', error);
    res.status(400).json({ error: 'Bad request.' });
  }
};


exports.getStudentLeaves = async (req, res) => {
  try {

    const { classIds, mediumIds,  } = req.query;
    console.log(classIds, mediumIds);
    // Use transactions to ensure data consistency
    const transaction = await db.sequelize.transaction();

    let options = {
      admin_id: req.userId,
      session_id: req.sessionId,
    }

    if(classIds && classIds.length > 0)
      options.class_id = classIds

    if(mediumIds && mediumIds.length > 0)
      options.medium_id = mediumIds

    try {
        let leaves =  await db.StudentLeaves.findAll({where: options,});
        await transaction.commit();
        res.status(200).json(leaves);
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error fetching student leaves:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (error) {
    console.error('Error in fetching Student Leaves:', error);
    res.status(400).json({ error: 'Bad request.' });
  }
};

