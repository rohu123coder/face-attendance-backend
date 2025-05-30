const express = require('express');
const router = express.Router();
const AuthController = require('./controllers/AuthController');

const StudentController = require('./controllers/StudentController');
const StaffController = require('./controllers/StaffController');

const ParentController = require('./controllers/ParentController');
const StandardController = require('./controllers/StandardController');
const MediumController = require('./controllers/MediumController');
const StaffDepartmentController = require('./controllers/StaffDepartmentController');
const StaffDesignationController = require('./controllers/StaffDesignationController');
const StudentAttendanceController = require('./controllers/StudentAttendanceController');
const StaffAttendanceController = require('./controllers/StaffAttendanceController');
const StudentLeaveController = require('./controllers/StudentLeaveController');
const StaffLeaveController = require('./controllers/StaffLeaveController');
const ImageController = require('./controllers/ImageController');
const ParentAppController = require('./controllers/ParentAppController');
const ExcelController = require('./controllers/ExcelController');
const SalaryController = require('./controllers/SalaryController');
const UserController = require('./controllers/UserController');

//const multer = require('multer');

router.post('/login', AuthController.login );
router.post('/logout', AuthController.logout );
router.post('/parentlogin', AuthController.parentLogin );
router.post('/admin/login', AuthController.adminLogin );


// Create a new student
router.post('/admin/users', UserController.createUser);

// Get all students
router.get('/admin/users', UserController.getAllUsers);

// Get a student by ID
router.get('/admin/users/:id', UserController.getUserById);

// Update a student
router.put('/admin/users/:id', UserController.updateUser);

// Delete a student
router.delete('/admin/users/:id', UserController.deleteUser);

//promote students
router.post('/admin/users/activate', UserController.activateUsers);

router.get('/getSchoolCounts', UserController.getSchoolCounts);



// Create a new student
router.post('/students', StudentController.createStudent);

// Get all students
router.get('/students', StudentController.getAllStudentsByFilter);

// Get a student by ID
router.get('/students/:id', StudentController.getStudentById);

// Update a student
router.put('/students/:id', StudentController.updateStudent);

// Delete a student
router.delete('/students/:id', StudentController.inactiveStudent);

// Delete bulk students
router.post('/deletestudents', StudentController.deleteBulk);

//promote students
router.post('/students/promote', StudentController.promoteStudents);

router.get('/getstudentscount', StudentController.getStudentsCount);

// Create a new staffs

router.post('/staffs', StaffController.createStaff);

// Get all students
router.get('/staffs', StaffController.getAllStaffByFilter);

// Get a student by ID
router.get('/staffs/:id', StaffController.getStaffById);

// Update a student
router.put('/staffs/:id', StaffController.updateStaff);

// Delete a student
router.delete('/staffs/:id', StaffController.inactiveStaff);

router.get('/getstaffscount', StaffController.getStaffsCount);

// Delete bulk staffs
router.post('/deletestaffs', StaffController.deleteBulk);

// Create a new parent
router.post('/parent', ParentController.createParent);

// Get all parents
router.get('/parents', ParentController.getParentList);

// Get a parent by ID
router.get('/parents/:id', ParentController.getParentById);

// Update a parent
router.put('/parents/:id', ParentController.updateParent);

//router.post('/parentlogin', AuthController.parentLogin );


// Create a new standard
router.post('/standards', StandardController.createStandard);

// Get all standards
router.get('/standards', StandardController.getAllStandards);

// Get a specific standard by ID
router.get('/standards/:id', StandardController.getStandardById);

// Update a standard by ID
router.put('/standards/:id', StandardController.updateStandard);

// Delete a standard by ID
router.delete('/standards/:id', StandardController.deleteStandard);

// Create a new medium
router.post('/mediums', MediumController.createMedium);

// Get all mediums
router.get('/mediums', MediumController.getAllMediums);

// Get a medium by ID
router.get('/mediums/:id', MediumController.getMediumById);

// Update a medium
router.put('/mediums/:id', MediumController.updateMedium);

// Delete a medium
router.delete('/mediums/:id', MediumController.deleteMedium);


router.post('/departments', StaffDepartmentController.createDepartments);
router.get('/departments', StaffDepartmentController.getAllDepartments);

router.post('/designations', StaffDesignationController.createDesignation);
router.get('/designations', StaffDesignationController.getAllDesignation);
router.get('/designationbydepartment', StaffDesignationController.getAllDesignationByDepartments);


router.get('/syncimages', ImageController.getList);




/* ---------student  attendance apis routes -----------------*/


// Create a new attendance entry
router.post('/attendance', StudentAttendanceController.createAttendance);

// Get all attendance entries for a specific student
router.get('/attendance/:studentId', StudentAttendanceController.getAllAttendanceByStudent);

// Get an attendance entry by ID
router.get('/attendance/:id', StudentAttendanceController.getAttendanceById);

// Update an attendance entry by ID
router.put('/attendance/:id', StudentAttendanceController.updateAttendance);

// Delete an attendance entry by ID
router.delete('/attendance/:id', StudentAttendanceController.deleteAttendance);

// Edit an attendance entry by day
router.put('/attendance/:studentId/:day', StudentAttendanceController.editByDay);

