const db = require('../models');
const { Op, Sequelize, literal } = require('sequelize');
const moment = require('moment-timezone');
const student = require('../models/student');

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


const calculateStudentsPercentage = async (adminId, sessionId, startDate, endDate, action) => {
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
      pass_status: null,
    },
    include: [
      { model: db.Standard, as: 'class' }, { model: db.Medium, as: 'medium' },
    ],
    attributes: [
      'id',
      'first_name',
      'last_name',
      'parent_name',
      'parent_phone',
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.student_attendance AS attendance WHERE attendance.student_id = Student.id AND attendance.day >= '${start_date}' AND attendance.day <= '${end_date}')`),
        'total_attendance'
      ],
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.student_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} AND leaves.class_id = Student.class_id AND leaves.medium_id = Student.medium_id AND leaves.day >= '${start_date}' AND leaves.day <= '${end_date}')`),
        'total_leaves'
      ],
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.student_attendance AS attendance WHERE attendance.student_id = Student.id AND attendance.day >= '${start_date}' AND attendance.day <= '${end_date}') * 100 / (${dateDifference} - (SELECT COUNT(*) FROM cumsdbms.student_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} AND leaves.class_id = Student.class_id AND leaves.medium_id = Student.medium_id AND leaves.day >= '${start_date}' AND leaves.day <= '${end_date}'))`),
        'student_percentage'
      ],
      [
        literal(`${dateDifference}`),
        'date_span'
      ],
    ],
  }


  if (action.type === 'list') {
    Query.order = [
      [
        literal(`(SELECT COUNT(*) FROM cumsdbms.student_attendance AS attendance WHERE attendance.student_id = Student.id AND attendance.day >= '${start_date}' AND attendance.day <= '${end_date}') * 100 / (${dateDifference} - (SELECT COUNT(*) FROM cumsdbms.student_leaves AS leaves WHERE leaves.admin_id = ${adminId} AND leaves.session_id = ${sessionId} AND leaves.class_id = Student.class_id AND leaves.medium_id = Student.medium_id AND leaves.day >= '${start_date}' AND leaves.day <= '${end_date}'))`),
        action?.order
      ],
    ]
    Query.limit = action.limit
    studentData = await db.Student.findAll(Query);
    return studentData;
  }

  if (action.type === 'single') {
    Query.where.id = action.id
    Query.raw = true;
    studentData = await db.Student.findOne(Query);
    return studentData;
  }

  if (action.type === 'average') {
    Query.raw = true;
    studentData = await db.Student.findAll(Query);
    // Calculate overall sum of student_attendance
    const overallAttendanceSum = studentData.reduce((sum, student) => sum + student.total_attendance, 0);
    console.log('overallAttendanceSum', overallAttendanceSum)
    // Calculate overall average of student_percentage
    const overallPercentageSum = studentData.reduce((sum, student) => parseFloat(parseFloat(sum) + parseFloat(student.student_percentage)), 0.0);
    console.log('overallPercentageSum', overallPercentageSum)
    const overallAveragePercentage = overallPercentageSum / studentData.length;
    console.log('overallAveragePercentage', overallAveragePercentage)
    const dateSpan = dateDifference
    return {
      dateSpan,
      overallAttendanceSum,
      overallAveragePercentage,
    };
  }

  return studentData;
}

class StudentAttendanceController {
  // Create a new attendance entry
  static async createAttendance(req, res) {
    try {
      const attendance = await db.StudentAttendance.create(req.body);
      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createSingleAttendance(req, res) {
    try {
      const { day, studentId, entranceTime, exitTime } = req.body;
  
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
      const attendance = await db.StudentAttendance.findOne({
        where: {
          student_id: studentId,
          admin_id: req.userId,
          session_id: req.sessionId,
          day: attendanceDate
        }
      });
  
      let attendanceData = {
        student_id: studentId,
        admin_id: req.userId,
        session_id: req.sessionId,
        day: attendanceDate,
        status: 'present',
        entrance_time: entranceTime
      };
  
      if (exitTime)
        attendanceData.exit_time = exitTime;
  
      if (!attendance) {
        await db.StudentAttendance.create(attendanceData);
      }
  
      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  
  static async deleteSingleAttendance(req, res) {
    try {

      const { day, studentId } = req.body;
      const attendanceDate = moment(day).tz('Asia/Kolkata').format('YYYY-MM-DD');
      const attendance = await db.StudentAttendance.destroy({
        where: {
          student_id: studentId,
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

  // Get all attendance entries for a specific student
  static async getAllAttendanceByStudent(req, res) {
    try {
      const studentId = req.params.studentId;
      const attendances = await db.StudentAttendance.findAll({ where: { student_id: studentId } });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get an attendance entry by ID
  static async getAttendanceById(req, res) {
    try {
      const attendanceId = req.params.id;
      const attendance = await db.StudentAttendance.findByPk(attendanceId);
      if (attendance) {
        res.json(attendance);
      } else {
        res.status(404).json({ error: 'db.StudentAttendance entry not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update an attendance entry by ID
  static async updateAttendance(req, res) {
    try {
      const attendanceId = req.params.id;
      const attendance = await db.StudentAttendance.findByPk(attendanceId);
      if (attendance) {
        await attendance.update(req.body);
        res.json(attendance);
      } else {
        res.status(404).json({ error: 'db.StudentAttendance entry not found' });
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Delete an attendance entry by ID
  static async deleteAttendance(req, res) {
    try {
      const attendanceId = req.params.id;
      const attendance = await db.StudentAttendance.findByPk(attendanceId);
      if (attendance) {
        await attendance.destroy();
        res.json({ message: 'db.Attendance entry deleted successfully' });
      } else {
        res.status(404).json({ error: 'db.Attendance entry not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Edit an attendance entry by day
  static async editByDay(req, res) {
    try {
      const { studentId, day } = req.params;
      const attendance = await db.StudentAttendance.findOne({ where: { student_id: studentId, day: day } });
      if (attendance) {
        await attendance.update(req.body);
        res.json(attendance);
      } else {
        res.status(404).json({ error: 'db.Attendance entry not found' });
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Get all attendance entries for a specific month
  static async getAllByMonth(req, res) {
    try {
      const { studentId, month } = req.params;
      const startDate = new Date(month);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const attendances = await db.StudentAttendance.findAll({
        where: {
          student_id: studentId,
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
      const { studentId, startMonth, startYear, endMonth, endYear } = req.params;
      const startDate = new Date(`${startYear}-${startMonth}`);
      const endDate = new Date(`${endYear}-${endMonth}`);
      const attendances = await db.StudentAttendance.findAll({
        where: {
          student_id: studentId,
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

  // Get bulk attendance for an array of student IDs
  static async getBulkAttendance(req, res) {
    try {
      const studentIds = req.body.studentIds;
      const attendances = await db.StudentAttendance.findAll({
        where: {
          student_id: {
            [Op.in]: studentIds,
          },
        },
      });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }


  // Get bulk attendance for an array of student IDs
  static async getStudentAttendancePercentageById(req, res) {
    console.log('getStudentAttendancePercentageById')
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

      let result = await calculateStudentsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of student IDs
  static async getStudentsPercentageSessionById(req, res) {
    console.log('getStudentsPercentageSessionById')
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
          let temp = await calculateStudentsPercentage(adminId, sessionId, startDate, endDate, action)
          temp.monthName = month.month
          return temp
        })
      );
      console.log("studentData", result)
      res.json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of student IDs
  static async getStudentsPercentage(req, res) {
    console.log('getStudentsPercentage')
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

      let result = await calculateStudentsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of student IDs
  static async getStudentsPercentageSession(req, res) {
    console.log('getStudentsPercentageSession')
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
          let temp = await calculateStudentsPercentage(adminId, sessionId, startDate, endDate, action)
          temp.monthName = month.month
          return temp
        })
      );
      console.log("studentData", result)
      res.json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get bulk attendance for an array of student IDs
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
      let result = await calculateStudentsPercentage(adminId, sessionId, start_date, end_date, action)

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
      const count = await db.StudentAttendance.count({
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
  static async getStudentsMonthPercentage(req, res) {
    console.log('getStudentsMonthPercentage')
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
      let result = await calculateStudentsPercentage(adminId, sessionId, start_date, end_date, action)

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

}

module.exports = StudentAttendanceController;
