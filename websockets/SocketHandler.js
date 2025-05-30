const dbService = require('./dbService');
const db = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config'); // Replace this with your secret key
const FirebaseConfig =  require('../config/FirebaseConfig')

// Socket.IO event handler for the 'attendance' event
const handleAttendanceEvent = async (socket,data) => {
  try {
    
    // Extract values from the received JSON data
    const JSONData = JSON.parse(data)
    const { faceId, timestamp, type, entry_type } = JSONData;
    console.log(faceId);
    if (type === 's') {
      // If the type is 's', find the student by faceId
      console.log(faceId);
      const student = await db.Student.findOne({ where: { face_id:faceId } });

      if (student) {
        // Extract current date and time

        //const currentDate = new Date(parseInt(timestamp))
        const utcDate = new Date(parseInt(timestamp))

        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5.5 hours)
        const istTimestamp = utcDate.getTime() + istOffset;
        const currentDate = new Date(istTimestamp);
        console.log(currentDate);

        // const isLeave = await db.StudentLeave.findOne({
        //   where:{
        //     day:currentDate,
        //     medium_id:student.medium_id,
        //     class_id:student.class_id,
        //     admin_id: socket.userId,
        //     session_id: socket.sessionId
        //   }
        // })

        // if(isLeave){
        //   socket.emit('attendance_response', {
        //     message: 'Cannot process attendance, Due to Leave is assigned today.',
        //     userId: socket.userId,
        //     sessionId: socket.sessionId,
        //     status: 'error',
        //   });
        //   console.log('Cannot process attendance, Due to Leave is assigned today.');
        //   return; // Exit the function
        // }
        
        console.log(currentDate);
        const currentTime = currentDate.toISOString().slice(11, 19); // Extract HH:MM:SS

        // Check if there's an entry for the given student_id and date and for given entry type
        const existingEntry = await db.StudentAttendance.findOne({
          where: {
            student_id: student.id,
            day: currentDate,
            [entry_type === 'enter' ? 'entrance_time' : 'exit_time']: {
              [db.Sequelize.Op.ne]: null,
            },
          },
        });

        if (!existingEntry) {
          try {
            let StudentAttendanceData = {
              student_id: student.id,
              day: currentDate,
              status:'present',
              admin_id: socket.userId,
              session_id: socket.sessionId
            }
    
            if(entry_type === 'enter')
              StudentAttendanceData.entrance_time = currentTime
            else
              StudentAttendanceData.exit_time = currentTime

            const attendance = await db.StudentAttendance.findOne({
              where: {
                student_id: student.id,
                day: currentDate,
                admin_id: socket.userId,
                session_id: socket.sessionId,
              }
            });

            const assocStudent = await db.ParentAssoc.findOne({
              where: {
                student_id: student.id
              }
            })

            const parent = await db.Parent.findOne({
              where: {
                id: assocStudent.parent_id,
              },
            });

            console.log("device token", parent.device_token);

            let firebaseMessage;  
            if (!attendance) {

              // If entry did not exist do not create any entry with 'exit' time , skip processing
              if (entry_type !== 'enter') {
                socket.emit('attendance_response', {
                  message: 'Entrance time is missing. Cannot process attendance exit.',
                  userId: socket.userId,
                  sessionId: socket.sessionId,
                  status: 'error',
                });
                console.log('Entrance time is missing. Cannot process attendance exit.');
                return; // Exit the function
              }
             
              // Entry not existed, create it
              await db.StudentAttendance.create(StudentAttendanceData);
              // Entry was created
              socket.emit('attendance_response', {
                message: 'Attendance entry created successfully.',
                userId: socket.userId,
                sessionId: socket.sessionId,
                status: 'success',
              });
              firebaseMessage = " entered the school at: " + currentTime.toString();
              console.log('Attendance entry created successfully.');
              
            } else {
              // Entry already existed, update it
              await attendance.update(StudentAttendanceData);
              socket.emit('attendance_response', {
                message: 'Attendance exit updated successfully.',
                userId: socket.userId,
                sessionId: socket.sessionId,
                status: 'success',
              });

              
              firebaseMessage = " exit the school at: " + currentTime.toString();
              console.log('Attendance exit updated successfully.');
            }

            try{
              const firebaseInstance = FirebaseConfig.getInstance();
              if(parent.device_token)
                firebaseInstance.sendPushNotification("Alert:", student.first_name + " " + student.last_name + firebaseMessage, parent.device_token);
        
            }catch(e){
              console.log("error fireabse", e.message);
            }


          } catch (error) {
            console.error('Error creating/updating attendance entry:', error);
            socket.emit('attendance_response', {
              message: 'Error creating/updating attendance entry.',
              userId: socket.userId,
              sessionId: socket.sessionId,
              status: 'error',
            });
          }

        } else {
          socket.emit('attendance_response', {
            message: 'Attendance entry already exists for this student and date.',
            userId: socket.userId,
            sessionId:socket.sessionId,
            status: 'success'
          });

          console.log('Attendance entry already exists for this student and date.');
        }
      } else {
        console.log('Student not found with the given faceId.');
        socket.emit('attendance_response', {
          message: 'Student not found with the given faceId.',
          userId: socket.userId,
          sessionId:socket.sessionId,
          status: 'success'
        });
        
      }
    } else if(type === 'e' ){
      // If the type is 's', find the student by faceId
      console.log(faceId);
      const staff = await db.Staff.findOne({ where: { face_id:faceId } });

      if (staff) {
        // Extract current date and time

        //const currentDate = new Date(parseInt(timestamp))
        const utcDate = new Date(parseInt(timestamp))

        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5.5 hours)
        const istTimestamp = utcDate.getTime() + istOffset;
        const currentDate = new Date(istTimestamp);
        console.log(currentDate);

        // const isLeave = await db.StaffLeave.findOne({
        //   where:{
        //     day:currentDate,
        //     designation_id:staff.designation_id,
        //     admin_id: socket.userId,
        //     session_id: socket.sessionId
        //   }
        // })

        // if(isLeave){
        //   socket.emit('attendance_response', {
        //     message: 'Cannot process attendance, Due to Leave is assigned today.',
        //     userId: socket.userId,
        //     sessionId: socket.sessionId,
        //     status: 'error',
        //   });
        //   console.log('Cannot process attendance, Due to Leave is assigned today.');
        //   return; // Exit the function
        // }
        
        console.log(currentDate);
        const currentTime = currentDate.toISOString().slice(11, 19); // Extract HH:MM:SS

        // Check if there's an entry for the given student_id and date and for given entry type
        const existingEntry = await db.StaffAttendance.findOne({
          where: {
            staff_id: staff.id,
            day: currentDate,
            [entry_type === 'enter' ? 'entrance_time' : 'exit_time']: {
              [db.Sequelize.Op.ne]: null,
            },
          },
        });

        if (!existingEntry) {
          try {
            let StaffAttendanceData = {
              staff_id: staff.id,
              day: currentDate,
              status:'present',
              admin_id: socket.userId,
              session_id: socket.sessionId
            }
    
            if(entry_type === 'enter')
              StaffAttendanceData.entrance_time = currentTime
            else
              StaffAttendanceData.exit_time = currentTime

            const attendance = await db.StaffAttendance.findOne({
              where: {
                staff_id: staff.id,
                day: currentDate,
                admin_id: socket.userId,
                session_id: socket.sessionId,
              }
            });

            if (!attendance) {

              // If entry did not exist do not create any entry with 'exit' time , skip processing
              if (entry_type !== 'enter') {
                socket.emit('attendance_response', {
                  message: 'Entrance time is missing. Cannot process attendance exit.',
                  userId: socket.userId,
                  sessionId: socket.sessionId,
                  status: 'error',
                });
                console.log('Entrance time is missing. Cannot process attendance exit.');
                return; // Exit the function
              }
             
              // Entry not existed, create it
              await db.StaffAttendance.create(StaffAttendanceData);
              // Entry was created
              socket.emit('attendance_response', {
                message: 'Attendance entry created successfully.',
                userId: socket.userId,
                sessionId: socket.sessionId,
                status: 'success',
              });
              
              console.log('Staff Attendance entry created successfully.');
              
            } else {
              // Entry already existed, update it
              await attendance.update(StaffAttendanceData);
              socket.emit('attendance_response', {
                message: 'Attendance exit updated successfully.',
                userId: socket.userId,
                sessionId: socket.sessionId,
                status: 'success',
              });

              
              console.log('Staff Attendance exit updated successfully.');
            }

          } catch (error) {
            console.error('Error creating/updating staff attendance entry:', error);
            socket.emit('attendance_response', {
              message: 'Error creating/updating staff attendance entry.',
              userId: socket.userId,
              sessionId: socket.sessionId,
              status: 'error',
            });
          }

        } else {
          socket.emit('attendance_response', {
            message: 'Attendance entry already exists for this staff and date.',
            userId: socket.userId,
            sessionId:socket.sessionId,
            status: 'success'
          });

          console.log('Attendance entry already exists for this staff and date.');
        }
      } else {
        console.log('Staff not found with the given faceId.');
        socket.emit('attendance_response', {
          message: 'Staff not found with the given faceId.',
          userId: socket.userId,
          sessionId:socket.sessionId,
          status: 'success'
        });
        
      }
    }else{
      console.log('Invalid type.');
        socket.emit('attendance_response', {
          message: 'Invalid type.',
          userId: socket.userId,
          sessionId:socket.sessionId,
          status: 'failure'
        });

    }
  } catch (error) {
    console.error('Error handling attendance event:', error);
  }
};

