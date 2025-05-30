const db = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
var fs = require('fs');
const bcrypt = require('bcrypt');
const FirebaseConfig =  require('../config/FirebaseConfig')
const sharp = require('sharp');


// Function to perform validation on the request body
const validateStaffData = (req) => {
    return new Promise(async (resolve, reject) => {
      // Check if all required fields are present in the request body
      const requiredFields = [
        'first_name',
        'last_name',
        'employee_id',
        'gender',
        'dob',
        'joining_date',
        'marital_status',
        'aadhar_no',
        'mobile_no',
        'email',
        'blood_group',
        'emergency_contact',
        'department_id',
        'r_address',
        'r_city',
        'r_state',
        'r_pincode',
        'p_address',
        'p_city',
        'p_state',
        'p_pincode',
        'bank_name',
        'bank_branch',
        'bank_ifsc',
        'acc_no',
        'pf_no',
      ];
  
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
      }
  
      // Check for duplicate admission_no
      if (req.body.employee_id) {
        await db.Staff.findOne({ where: { employee_id: req.body.employee_id } })
          .then(existingStaff => {
            if (existingStaff) {
              reject(new Error('Admission number already exists'));
            } else {
              resolve();
            }
          })
          .catch(err => {
            reject(err);
          });
      } else {
        resolve();
      }
    });
  };


  function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-+=<>?';
    let randomString = '';
  
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
  
    return randomString;
  }



