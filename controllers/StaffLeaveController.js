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

exports.createStaffLeaves = async (req, res) => {
  try {

    const { designationIds, type, description , action } = req.body;
    console.log(designationIds, type, description , action);

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

    if(designationIds.length < 0 && dates.length < 0){
        res.status(401).send({error: 'Invalid params'});
    }

    // Use transactions to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
    // Create staff leaves data
    for (const date of dates ){
        for (const designationId of designationIds) {
              let existingRecord = await db.StaffLeaves.findOne({
                where: {
                  day: date,
                  admin_id: req.userId,
                  session_id: req.sessionId,
                  designation_id: designationId,
                },
              });

              if(existingRecord){
                existingRecord.desc = description
                await existingRecord.save();
              }
              else
                await db.StaffLeaves.create({
                  day: date,
                  admin_id: req.userId,
                  session_id: req.sessionId,
                  designation_id: designationId,
                  desc: description,
                });
        }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Staff leaves created successfully.' });

    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error creating staff leaves:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (error) {
    console.error('Error in createStaffLeaves:', error);
    res.status(400).json({ error: 'Bad request.' });
  }
};


exports.deleteStaffLeaves = async (req, res) => {
  try {

    const {  designationIds, type, description , action } = req.body;
    console.log( designationIds, type, description , action);

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

    if(designationIds.length < 0 && dates.length < 0){
        res.status(401).send({error: 'Invalid params'});
    }

    // Use transactions to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
    
    // delete staff leaves data
    for (const date of dates ){
        for (const designationId of designationIds) {
              await db.StaffLeaves.destroy({
                where: {
                  day: date,
                  admin_id: req.userId,
                  session_id: req.sessionId,
                  //class_id: classId,
                  designation_id: designationId,
                },
              });
        }
    }

      await transaction.commit();

      res.status(200).json({ message: 'Staff leaves created successfully.' });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error creating staff leaves:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (error) {
    console.error('Error in createStaffLeaves:', error);
    res.status(400).json({ error: 'Bad request.' });
  }
};


exports.getStaffLeaves = async (req, res) => {
  try {

    const {  designationIds,  } = req.query;
    console.log( designationIds);
    // Use transactions to ensure data consistency
    const transaction = await db.sequelize.transaction();

    let options = {
      admin_id: req.userId,
      session_id: req.sessionId,
    }

    if(designationIds && designationIds.length > 0)
      options.designation_id = designationIds

    try {
        let leaves =  await db.StaffLeaves.findAll({where: options,});
        await transaction.commit();
        res.status(200).json(leaves);
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error fetching staff leaves:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } catch (error) {
    console.error('Error in fetching Staff Leaves:', error);
    res.status(400).json({ error: 'Bad request.' });
  }
};