// Get all attendance entries for a specific month
router.get('/attendance/:studentId/month/:month', StudentAttendanceController.getAllByMonth);

// Get all attendance entries for a specific session
router.get('/attendance/:studentId/session/:startMonth/:startYear/:endMonth/:endYear', StudentAttendanceController.getAllBySession);

// Get bulk attendance for an array of student IDs
router.post('/attendance/bulk', StudentAttendanceController.getBulkAttendance);

router.post('/createattendance',StudentAttendanceController.createSingleAttendance);
router.post('/deleteattendance',StudentAttendanceController.deleteSingleAttendance);
/* ---------staff  attendance apis routes -----------------*/


// Create a new attendance entry
router.post('/staffattendance', StaffAttendanceController.createAttendance);

// Get all attendance entries for a specific student
router.get('/staffattendance/:staffId', StaffAttendanceController.getAllAttendanceByStaff);

// Get an attendance entry by ID
router.get('/staffattendance/:id', StaffAttendanceController.getAttendanceById);

// Update an attendance entry by ID
router.put('/staffattendance/:id', StaffAttendanceController.updateAttendance);

// Delete an attendance entry by ID
router.delete('/staffattendance/:id', StaffAttendanceController.deleteAttendance);

// Edit an attendance entry by day
router.put('/staffattendance/:staffId/:day', StaffAttendanceController.editByDay);

// Get all attendance entries for a specific month
router.get('/staffattendance/:staffId/month/:month', StaffAttendanceController.getAllByMonth);

// Get all attendance entries for a specific session
router.get('/staffattendance/:staffId/session/:startMonth/:startYear/:endMonth/:endYear', StaffAttendanceController.getAllBySession);

// Get bulk attendance for an array of student IDs
router.post('/staffattendance/bulk', StaffAttendanceController.getBulkAttendance);

router.post('/createstaffattendance',StaffAttendanceController.createSingleAttendance);
router.post('/deletestaffattendance',StaffAttendanceController.deleteSingleAttendance);


router.get('/studentspercentage',StudentAttendanceController.getStudentsPercentage);
router.get('/studentsoverallpercentage',StudentAttendanceController.getOverallPercentage);
router.get('/todaystudentattendance/', StudentAttendanceController.getTodayAttendance);
router.get('/studentssessionpercentage/', StudentAttendanceController.getStudentsPercentageSession);
router.get('/studentspercentagebyid/:id', StudentAttendanceController.getStudentAttendancePercentageById);
router.get('/studentssessionpercentagebyid/:id', StudentAttendanceController.getStudentsPercentageSessionById);
router.get('/studentsmonthlypercentage', StudentAttendanceController.getStudentsMonthPercentage);

router.get('/staffspercentage',StaffAttendanceController.getStaffsPercentage);
router.get('/staffsoverallpercentage',StaffAttendanceController.getOverallPercentage);
router.get('/todaystaffattendance/', StaffAttendanceController.getTodayAttendance);
router.get('/staffssessionpercentage/', StaffAttendanceController.getStaffsPercentageSession);
router.get('/staffspercentagebyid/:id', StaffAttendanceController.getStaffAttendancePercentageById);
router.get('/staffssessionpercentagebyid/:id', StaffAttendanceController.getStaffsPercentageSessionById);
router.get('/staffsmonthlypercentage', StaffAttendanceController.getStaffsMonthPercentage);
router.get('/staffsmonthlypercentagebulk', StaffAttendanceController.getAllStaffsMonthPercentage);
router.get('/staffsmonthlyreport', StaffAttendanceController.getAllStaffAttendanceReport);
router.get('/staffsmonthlypercentagelist', StaffAttendanceController.getListStaffsMonthPercentage);



/* --------- student leaves apis routes -----------------*/
router.post('/leaves', StudentLeaveController.createStudentLeaves);
router.get('/leaves', StudentLeaveController.getStudentLeaves);
router.post('/deleteleaves', StudentLeaveController.deleteStudentLeaves);

/* --------- staff leaves apis routes -----------------*/
router.post('/staffleaves', StaffLeaveController.createStaffLeaves);
router.get('/staffleaves', StaffLeaveController.getStaffLeaves);
router.post('/deletestaffleaves', StaffLeaveController.deleteStaffLeaves);

/* --------- salary apis routes -----------------*/
router.post('/salarycomponents', SalaryController.createSalaryComponent);
router.get('/salarycomponents', SalaryController.getAllSalaryComponents);
router.get('/salarycomponentsbysalary', SalaryController.getAllSalaryComponentsBySalary);
router.post('/deletesalarycomponents', SalaryController.deleteSalaryComponents);


/*__ Excel routes---_*/

router.get('/download-sample-excel', ExcelController.downloadSampleExcel);
router.post('/upload-student-excel', ExcelController.uploadStudentsExcel);


/* --------------- Parent App routes --------------------------------*/

router.get('/parentapp/assocstudentlist', ParentAppController.getStudentsByParentId);
router.get ('/parentapp/assocstudentattendance/:id', ParentAppController.getAllAttendanceByStudent);
router.put ('/parentapp/updatetoken', ParentAppController.updateDeviceToken);
router.put ('/parentapp/updatestudentimage/:id', ParentAppController.updateStudentImage);


module.exports = router;