exports.createStaff = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  console.log(req.body)

  const faceId = generateRandomString(20)

  // const userData = await db.User.findOne({where: {admin_id: req.userId}});
  // const staffLimit = userData.staff_limit;

  // const staffCount = await db.Staff.count({where: {admin_id: req.userId}});

  // if(staffLimit == staffCount) {
  //   res.status(400).json({ error: 'Staff limit exceeded' });
  // }

  try {
    
    const fileFilter = (req, file, cb) => {
      if (file.fieldname === "staff_image") { // if uploading resume
        if (
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'image/jpeg'
        ) { // check file type to be jpg, png, or jpeg
          cb(null, true);
        } else {
          cb(null, false); // else fails
        }
      } else { // else uploading image
        if (
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'image/jpeg'
        ) { // check file type to be png, jpeg, or jpg
          cb(null, true);
        } else {
          cb(null, false); // else fails
        }
      }
    };

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {

        console.log(req.body.first_name);
        console.log("values", file);

        // check all constraint here like no params duplicate params etc
        const employee_id = req.body.employee_id;
        const first_name = req.body.first_name;
        const last_name = req.body?.last_name;

        const name = first_name?.trim() + '_' + last_name?.trim()

        const uploadDir = path.join(`uploads`, `\images\/${req.userId}\/e_${faceId}_${name}`);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        console.log("upload path", uploadDir)
        cb(null, uploadDir);
      },
      // By default, multer removes file extensions so let's add them back
      filename: function (req, file, cb) {
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;
        const name = first_name?.trim() + '_' + last_name?.trim()

        cb(null, (Math.floor(Math.random() * 10000) + 1) + path.extname(file.originalname));
      }
    });


    let upload = multer({ storage: storage, fileFilter: fileFilter }).single('staff_image');
    upload(req, res, async function (error) {

      const files = req.file
      console.log("files", files)

      if (req.fileValidationError) {
        return res.send(req.fileValidationError);
      }
      else if (!req.file) {
        return res.send(401, { error: 'Please select an file to upload' });
      }

      else if (error instanceof multer.MulterError) {
        console.log(error.message)
        return res.send(401, error);
      }
      else if (error) {
        return res.send(401, error);
      }

      const staffData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        employee_id: req.body.employee_id,
        gender: req.body.gender,
        dob: req.body.dob,
        joining_date: req.body.joining_date,
        marital_status: req.body.marital_status,
        aadhar_no: req.body.aadhar_no,
        mobile_no: req.body.mobile_no,
        email: req.body.email,
        blood_group: req.body.blood_group,
        emergency_contact: req.body.emergency_contact,
        department_id: req.body.department_id,
        designation_id: req.body.designation_id,
        r_address: req.body.r_address,
        r_city: req.body.r_city,
        r_state: req.body.r_state,
        r_pincode: req.body.r_pincode,
        p_address: req.body.p_address,
        p_city: req.body.p_city,
        p_state: req.body.p_state,
        p_pincode: req.body.p_pincode,
        pan_number: req.body.pan_number,
        basic_salary: req.body.basic_salary,           
      };

      staffData.admin_id  = req.userId;
      staffData.face_id = faceId;
      staffData.status = 'active';
      if(req.file){
        staffData.staff_image = req.file.path;
      }

      const staffBankData = {
        bank_name: req.body.bank_name,
        bank_branch: req.body.bank_branch,
        bank_ifsc: req.body.bank_ifsc,
        acc_no: req.body.acc_no,
        pf_no: req.body.pf_no
      };
      
      try {

        await validateStaffData(req)
        
        const staff = await db.Staff.create(staffData, { transaction });
        staffBankData.staff_id = staff.id
        const staffBankDetails = await db.StaffBankInfo.create(staffBankData, { transaction });

        // Commit the transaction
        await transaction.commit();

        if (staff)
          res.status(201).json(staff);
        else
          res.status(400).json({ error: 'Error creating student' });

      } catch (err) {
        await transaction.rollback();
        console.log("err",err.message);
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error while removing uploaded file:', unlinkErr);   
          });
        } 
        res.status(400).json({ error: err.message });
      }
    });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  console.log("here",req.userId)
    const transaction = await db.sequelize.transaction();
  
    try {
      const { id } = req.params;
      console.log(req.userId)
      const existingStaff = await db.Staff.findOne({
        where: {
          id: id,
          admin_id: req.userId,
        },
      });
  
      if (!existingStaff) {
        return res.status(404).json({ error: 'Staff not found' });
      }

      const fileFilter = (req, file, cb) => {
        if (file.fieldname === "staff_image") { // if uploading resume
          if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg'
          ) { // check file type to be jpg, png, or jpeg
            cb(null, true);
          } else {
            cb(null, false); // else fails
          }
        } else { // else uploading image
          if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg'
          ) { // check file type to be png, jpeg, or jpg
            cb(null, true);
          } else {
            cb(null, false); // else fails
          }
        }
      };
  
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          console.log(req.body.first_name);
          console.log("values", file);
  
          // check all constraint here like no params duplicate params etc
          const faceId = existingStaff.face_id;
          const first_name = req.body.first_name?req.body.first_name:existingStaff.first_name;
          const last_name = req.body.last_name?req.body.last_name:existingStaff.last_name;
          const name = first_name?.trim() + '_' + last_name?.trim()
  
          const uploadDir = path.join(`uploads`, `\images\/${req.userId}\/e_${faceId}_${name}`);
  
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          console.log("upload path", uploadDir)
          cb(null, uploadDir);
        },
        // By default, multer removes file extensions so let's add them back
        filename: function (req, file, cb) {
          const first_name = req.body.first_name?req.body.first_name:existingStaff.first_name;
          const last_name = req.body.last_name?req.body.last_name:existingStaff.last_name;
          const name = first_name?.trim() + '_' + last_name?.trim()
          cb(null, (Math.floor(Math.random() * 10000) + 1) + path.extname(file.originalname));
        }
      });
  
      //let upload = multer({ storage: storage, fileFilter: fileFilter }).fields([{ name:'student_image', maxCount:10 },]);
  
      let upload = multer({ storage: storage, fileFilter: fileFilter }).single('staff_image');
  
      upload(req, res, async function (err) {
        console.log(req?.file?.filename)
  
        if (req.fileValidationError) {
          return res.status(401).json({ error: req.fileValidationError });
        } else if (err instanceof multer.MulterError) {
          return res.status(401).json({ error: err.message });
        } else if (err) {
          return res.status(401).json({ error: err.message });
        }

        const staffData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            employee_id: req.body.employee_id,
            gender: req.body.gender,
            dob: req.body.dob,
            joining_date: req.body.joining_date,
            marital_status: req.body.marital_status,
            aadhar_no: req.body.aadhar_no,
            mobile_no: req.body.mobile_no,
            email: req.body.email,
            blood_group: req.body.blood_group,
            emergency_contact: req.body.emergency_contact,
            department_id: req.body.department_id,
            designation_id: req.body.designation_id,
            r_address: req.body.r_address,
            r_city: req.body.r_city,
            r_state: req.body.r_state,
            r_pincode: req.body.r_pincode,
            p_address: req.body.p_address,
            p_city: req.body.p_city,
            p_state: req.body.p_state,
            p_pincode: req.body.p_pincode,
            pan_number: req.body.pan_number,
            basic_salary: req.body.basic_salary,               
          };

          const staffBankData = {
            bank_name: req.body.bank_name,
            bank_branch: req.body.bank_branch,
            bank_ifsc: req.body.bank_ifsc,
            acc_no: req.body.acc_no,
            pf_no: req.body.pf_no,
          }
          
        //const staffData = { ...req.body };
  
        // Check if a new image is uploaded and delete the existing image
        if (req.file) {
          const existingImagePath = existingStaff.staff_image;
          if (existingImagePath) {
            const oldPath = path.dirname(existingImagePath);
            const newPath =path.dirname(req.file.path);
  
            console.log("old image", existingImagePath)
            console.log("new image", req.file.path)
            console.log("old path",oldPath);
            console.log("new path",newPath);
            // also delete previous directory as well if directory name changes
            if(oldPath != newPath)
              fs.rmdirSync(oldPath, { recursive: true });
            else
              fs.unlinkSync(existingImagePath); // Delete the existing image
          }
          staffData.staff_image = req.file.path; // Set the path of the new image
        }
  
        try {
  
          let staff = await existingStaff.update(staffData,transaction);
          let staffBankDetails = await db.StaffBankInfo.update(staffBankData,{
            where: { staff_id: existingStaff.id }, transaction
          })
          await transaction.commit();
  
          if (staff)
            res.status(201).json(staff);
          else
            res.status(400).json({ error: 'Error creating staff' });
        } catch (err) {
          await transaction.rollback();
          if (req.file && req.file.path) {
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Error while removing uploaded file:', unlinkErr); 
            });
          } 
          console.log("error",err);
          res.status(401).json({ error: err.message });
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Get all students
exports.getAllStaffs = async (req, res) => {
    try {
      const staffs = await db.Staff.findAll({
        where: {
          admin_id: req.userId,
          status: 'active',// Replace this with the actual admin_id value you want to filter with
        },
        include: [
          { model: db.StaffDepartment, as: 'department' },
          { model: db.StaffDesignation, as: 'designation' },
          {
            model: db.StaffBankInfo,
            as: 'staffBankDetails',
          }
        ],
      });
      res.json(staffs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.getAllStaffByFilter = async (req, res) => {
    try {
      const { departmentId, designationId, searchText, start, limit } = req.query;
      console.log("departmentId",departmentId)

      const options = {
        include: [
            { model: db.StaffDepartment, as: 'department' },
            { model: db.StaffDesignation, as: 'designation' },
            {
              model: db.StaffBankInfo,
              as: 'staffBankDetails',
            }
          ],
      };

      options.where = { ...options.where, admin_id: req.userId };
      // Add filtering conditions
      if (departmentId) {
        options.where = { ...options.where, department_id: departmentId };
      }
      if (designationId) {
        options.where = { ...options.where, designation_id: designationId };
      }
      if (searchText && searchText.length > 0) {
        options.where = {
          ...options.where,
          [db.Sequelize.Op.or]: [
            { first_name: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { last_name: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { r_city: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { r_state: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { p_city: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { p_state: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { employee_id: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { mobile_no: { [db.Sequelize.Op.like]: `%${searchText}%` } },
            { email: { [db.Sequelize.Op.like]: `%${searchText}%` } },
          ],
        };
      }
  
      // Add pagination options
      if (start && limit) {
        options.offset = parseInt(start);
        options.limit = parseInt(limit);
      }
  
      options.where = { ...options.where, status: 'active' };
  
      const staffs = await db.Staff.findAll(options);
      res.json(staffs);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  };

// Get a staff member by ID
exports.getStaffById = async (req, res) => {
    try {
        const staff = await db.Staff.findOne({
          where: {
            id: req.params.id,
            admin_id: req.userId,// Replace this with the actual admin_id value you want to filter with
            status:'active'
          },
          include: [
            { model: db.StaffDepartment, as: 'department' },
            { model: db.StaffDesignation, as: 'designation' },
            {
              model: db.StaffBankInfo,
              as: 'staffBankDetails',
            }
          ],
        });

       if (staff) {
        console.log("staff details", staff)
      if(staff.staff_image){
        fs.readFile(staff.staff_image, async (err, data) => {
          if (err) {
            console.error('Error reading image:', err);
          } 

          const thumbnailData = await sharp(data,{ failOnError: false })
              .resize({ width: 100, height: 100 }) // Adjust thumbnail size as needed
              .toBuffer();

          const base64Image = Buffer.from(thumbnailData).toString('base64');
          //student.student_image_base64 = base64Image;

          const resData = {
           
            id: staff.id,
            first_name: staff.first_name,
            last_name: staff.last_name,
            status: staff.status,
            joining_date: staff.joining_date,
            marital_status:staff.marital_status,
            employee_id: staff.employee_id,
            staff_image_thumbnail: base64Image,
            face_id: staff.face_id,
            gender: staff.gender,
            dob: staff.dob,
            joining_date: staff.joining_date,
            aadhar_no: staff.aadhar_no,
            mobile_no: staff.mobile_no,
            email: staff.email,
            blood_group: staff.blood_group,
            emergency_contact: staff.emergency_contact,
            department_id: staff.department_id,
            r_address: staff.r_address,
            r_city: staff.r_city,
            r_state: staff.r_state,
            r_pincode: staff.r_pincode,
            p_address: staff.p_address,
            p_city: staff.p_city,
            p_state: staff.p_state,
            p_pincode: staff.p_pincode,
            bank_name: staff.staffBankDetails?.bank_name,
            bank_branch: staff.staffBankDetails?.bank_branch,
            bank_ifsc: staff.staffBankDetails?.bank_ifsc,
            acc_no: staff.staffBankDetails?.acc_no,
            pf_no: staff.staffBankDetails?.pf_no,
            staff_image_thumbnail: base64Image,
            pan_number: staff.pan_number,
            basic_salary: staff.basic_salary, 
            department: {
                id: staff?.department?.id,
                department_name: staff?.department?.department_name,
                dep_id: staff?.department?.dep_id,
                admin_id:staff?.department?.admin_id,
                session_id: staff?.department?.session_id,
            },
            designation: {
              id: staff?.designation?.id,
              designation_name: staff?.designation?.designation_name,
              des_id: staff?.designation?.des_id,
              
          },
        }
          res.json(resData);
        });
      }else{
        res.json(staff);
      }

    } else {
      res.status(404).json({ error: 'Staff not found' });
    }

      } catch (err) {
        res.status(500).json({ error: err.message });
      }
};

// Delete a staff member
exports.inactiveStaff = async (req, res) => {
    try {
      const staff = await db.Staff.findByPk(req.params.id);
      if (staff) {
        staff.status = 'inactive';
        await staff.save();
        res.status(200).json({ message: 'Staff member deleted successfully' });
      } else {
        res.status(404).json({ error: 'Staff member not found' });
      }
    } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ error: 'Error deleting staff member' });
    }
  };

  // student counts
exports.getStaffsCount = async (req, res) => {
  try {
    // Retrieve the adminId from the request (assuming it's available)
    const adminId = req.userId;

    // Use Sequelize's count method to count the number of students with the specified admin_id
    const staffCount = await db.Staff.count({
      where: { admin_id: adminId, status: 'active' }
    });

    // Send the count as a JSON response
    res.json({ staffCount: staffCount });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a staff member
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await db.Staff.findByPk(req.params.id);
    if (staff) {
      await staff.destroy();
      res.status(200).json({ message: 'Staff member deleted successfully' });
    } else {
      res.status(404).json({ error: 'Staff member not found' });
    }
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Error deleting staff member' });
  }
};

// Delete a student
exports.deleteBulk = async (req, res) => {
  try {
    const { ids } = req.body; // Assuming you send an array of IDs in the request body
    await db.Student.update(
      { status: 'deleted' },
      {
        where: {
          id: ids,
        },
      }
    );
    res.status(200).json({ message: 'Staffs deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



