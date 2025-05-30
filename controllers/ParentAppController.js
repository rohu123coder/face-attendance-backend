const db = require('../models');
const multer = require('multer');
const path = require('path');
var fs = require('fs');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const student = require('../models/student');


class ParentAppController {
  
async getStudentsByParentId(req, res) {
    //req.parentId = 3
  try {
    
    const parent = await db.Parent.findOne({
      where: {
        id: req.parentId,
      },
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const parentAssoc = await db.ParentAssoc.findAll({
      where: {
        parent_id: parent.id,
      },
    });

    const studentIds = parentAssoc.map((assoc) => assoc.student_id);

    const students = await db.Student.findAll({
      where: {
        id: studentIds,
        pass_status: null
      },
      include: [{ model: db.Standard, as: 'class' }, { model: db.Medium, as: 'medium' }],
      raw: true,
      nest: true,
    });

    const studentResponse = [];

    await Promise.all(students.map(async student => {
      if(student.student_image){
         const data =  fs.readFileSync(student.student_image);
         const thumbnailData = await sharp(data,{ failOnError: false }).resize({ width: 100, height: 100 }).toBuffer();
         const base64Image = Buffer.from(thumbnailData).toString('base64');
         studentResponse.push(Object.assign(student, {student_image_thumbnail: base64Image}));
      }else{
        studentResponse.push(student);
      }
    }));

    console.log('studentData',studentResponse)

    res.json(studentResponse);

  } catch (err) {
    console.log('error',err.message)
    res.status(500).json({ code: 'controller',error: err.message });
  }
}

 async getAllAttendanceByStudent(req, res) {
    try {
      const studentId = req.params.id;
      const attendances = await db.StudentAttendance.findAll({ where: { student_id: studentId } });
      res.json(attendances);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateDeviceToken(req, res) {
    try {
     
      console.log("parentID",req.parentId);
      console.log(req.body)

      const parent = await db.Parent.findOne({
        where: {
          id: req.parentId,
        },
      });
  
      if (!parent) {
        return res.status(404).json({ error: 'Parent not found' });
      }

      // Update the deviceToken field
    parent.device_token = req.body.deviceToken;
    await parent.save();

    res.status(200).json({ message: 'Device token updated successfully' });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateStudentImage(req, res) {
    try {
      console.log(req.params)

      if(!req.params.id)
        return res.status(401).json({ error: 'Invalid params' });

      const { id } = req.params;

      const {adminId} = req.userId;
      const existingStudent = await db.Student.findOne({
        where: {
          id: id,
        },
      });

      if (!existingStudent) {
        return res.status(401).json({ error: 'Student not found' });
      }

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
          console.log("values", file);
  
          // check all constraint here like no params duplicate params etc
          const faceId = existingStudent.face_id;
          const first_name = existingStudent.first_name;
          const last_name = existingStudent.last_name;
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
          cb(null, (Math.floor(Math.random() * 10000) + 1) + path.extname(file.originalname));
        }
      });

      let upload = multer({ storage: storage, fileFilter: fileFilter }).single('student_image');

      upload(req, res, async function (err) {
        console.log(req?.file?.fieldname)

        if (req.fileValidationError) {
          console.log(req.fileValidationError)
          return res.status(401).json({ error: req.fileValidationError });
        }
        else if (!req.file) {
          console.log("no file")
          return res.status(400).json({ error: 'No file uploaded.' });
        }

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
          existingStudent.student_image = req.file.path; // Set the path of the new image
        }

        //existingStudent.student_image = req.file.path;
        existingStudent.save();

        res.status(200).json({ message: 'Excel sheet processed successfully.' });
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getProfileInfo(req, res) {
    try {
     
      console.log("parentID",req.parentId);
      console.log(req.body)

      const parent = await db.Parent.findOne({
        where: {
          id: req.parentId,
        },
      });

      const user = await db.Parent.findOne({
        where: {
          id: req.userId,
        },
      });
  
      if (!parent) {
        return res.status(404).json({ error: 'Parent not found' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      let userData = {
        entity: user.entity_name,
        
      }

      res.status(200).json({ user: user });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

};

module.exports = new ParentAppController();
