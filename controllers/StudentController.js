const db = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
var fs = require('fs');
const bcrypt = require('bcrypt');
const FirebaseConfig =  require('../config/FirebaseConfig')
const sharp = require('sharp');

// Function to perform validation on the request body
const validateStudentData = (req) => {
  return new Promise(async (resolve, reject) => {
    // Check if all required fields are present in the request body
    const requiredFields = [
      'first_name',
      'last_name',
      'gender',
      'dob',
      'joining_date',
      'admission_no',
      'parent_name',
      'parent_phone',
      'class_id',
      'medium_id',
      'section',
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
    }

    // Check for duplicate admission_no
    if (req.body.admission_no) {
      await db.Student.findOne({ where: { admission_no: req.body.admission_no , admin_id: req.userId} })
        .then(existingStudent => {
          if (existingStudent) {
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


// Create a new student
exports.createStudent = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  console.log(req.body)

  const faceId = generateRandomString(20)

  // const userData = await db.User.findOne({where: {admin_id: req.userId}});
  // const studentLimit = userData.student_limit;

  // const studentCount = await db.Student.count({where: {admin_id: req.userId}});

  // if(studentLimit == studentCount) {
  //   res.status(400).json({ error: 'Student limit exceeded' });
  // }

  try {
    
    const fileFilter = (req, file, cb) => {
      if (file.fieldname === "student_image") { // if uploading resume
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
        const admission_no = req.body.admission_no;
        const first_name = req.body.first_name;
        const last_name = req.body?.last_name;

        const name = first_name?.trim() + '_' + last_name?.trim()

        const uploadDir = path.join(`uploads`, `\images\/${req.userId}\/s_${faceId}_${name}`);

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

    //let upload = multer({ storage: storage, fileFilter: fileFilter }).fields([{ name:'student_image', maxCount:10 },]);

    let upload = multer({ storage: storage, fileFilter: fileFilter }).single('student_image');
    upload(req, res, async function (error) {

      const files = req.file
      console.log("files", files)

      if (req.fileValidationError) {
        return res.send(req.fileValidationError);
      }
      // else if (!req.file) {
      //   return res.send(401, { message: 'Please select an file to upload' });
      // }
      else if (error instanceof multer.MulterError) {
        console.log(error.message)
        return res.send(401, error);
      }
      else if (error) {
        return res.send(401, error);
      }

      const studentData = { ...req.body };
      studentData.admin_id  = req.userId;
      studentData.face_id = faceId;
      if(req.file){
        studentData.student_image = req.file.path;
      }
      
      try {

        await validateStudentData(req)
        
        const student = await db.Student.create(studentData, { transaction });

        // Check if a parent with the provided parent_phone exists
        const existingParent = await db.Parent.findOne({
          where: { username: req.body.parent_phone, admin_id: req.userId},
          transaction,
        });
        console.log('existingParent',existingParent)

       // If a parent with the same phone number doesn't exist, create a new parent
       let parent;
       if (!existingParent) {
         // Hash the parent's password using bcrypt
         const hashedPassword = await bcrypt.hash(req.body.parent_phone, 10);
 
         try{

           parent = await db.Parent.create({
             name: req.body.parent_name,
             email: req.body.parent_email,
             phone: req.body.parent_phone,
             username: req.body.parent_phone,
             password: hashedPassword,
             admin_id:req.userId,
             transaction,
           });
         }catch(err){
          console.log(err);
         }
       } else {
         parent = existingParent;
       }

        //Create the parent_assoc entry
        await db.ParentAssoc.create({
          parent_id: parent.id,
          student_id: student.id,
          transaction,
        });

        // Commit the transaction
        await transaction.commit();

        if (student)
          res.status(201).json(student);
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


exports.updateStudent = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    console.log(req.userId)
    const existingStudent = await db.Student.findOne({
      where: {
        id: id,
        admin_id: req.userId,
      },
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const assocStudent = await db.ParentAssoc.findOne({
      where: {
        student_id: id
      }
    })

    const parent = await db.Parent.findOne({
      where: {
        id: assocStudent.parent_id,
      },
    });


    console.log("parent", parent.device_token)

    try{
      const firebaseInstance = FirebaseConfig.getInstance();
      if(parent.device_token)
        firebaseInstance.sendPushNotification("Alert","someone updated your child", parent.device_token);

    }catch(e){
      console.log("error fireabse", e.message);
    }

    // write a code to get user(school) id from session and concatenate its id in directory path 
    let user_id = 1; // as of now make it static
    
    const fileFilter = (req, file, cb) => {
      if (file.fieldname === "student_image") { // if uploading resume
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
        const faceId = existingStudent.face_id;
        const first_name = req.body.first_name?req.body.first_name:existingStudent.first_name;
        const last_name = req.body.last_name?req.body.last_name:existingStudent.last_name;
        const name = first_name?.trim() + '_' + last_name?.trim()

        const uploadDir = path.join(`uploads`, `\images\/${req.userId}\/s_${faceId}_${name}`);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        console.log("upload path", uploadDir)
        cb(null, uploadDir);
      },
      // By default, multer removes file extensions so let's add them back
      filename: function (req, file, cb) {
        const first_name = req.body.first_name?req.body.first_name:existingStudent.first_name;
        const last_name = req.body.last_name?req.body.last_name:existingStudent.last_name;
        const name = first_name?.trim() + '_' + last_name?.trim()
        cb(null, (Math.floor(Math.random() * 10000) + 1) + path.extname(file.originalname));
      }
    });

    //let upload = multer({ storage: storage, fileFilter: fileFilter }).fields([{ name:'student_image', maxCount:10 },]);

    let upload = multer({ storage: storage, fileFilter: fileFilter }).single('student_image');

    upload(req, res, async function (err) {
      console.log(req?.file?.filename)

      if (req.fileValidationError) {
        return res.status(401).json({ error: req.fileValidationError });
      } else if (err instanceof multer.MulterError) {
        return res.status(401).json({ error: err.message });
      } else if (err) {
        return res.status(401).json({ error: err.message });
      }

      const studentData = { ...req.body };

      // Check if a new image is uploaded and delete the existing image
      if (req.file) {
        const existingImagePath = existingStudent.student_image;
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
        studentData.student_image = req.file.path; // Set the path of the new image
      }

      try {

        const existingParentId = await db.ParentAssoc.findOne({
          where: { student_id: id },
          transaction,
        });

        // Update the parent_assoc entry
        const parentData = {};
        if (req.body.parent_name) {
          parentData.name = req.body.parent_name;
        }
        if (req.body.parent_email) {
          parentData.email = req.body.parent_email;
        }
        if (req.body.parent_phone) {
          parentData.phone = req.body.parent_phone;
          parentData.username = req.body.parent_phone;
        }

        await db.Parent.update(parentData, {
          where: { id : existingParentId.parent_id },
          transaction,
        });

        let student = await existingStudent.update(studentData,transaction);

        await transaction.commit();

        if (student)
          res.status(201).json(student);
        else
          res.status(400).json({ error: 'Error creating student' });
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
exports.getAllStudents = async (req, res) => {
  try {
    const students = await db.Student.findAll({
      where: {
        admin_id: req.userId // Replace this with the actual admin_id value you want to filter with
      },
      include: [
        { model: db.Standard, as: 'class' },
        { model: db.Medium, as: 'medium' }
      ],
    });

    // const students = await db.Student.findAll({
    //   include: [{ model: db.Standard, as: 'class' }, { model: db.Medium, as: 'medium' }], // Include the "class" association
    // });
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStudentsByFilter = async (req, res) => {
  try {
    const { classId, mediumId, searchText, start, limit } = req.query;
    console.log("classId",classId)
    const options = {
      include: [{ model: db.Standard, as: 'class' }, { model: db.Medium, as: 'medium' }],
    };
    options.where = { ...options.where, admin_id: req.userId };
    // Add filtering conditions
    if (classId) {
      options.where = { ...options.where, class_id: classId };
    }
    if (mediumId) {
      options.where = { ...options.where, medium_id: mediumId };
    }
    if (searchText && searchText.length > 0) {
      options.where = {
        ...options.where,
        [db.Sequelize.Op.or]: [
          { first_name: { [db.Sequelize.Op.like]: `%${searchText}%` } },
          { last_name: { [db.Sequelize.Op.like]: `%${searchText}%` } },
          { roll_no: { [db.Sequelize.Op.like]: `%${searchText}%` } },
          // { parent_name: { [db.Sequelize.Op.like]: `%${searchText}%` } },
          { parent_phone: { [db.Sequelize.Op.like]: `%${searchText}%` } },
        ],
      };
    }

    // Add pagination options
    if (start && limit) {
      options.offset = parseInt(start);
      options.limit = parseInt(limit);
    }

    options.where = { ...options.where, pass_status: null };

    const students = await db.Student.findAll(options);
    res.json(students);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};


// Get a student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await db.Student.findOne({
      where: {
        id: req.params.id,
        admin_id: req.userId // Replace this with the actual admin_id value you want to filter with
      },
      include: [{ model: db.Standard, as: 'class' }, { model: db.Medium, as: 'medium' }],
    });

    // const student = await db.Student.findByPk(req.params.id, {
    //   include: [{ model: db.Standard, as: 'class' }], // Include the "class" association
    // });
    if (student) {

      if(student.student_image){
        fs.readFile(student.student_image, async (err, data) => {
          if (err) {
            console.error('Error reading image:', err);
          } 

          const thumbnailData = await sharp(data,{ failOnError: false })
              .resize({ width: 100, height: 100 }) // Adjust thumbnail size as needed
              .toBuffer();

          const base64Image = Buffer.from(thumbnailData).toString('base64');
          //student.student_image_base64 = base64Image;

          const resData = {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            roll_no: student.roll_no,
            parent_name: student.parent_name,
            gender: student.gender,
            dob: student.dob,
            parent_email: student.parent_email,
            parent_phone: student.parent_phone,
            address: student.address,
            class_id: student.class_id,
            medium_id: student.medium_id,
            admin_id: student.admin_id,
            section: student.section,
            admission_no: student.admission_no,
            sr_no: student.sr_no,
            pass_status: student.pass_status,
            joining_date: student.joining_date,
            student_image_thumbnail: base64Image,
            face_id: student.face_id,
            class: {
                id: student.class?.id,
                class_name: student.class?.class_name,
                order: student.class?.order,
                admin_id:student.class?.admin_id,
                session_id: student.class?.session_id,
            },
            medium: student.medium,
        }
          res.json(resData);
        });
      }else{
        res.json(student);
      }

    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Promote  students
exports.promoteStudents = async (req, res) => {
  const { studentIds } = req.body;

  try {
    // Fetch all students with the provided studentIds
    const students = await db.Student.findAll({
      where: {
        id: studentIds,
        admin_id: req.userId,
      },
      include: [
        {
          model: db.Standard,
          as: 'class',
          attributes: ['id', 'order'], // Include only 'id' and 'order' columns from the Standard table
        },
      ],
    });

    // Loop through each student to update class_id
    for (const student of students) {
      const currentOrder = student.class.order;
      // Find the Standard with the order value one higher than the current student's class order
      const nextStandard = await db.Standard.findOne({
        where: {
          admin_id:req.userId,
          order: currentOrder + 1,
        },
      });

      if (nextStandard) {
        // If there is a nextStandard, update the student's class_id with the nextStandard's id
        await student.update({
          class_id: nextStandard.id,
        });
      } else {
        // If there is no higher standard, update the student's pass_status to 'passed'
        await student.update({ pass_status: 'passed' });
      }
    }

    res.json({ message: 'Standard updated successfully' });
  } catch (error) {
    console.error('Error updating class_id:', error);
    res.status(500).json({ error: 'Error updating class_id' });
  }
};

// Delete a student
exports.inactiveStudent = async (req, res) => {
  try {
    const student = await db.Student.findOne({
      where: {
        id: req.params.id,
        admin_id: req.userId // Replace this with the actual admin_id value you want to filter with
      }
    });
    if (student) {
      student.pass_status = 'passed';
      await student.save();
      res.json({ message: 'Student deleted successfully' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// student counts
exports.getStudentsCount = async (req, res) => {
  try {
    // Retrieve the adminId from the request (assuming it's available)
    const adminId = req.userId;

    // Use Sequelize's count method to count the number of students with the specified admin_id
    const studentCount = await db.Student.count({
      where: { admin_id: adminId, pass_status: null }
    });

    // Send the count as a JSON response
    res.json({ studentCount: studentCount });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await db.Student.findOne({
      where: {
        id: req.params.id,
        admin_id: req.userId // Replace this with the actual admin_id value you want to filter with
      }
    });
    if (student) {
      await student.destroy();
      res.json({ message: 'Student deleted successfully' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a student
exports.deleteBulk = async (req, res) => {
  try {
    const { ids } = req.body; // Assuming you send an array of IDs in the request body
    await db.Student.update(
      { pass_status: 'deleted' },
      {
        where: {
          id: ids,
        },
      }
    );
    res.status(200).json({ message: 'Students deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
