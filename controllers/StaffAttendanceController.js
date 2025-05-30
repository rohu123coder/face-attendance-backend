const db = require('../models');
const { Op, Sequelize, literal } = require('sequelize');
const moment = require('moment-timezone');
const staffs = require('../models/staffs');

function getMonthsBetweenDates(start_date, end_date) {
  const start = new Date(start_date);
  const end = new Date(end_date);
  const result = [];

  let currentDate = new Date(start);

  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calculate the start date of the current month
    const startOfMonth = new Date(year, month, 1);

    // Calculate the end date of the current month
    const nextMonth = new Date(year, month + 1, 1);
    const endOfMonth = new Date(nextMonth - 1);

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startOfMonth);


    result.push({
      start: moment(startOfMonth).tz('Asia/Kolkata').format('YYYY-MM-DD'),
      end: moment(endOfMonth).tz('Asia/Kolkata').format('YYYY-MM-DD'),
      month: monthName
    });

    // Move to the next month
    currentDate.setMonth(month + 1);
  }

  return result;
}


const calculateStaffsPercentage = async (adminId, sessionId, startDate, endDate, action) => {
  console.log('Calculating staffs percentage function');
  let studentData = [];
  const date1 = moment(startDate);
  const date2 = moment(endDate);

  let start_date = date1.format('YYYY-MM-DD');
  let end_date = date2.format('YYYY-MM-DD');

  const dateDifference = date2.diff(date1, 'days') + 1;
  console.log(dateDifference);

  const Query = {
    where: {
      admin_id: adminId,
      status: 'active',
    },
    include: [
      { model: db.StaffDesignation, as: 'designation' },
    ],
    attributes: [
      'id',
      'first_name',
      'last_name',
      'basic_salary',
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.staff_attendance AS attendance WHERE attendance.staff_id = Staff.id AND attendance.day >= '${start_date}' AND attendance.day <= '${end_date}')`),
        'total_attendance'
      ],
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.staff_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} AND leaves.designation_id = Staff.designation_id AND leaves.day >= '${start_date}' AND leaves.day <= '${end_date}')`),
        'total_leaves'
      ],
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.staff_attendance AS attendance WHERE attendance.staff_id = Staff.id AND attendance.day >= '${start_date}' AND attendance.day <= '${end_date}') * 100 / (${dateDifference} - (SELECT COUNT(*) FROM cumsdbms.staff_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} AND leaves.designation_id = Staff.designation_id AND leaves.day >= '${start_date}' AND leaves.day <= '${end_date}'))`),
        'staff_percentage'
      ],
      [
        literal(`${dateDifference}`),
        'date_span'
      ],
    ],
  }

  if (action.type === 'all') {
    console.log("all")
    const staff_ids = {
      [Op.in]: [3, 4],
    }

    console.log(staff_ids)
    Query.where.id = staff_ids
    //Query.raw = true;
    const staffData = await db.Staff.findAll(Query);
    console.log("stafData", staffData)
    return staffData;
  }


  if (action.type === 'list') {
    Query.order = [
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.staff_attendance AS attendance WHERE attendance.staff_id = Staff.id AND attendance.day >= '${start_date}' AND attendance.day <= '${end_date}') * 100 / (${dateDifference} - (SELECT COUNT(*) FROM cumsdbms.staff_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} AND leaves.designation_id = Staff.designation_id AND leaves.day >= '${start_date}' AND leaves.day <= '${end_date}'))`),
        action?.order
      ],
    ]
    Query.limit = action.limit
    staffData = await db.Staff.findAll(Query);
    return staffData;
  }

  if (action.type === 'single') {
    Query.where.id = action.id
    Query.raw = true;
    staffData = await db.Staff.findOne(Query);
    return staffData;
  }



  if (action.type === 'average') {
    Query.raw = true;
    staffData = await db.Staff.findAll(Query);
    // Calculate overall sum of staff_attendance
    const overallAttendanceSum = staffData.reduce((sum, staff) => sum + staff.total_attendance, 0);
    console.log('overallAttendanceSum', overallAttendanceSum)
    // Calculate overall average of staff_percentage
    const overallPercentageSum = staffData.reduce((sum, staff) => parseFloat(parseFloat(sum) + parseFloat(staff.staff_percentage)), 0.0);
    console.log('overallPercentageSum', overallPercentageSum)
    const overallAveragePercentage = overallPercentageSum / staffData.length;
    console.log('overallAveragePercentage', overallAveragePercentage)
    const dateSpan = dateDifference
    return {
      dateSpan,
      overallAttendanceSum,
      overallAveragePercentage,
    };
  }

  return staffData;
}