// socket_handlers.js
 function  handleSocketEvents(io) {

  // Define WebSocket event handlers
    io.use( async (socket, next) => {
      // Read the token from the query parameters of the socket connection
      const authToken = socket.handshake.query.token;
    
      // Validate the authToken against your authentication mechanism (e.g., JWT verification, database check)
      if (authToken ) {
        try{
          jwt.verify(authToken, SECRET_KEY, async (err, decodedToken) => {
              if (err) {
                console.log("jwt",err.message);
                return next(new Error(err.message));
              }
      
              socket.userId = decodedToken.id;
              const currentDate = new Date().toISOString().slice(0, 10);
              const session = await  db.Session.findOne({
              where: {
                  admin_id: decodedToken.id,
                  start_date: { [Op.lte]: currentDate },
                  end_date: { [Op.gte]: currentDate },
              },
              attributes: ['id','paid_status'],
              });
              
              if (!session || session.paid_status !== 'paid') {
                  return next(new Error('payment not done'));
              }else{
                  socket.sessionId = session.id;
              }
              console.log('socket connected');
              return next();
              
            });
          }catch(err){
              console.log("jwt error",err.message);
              return next(new Error(err.message));
          }
      }else{
        // If no  authToken , reject the socket connection
        console.log('Socket authentication failed with no auth token');
        return next(new Error('Socket authentication failed - no auth token'));
      }
    });

    io.on('connection', (socket) => {
      console.log('A user connected');
  
      socket.on('test', (data) => {
        // Handle 'test' event from the client
        console.log('Received test data:', data);
        console.log("userId", socket.userId);
        // Send a response back to the client
        socket.emit('test_response', {
          message: 'Test response from server',
          userId: socket.userId,
          sessionId:socket.sessionId
        });
      });

      io.on('close', function () {
        
      })
  
      // Add more WebSocket event handlers as needed
  
      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });

      socket.on('attendance', (data) => {
        handleAttendanceEvent(socket,data);
      });


    });
  }
  
  module.exports = handleSocketEvents;
  