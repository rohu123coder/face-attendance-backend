const excel = require('exceljs');
const db = require('../models');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');

class ExcelController {

   generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-+=<>?';
    let randomString = '';
  
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
  
    return randomString;
  }

  async createStudent(worksheet,rowNumber,userId) {
    const transaction = await db.sequelize.transaction();
    const excelController = new ExcelController();
    try {
      const row = worksheet.getRow(rowNumber);

      // Extract data from each column
      const [
        s_no,
        first_name,
        last_name,
        section,
        medium,
        standard,
        admission_no,
        roll_no,
        sr_no,
        gender,
        dob,
        joining_date,
        address,
        parent_name,
        parent_phone,
        parent_email,
      ] = row.values;


      console.log("add",row.values);

      // Find the medium_id and standard_id
      const mediumData = await db.Medium.findOne({ where: { type: medium } });
      const standardData = await db.Standard.findOne({ where: { class_name: standard } });

      const faceId = excelController.generateRandomString(20)

      // Create a new entry in the Students table
      let student = await db.Student.create({
        first_name,
        last_name,
        section,
        admission_no,
        roll_no,
        sr_no,
        gender,
        dob,
        joining_date,
        address,
        medium_id: mediumData ? mediumData.id : null,
        class_id: standardData ? standardData.id : null,
        parent_name:parent_name,
        parent_email:parent_email? parent_email?.text:null,
        parent_phone:parent_phone,
        admin_id:userId,
        face_id:faceId,
      }, { transaction });

      // Check if a parent with the provided parent_phone exists
      const existingParent = await db.Parent.findOne({
        where: { username: parent_phone },
        transaction,
      });
      console.log('existingParent', existingParent)

      // If a parent with the same phone number doesn't exist, create a new parent
      let parent;
      if (!existingParent) {
        // Hash the parent's password using bcrypt
        console.log('parent_phone',parent_phone.toString());
        const hashedPassword = await bcrypt.hash(parent_phone.toString(), 10);

        try {

          parent = await db.Parent.create({
            name: parent_name,
            email: parent_email,
            phone: parent_phone,
            username: parent_phone,
            password: hashedPassword,
            admin_id: userId,
            transaction,
          });
        } catch (err) {

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
    } catch (e) {
      console.error("row error:", e.message)
      await transaction.rollback();
    }
  }

  static async downloadSampleExcel(req, res) {
    try {
      console.log("we are here at download sample")
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('SampleSheet');

      // Add headers
      worksheet.addRow([
        'First Name',
        'Last Name',
        'Section',
        'Medium',
        'Standard',
        'Admission No',
        'Roll No',
        'Sr No',
        'Gender',
        'DOB',
        'Joining Date',
        'Address',
        'Parent Name',
        'Parent Phone',
        'Parent Email',
      ]);

      // Fetch the medium options based on admin_id
      const mediumOptions = await db.Medium.findAll({
        where: { admin_id: req.userId },
        attributes: ['type'],
        raw: true,
      });

      // Fetch the standard options based on admin_id
      const standardOptions = await db.Standard.findAll({
        where: { admin_id: req.userId },
        attributes: ['class_name'],
        raw: true,
      });

      // worksheet.getCell('D').dataValidation = {
      //   type: 'list',
      //   allowBlank: false,
      //   formulae: mediumOptions
      // }

      // worksheet.getCell('E').dataValidation = {
      //   type: 'list',
      //   allowBlank: false,
      //   formulae: standardOptions
      // }

      // Set data validation for the "Medium" column
      worksheet.getColumn('D').eachCell((cell, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const validationRule = {
            type: 'list',
            //formulae: '"' + mediumOptions.map(option => option.type).join(',') + '"',
            formulae: ["Hindi", "English"]
          };
          cell.dataValidation = validationRule;
        }
      });

      // // Set data validation for the "Standard" column
      // worksheet.getColumn('E').eachCell((cell, rowNumber) => {
      //   if (rowNumber > 1) { // Skip header row
      //     const validationRule = {
      //       type: 'list',
      //       formula1: '"' + standardOptions.map(option => option.class_name).join(',') + '"',
      //     };
      //     cell.dataValidation = validationRule;
      //   }
      // });


      // // Set the data validation for the "Medium" and "Standard" columns
      // worksheet.getColumn('D').eachCell({ includeEmpty: true }, cell => {
      //   cell.dataValidation = mediumDropdown;
      // });

      // worksheet.getColumn('E').eachCell({ includeEmpty: true }, cell => {
      //   cell.dataValidation = standardDropdown;
      // });

      // Set the response headers for the download
      res.setHeader('Content-Disposition', 'attachment; filename=sample-excel.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Send the workbook as a download
      workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } catch (error) {
      console.error('Error generating sample Excel file:', error);
      res.status(500).json({ error: 'Error generating sample Excel file' });
    }
  }

  static async uploadStudentsExcel(req, res) {
    try {

      const storage = multer.memoryStorage();
      let upload = multer({ storage: storage, fileFilter: null }).single('excel_sheet');

      // const userData = await db.User.findOne({where: {admin_id: req.userId}});
      // const studentLimit = userData.student_limit;
      // const studentCount = await db.Student.count({where: {admin_id: req.userId}});


      upload(req, res, async function (err) {
        console.log(req?.file?.fieldname)

        if (req.fileValidationError) {
          return res.status(401).json({ error: req.fileValidationError });
        }
        else if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Access the file content as a Buffer
        const fileContent = req.file.buffer;

        const workbook = new excel.Workbook();
        await workbook.xlsx.load(fileContent);

        const worksheet = workbook.getWorksheet(1); // Assuming the sheet is the first one
        const excelController = new ExcelController();

        // if(studentCount + (worksheet.rowCount -1) > studentLimit){
        //   let exceededCount = (studentCount + worksheet.rowCount -1) - studentLimit
        //   return res.status(401).json({ error: `student limit exceeded by ${exceededCount.toString()}` });
        // }


        // Skip the first row (headers)
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
          await excelController.createStudent(worksheet,rowNumber,req.userId)
        }
        
        res.status(200).json({ message: 'Excel sheet processed successfully.' });

      });

    } catch (error) {
      console.error('Error uploading Excel sheet:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };

 


}

module.exports = ExcelController;