const calculateStaffsReport = async (adminId, sessionId, day) => {

  console.log('Calculating staffs report function');

  let currentDate = day.format('YYYY-MM-DD');

  const Query = {
    where: {
      admin_id: adminId,
      status: 'active',
    },
    include: [
      { model: db.StaffDesignation, as: 'designation' },
    ],
    attributes: [
      'id',
      'first_name',
      'last_name',
      'basic_salary',
      [
        literal(`(SELECT * FROM cumsdbms.staff_attendance AS attendance WHERE attendance.staff_id = Staff.id AND attendance.day = '${currentDate}')`),
        'attendance_details'
      ],
      [
        literal(`(SELECT * FROM cumsdbms.staff_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} 
                    AND leaves.designation_id = Staff.designation_id AND leaves.day = '${currentDate}')`),
        'leaves_details'
      ],
    ],
  }

  const staffData = await db.Staff.findAll(Query);
  console.log("stafData", staffData)
  return staffData;
}


class StaffAttendanceController {

  static async createSingleAttendance(req, res) {
    try {
      const { day, staffId, entranceTime, exitTime } = req.body;

      if (!entranceTime || entranceTime === null) {
        res.status(400).json({ error: "Entrance time is required" });
        return;
      }

      // Check if day is not more than today
      const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
      if (moment(day).tz('Asia/Kolkata').isAfter(today)) {
        res.status(400).json({ error: "Day cannot be in the future" });
        return;
      }

      // Check if entranceTime is not more than exitTime
      if (exitTime && moment(entranceTime, 'HH:mm').isAfter(moment(exitTime, 'HH:mm'))) {
        res.status(400).json({ error: "Entrance time cannot be after Exit time" });
        return;
      }

      const attendanceDate = moment(day).tz('Asia/Kolkata').format('YYYY-MM-DD');
      const attendance = await db.StaffAttendance.findOne({
        where: {
          staff_id: staffId,
          admin_id: req.userId,
          session_id: req.sessionId,
          day: attendanceDate
        }
      });

      let attendanceData = {
        staff_id: staffId,
        admin_id: req.userId,
        session_id: req.sessionId,
        day: attendanceDate,
        status: 'present',
        entrance_time: entranceTime
      };

      if (exitTime)
        attendanceData.exit_time = exitTime;

      if (!attendance) {
        await db.StaffAttendance.create(attendanceData);
      }

      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteSingleAttendance(req, res) {
    try {

      const { day, staffId } = req.body;
      const attendanceDate = moment(day).tz('Asia/Kolkata').format('YYYY-MM-DD');
      const attendance = await db.StaffAttendance.destroy({
        where: {
          staff_id: staffId,
          admin_id: req.userId,
          session_id: req.sessionId,
          day: attendanceDate
        }
      });

      console.log(attendance);
      res.status(201).json(attendance);

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }


  // Get bulk attendance for an array of staff IDs
  static async getStaffAttendancePercentageById(req, res) {
    console.log('getStaffAttendancePercentageById')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let startDate = req.sessionStart;
      let endDate = req.sessionEnd;
      const { id } = req.params;
      let { limit, order } = req.query
      console.log(order)

      const start_date = moment(startDate).tz('Asia/Kolkata');
      const end_date = moment.tz('Asia/Kolkata'); // current date as end Date

      let action = {
        type: 'single',
        id: id
      }

      let result = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of staff IDs
  static async getStaffsPercentageSessionById(req, res) {
    console.log('getStaffsPercentageSessionById')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let startDate = req.sessionStart;
      let endDate = req.sessionEnd;
      const { id } = req.params;

      const months = getMonthsBetweenDates(startDate, endDate);
      console.log(months);
      const result = await Promise.all(
        months.map(async (month, i) => {
          let startDate = moment(month.start);
          let endDate = moment(month.end);
          console.log(startDate, endDate, month.month)
          let action = { type: 'single', id: id }
          let temp = await calculateStaffsPercentage(adminId, sessionId, startDate, endDate, action)
          temp.monthName = month.month
          return temp
        })
      );
      console.log("staffData", result)
      res.json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of staff IDs
  static async getStaffsPercentage(req, res) {
    console.log('getStaffsPercentage')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let startDate = req.sessionStart;
      let endDate = req.sessionEnd;

      let { limit, order } = req.query
      console.log(order)

      const start_date = moment(startDate).tz('Asia/Kolkata');
      const end_date = moment.tz('Asia/Kolkata'); // current date as end Date

      let action = {
        type: 'list',
        order: order === 'bottom' ? 'ASC' : 'DESC',
        limit: parseInt(limit)
      }

      let result = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of staff IDs
  static async getStaffsPercentageSession(req, res) {
    console.log('getStaffsPercentageSession')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let startDate = req.sessionStart;
      let endDate = req.sessionEnd;

      const months = getMonthsBetweenDates(startDate, endDate);
      console.log(months);
      const result = await Promise.all(
        months.map(async (month, i) => {
          let startDate = moment(month.start);
          let endDate = moment(month.end);
          console.log(startDate, endDate, month.month)
          let action = { type: 'average' }
          let temp = await calculateStaffsPercentage(adminId, sessionId, startDate, endDate, action)
          temp.monthName = month.month
          return temp
        })
      );
      console.log("staffData", result)
      res.json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of staff IDs
  static async getOverallPercentage(req, res) {
    console.log('getOverallPercentage')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let startDate = req.sessionStart;
      let endDate = req.sessionEnd;

      // start calculating since session starts
      const start_date = moment(startDate);
      // get values till current date
      const end_date = moment().tz('Asia/Kolkata');

      console.log(end_date);
      let action = { type: 'average' }
      let result = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTodayAttendance(req, res) {

    console.log('getTodayAttendance')
    try {
      // Get the current date in IST (Indian Standard Time)
      const currentDateIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const currentDate = new Date(currentDateIST);

      // Fetch the count of entries in student_attendance
      const count = await db.StaffAttendance.count({
        where: {
          admin_id: req.userId, // Replace with your authentication logic
          session_id: req.sessionId, // Replace with your session logic
          day: {
            [Op.eq]: currentDate, // Filter by today's date
          },
        },
      });

      console.log("attendanceCount", count)
      res.json({ count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Get bulk attendance for an array of student IDs
  static async getStaffsMonthPercentage(req, res) {
    console.log('getStaffsMonthPercentage')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let id = req.query.id;
      let month = req.query.month;

      console.log("monthly", req.query)


      // Get the current date in IST
      const currentDateIST = moment(month).tz('Asia/Kolkata');

      // Calculate the first date of the current month
      const start_date = currentDateIST.clone().startOf('month');

      // Calculate the last date of the current month
      const end_date = currentDateIST.clone().endOf('month');

      console.log(start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD'));

      console.log(end_date);
      let action = { id: id, type: 'single' }
      let result = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of student IDs
  static async getAllStaffsMonthPercentage(req, res) {
    console.log('getAllStaffsMonthPercentage')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let ids = req.query.ids;
      let month = req.query.month;

      console.log("monthly", req.query)


      // Get the current date in IST
      const currentDateIST = moment(month).tz('Asia/Kolkata');

      // Calculate the first date of the current month
      const start_date = currentDateIST.clone().startOf('month');

      // Calculate the last date of the current month
      const end_date = currentDateIST.clone().endOf('month');

      console.log(start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD'));

      console.log("end_date", end_date);
      let action = { ids: ids, type: 'all' }
      let result = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }



  // Create a new attendance entry
  static async createAttendance(req, res) {
    try {
      const attendance = await db.StaffAttendance.create(req.body);
      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Get all attendance entries for a specific staff member
  static async getAllAttendanceByStaff(req, res) {
    try {
      const staffId = req.params.staffId;
      const attendances = await db.StaffAttendance.findAll({ where: { staff_id: staffId } });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get an attendance entry by ID
  static async getAttendanceById(req, res) {
    try {
      const attendanceId = req.params.id;
      const attendance = await db.StaffAttendance.findByPk(attendanceId);
      if (attendance) {
        res.json(attendance);
      } else {
        res.status(404).json({ error: 'StaffAttendance entry not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update an attendance entry by ID
  static async updateAttendance(req, res) {
    try {
      const attendanceId = req.params.id;
      const attendance = await db.StaffAttendance.findByPk(attendanceId);
      if (attendance) {
        await attendance.update(req.body);
        res.json(attendance);
      } else {
        res.status(404).json({ error: 'StaffAttendance entry not found' });
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Delete an attendance entry by ID
  static async deleteAttendance(req, res) {
    try {
      const attendanceId = req.params.id;
      const attendance = await db.StaffAttendance.findByPk(attendanceId);
      if (attendance) {
        await attendance.destroy();
        res.json({ message: 'Attendance entry deleted successfully' });
      } else {
        res.status(404).json({ error: 'Attendance entry not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Edit an attendance entry by day
  static async editByDay(req, res) {
    try {
      const { staffId, day } = req.params;
      const attendance = await db.StaffAttendance.findOne({ where: { staff_id: staffId, day: day } });
      if (attendance) {
        await attendance.update(req.body);
        res.json(attendance);
      } else {
        res.status(404).json({ error: 'Attendance entry not found' });
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Get all attendance entries for a specific month
  static async getAllByMonth(req, res) {
    try {
      const { staffId, month } = req.params;
      const startDate = new Date(month);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const attendances = await db.StaffAttendance.findAll({
        where: {
          staff_id: staffId,
          day: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },
      });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get all attendance entries for a specific session
  static async getAllBySession(req, res) {
    try {
      const { staffId, startMonth, startYear, endMonth, endYear } = req.params;
      const startDate = new Date(`${startYear}-${startMonth}`);
      const endDate = new Date(`${endYear}-${endMonth}`);
      const attendances = await db.StaffAttendance.findAll({
        where: {
          staff_id: staffId,
          day: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },
      });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of staff IDs
  static async getBulkAttendance(req, res) {
    try {
      const staffIds = req.body.staffIds;
      const attendances = await db.StaffAttendance.findAll({
        where: {
          staff_id: {
            [Op.in]: staffIds,
          },
        },
      });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAllStaffAttendanceReport(req, res) {
    try {
      const { month } = req.query;
      const { designationId } = req.query

      let adminId = req.userId;
      let sessionId = req.sessionId;

       // Get the current date in IST
       const currentDateIST = moment(month).tz('Asia/Kolkata');
       // Calculate the first date of the current month
       const startDate = currentDateIST.clone().startOf('month');
       // Calculate the last date of the current month
       const endDate = currentDateIST.clone().endOf('month');

      
      let start_date = startDate.format('YYYY-MM-DD');
      let end_date = endDate.format('YYYY-MM-DD');

      let queryWhereParam = {
        admin_id: adminId,
        status: 'active',
      }

      if( designationId ) queryWhereParam.designation_id = designationId
      
      // Fetch all staffs with the given conditions
      const allStaffs = await db.Staff.findAll({
        where: queryWhereParam,
        include: [
          { model: db.StaffDesignation, as: 'designation' },
        ],
      });

      // Create a two-dimensional array to store the result
      const result = [];

      // Iterate through each staff
      for (const staff of allStaffs) {
        // Fetch staff attendance data for the current staff

        // Clone the start date to avoid mutation
        let currentDate = startDate.clone();

        const staffAttendanceData = []

        while (currentDate.isSameOrBefore(endDate)) {
          console.log(currentDate?.format('YYYY-MM-DD')); // Do whatever you need with the date

          let temp = await db.StaffAttendance.findOne({
            where: {
              staff_id: staff.id,
              day: currentDate,
            },
            attributes: [
              'entrance_time',
              'exit_time',
              'day',
              'status'
            ],
            
          });

          let whereParam = {
            admin_id: adminId,
            session_id: sessionId,
            day: currentDate.format('YYYY-MM-DD'),
          }

          if(designationId){
            whereParam.designation_id = staff.designation.id;
          }

          if(!temp) {
            temp = {
              status:'absent',
              day :currentDate.format('YYYY-MM-DD'),
              leaves: await db.StaffLeaves.count({where:whereParam})
            }
          }
  
          staffAttendanceData.push(temp)
          // Move to the next day
          currentDate.add(1, 'day');

        }

        // Process the data to populate the result array
        const staffDetails = {
          staffId: staff.id,
          staffName: `${staff.first_name} ${staff.last_name}`,
          employeeId: staff.employee_id,
          designation_name: staff.designation?.designation_name,
          entry_time: staff.designation?.entry_time,
          exit_time: staff.designation?.exit_time,
          attendanceDetails: staffAttendanceData,
        };

        result.push(staffDetails);
      }

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getListStaffsMonthPercentage(req, res) {
    console.log('getListStaffsMonthPercentage')
    try {
      let adminId = req.userId;
      let sessionId = req.sessionId;
      let ids = req.query.ids;
      let month = req.query.month;

      //console.log(ids.length)

      console.log("monthly", req.query)

      // Get the current date in IST
      const currentDateIST = moment(month).tz('Asia/Kolkata');

      // Calculate the first date of the current month
      const start_date = currentDateIST.clone().startOf('month');

      // Calculate the last date of the current month
      const end_date = currentDateIST.clone().endOf('month');

      console.log(start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD'));

      console.log(end_date);

      
      if(ids && ids.length > 0) {
        const result = await Promise.all(
          ids.map(async (id, i) => {
            console.log(id, i)
            let action = { id: id, type: 'single' }
            let temp = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action);
            if(temp){
              const salaryComponents = await db.SalaryComponent.findOne(
                { 
                  where: {
                    admin_id: req.userId,
                    min_range: { [Op.lte]: temp.basic_salary },
                    max_range: { [Op.gte]: temp.basic_salary },
                  },
                    include: [ {model:db.SalaryComponentItem, as: 'items' } ]
                }
                );
              
                temp.components = salaryComponents;
                return temp
            }
          })
        );
        res.json(result);
      }else{
        let Staffs = await db.Staff.findAll({where: {admin_id:adminId, status: 'active'}, raw:true});
        const result = await Promise.all(
          Staffs.map(async (staff, i) => {
            console.log(staff.id, i)
            let action = { id: staff.id, type: 'single' }
            let temp = await calculateStaffsPercentage(adminId, sessionId, start_date, end_date, action);
            if(temp){
              const salaryComponents = await db.SalaryComponent.findOne(
                { 
                  where: {
                    admin_id: req.userId,
                    min_range: { [Op.lte]: temp.basic_salary },
                    max_range: { [Op.gte]: temp.basic_salary },
                  },
                    include: [ {model:db.SalaryComponentItem, as: 'items' } ]
                }
                );
              
                temp.components = salaryComponents;
                return temp
            }
          })
        );
        res.json(result);

      }
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

}

module.exports = StaffAttendanceController;
