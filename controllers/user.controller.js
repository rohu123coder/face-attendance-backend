const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const userService = require('services/user.service');
const path = require('path');
const XLSX = require('xlsx');
const xlsxFile = require('read-excel-file/node');


// authenticate,
//     getAll,
//     getById,
//     updatefields,
//     update,
//     updatePassword,
//     logout,
//     delete: _delete

// routes
router.post('/authenticate', authenticateSchema, authenticate);``
router.post('/updatepassword', authorize(), updatePassword);

router.get('/', authorize(), getAll);
router.post('/logout', authorize(), logout);

router.post('/updatefields', authorize(), updatefields);
router.post('/updateforms', authorize(), updateforms);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

module.exports = router;

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => {res.json(user)})
        .catch(next);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(6).required(),
        role: Joi.number().required(),
    });
    validateRequest(req, next, schema);
}

function customerRegisterSchema(req, res, next) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(6).required(),
        role: Joi.number().required(),
        added_by:Joi.string().required(),
        business_name: Joi.string().required(),
        contact_name: Joi.string().required(),
        add1: Joi.string().required(),
        add2: Joi.allow(),
        phone1: Joi.string().required(),
        phone2: Joi.allow(),
        city: Joi.string().required(),
        postal : Joi.string().required(),
        province : Joi.string().required(),
        email : Joi.string().required(),
        notes: Joi.allow(),
        fields: Joi.string().required(),
        associate_fields: Joi.string().required(),
    });
    validateRequest(req, next, schema);
}

function customerUpdateSchema(req, res, next) {
    const schema = Joi.object({
        id: Joi.number().required(),
        customer_id: Joi.number().required(),
        username: Joi.string().required(),
        password: Joi.string().min(6).required(),
        role: Joi.number().required(),
        added_by:Joi.string().required(),
        business_name: Joi.string().required(),
        contact_name: Joi.string().required(),
        add1: Joi.string().required(),
        add2: Joi.allow(),
        phone1: Joi.string().required(),
        phone2: Joi.allow(),
        city: Joi.string().required(),
        postal : Joi.string().required(),
        province : Joi.string().required(),
        email : Joi.string().required(),
        notes: Joi.allow(),
        fields: Joi.string().required(),
        associate_fields: Joi.string().required(),
    });
    validateRequest(req, next, schema);
}

function employeeRegisterSchema(req, res, next) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(6).required(),
        role: Joi.number().required(),
        added_by:Joi.string().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        add1: Joi.string().required(),
        add2: Joi.allow(),
        phone1: Joi.string().required(),
        phone2: Joi.allow(),
        city:Joi.string().required(),
        postal : Joi.string().required(),
        province : Joi.string().required(),
        email : Joi.string().required(),
        notes: Joi.allow(),
        photo_path: Joi.allow(),
        access_type: Joi.allow(),
        access_time: Joi.allow(),
        assigned_customers: Joi.allow(),
        
    });
    validateRequest(req, next, schema);
}

function employeeUpdateSchema(req, res, next) {
    const schema = Joi.object({
        id: Joi.number().required(),
        employee_id: Joi.number().required(),
        username: Joi.string().required(),
        password: Joi.string().min(6).required(),
        role: Joi.number().required(),
        added_by:Joi.string().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        add1: Joi.string().required(),
        add2: Joi.allow(),
        phone1: Joi.string().required(),
        phone2: Joi.allow(),
        city:Joi.string().required(),
        postal : Joi.string().required(),
        province : Joi.string().required(),
        email : Joi.string().required(),
        notes: Joi.allow(),
        photo_path: Joi.allow(),
        access_type: Joi.allow(),
        access_time: Joi.allow(),
        assigned_customers: Joi.allow(),
        
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({ message: 'Registration successful' }))
        .catch(next);
}

function logout(req, res, next) {
    console.log(req.body);
    userService.logout(req.body)
        .then(() => res.json({ message: 'Logout successful' }))
        .catch(next);
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(next);
}

function getCurrent(req, res, next) {
    res.json(req.user);
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => res.json(user))
        .catch(next);
}


// function setOBCheckListData(req, res, next) {

//     try{
//         const fileFilter = (req, file, cb) => {
//             if (file.fieldname === "seal_image") { // if uploading resume
//               if (
//                 file.mimetype === 'image/png' ||
//                 file.mimetype === 'image/jpg' ||
//                 file.mimetype === 'image/jpeg'
//               ) { // check file type to be jpg, png, or jpeg
//                 cb(null, true);
//               } else {
//                 cb(null, false); // else fails
//               }
//             } else { // else uploading image
//               if (
//                 file.mimetype === 'image/png' ||
//                 file.mimetype === 'image/jpg' ||
//                 file.mimetype === 'image/jpeg'
//               ) { // check file type to be png, jpeg, or jpg
//                 cb(null, true);
//               } else {
//                 cb(null, false); // else fails
//               }
//             }
//           };

//         const storage = multer.diskStorage({

//             destination: function(req, file, cb) {
//                 if(file.fieldname==="seal_image"){
//                     cb(null, 'uploads/images/')
//                 }
//                 else if(file.fieldname==="gallery_images"){
//                     cb(null, 'uploads/images/');
//                 }
//             },
            
//             // By default, multer removes file extensions so let's add them back
//             filename: function(req, file, cb) {
//                 if(file.fieldname === "seal_image"){
//                     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//                 }
//                 else if(file.fieldname === "gallery_images"){
//                     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));                
//                 }
//             }
//         });

//         let upload = multer({ storage: storage, fileFilter: fileFilter }).fields(
//             [
//                 { name:'seal_image', maxCount:1 },
//                 { name:'gallery_images', maxCount:10 },
//             ]
//         );

//         upload(req,res,function(err){
//             console.log(req.body.data)
//             let seal_image = null;
//             let files = req.files;
//             let galleries = null; 
//             //console.log(files.seal_image[0].filename)
//             console.log(req.files)

//             if (req.fileValidationError) {
//                 return res.send(req.fileValidationError);
//             }
//             else if (err instanceof multer.MulterError) {
//                 return res.send(err);
//             }
//             else if (err) {
//                 return res.send(err);
//             }

//             if(files.gallery_images){
//                 galleries = []
//                 files?.gallery_images?.map( (value) => {
//                     galleries.push(value.filename)
//                 })
//             }

//             console.log('galleries',galleries)
//             console.log('seal_image',seal_image)

//             if(files.seal_image)
//                 seal_image = files.seal_image[0].filename
                
//             userService.setOBCheckListData(req.body.data,seal_image,galleries)
//                 .then(user => res.json(user))
//                 .catch(next);
//         })
//     }catch(e){console.log(err);next}

// }

// function getSpreadSheet(req, res, next) {
//     userService.getById(req.params.id)
//         .then(user => {
//             let fields = user.customer_details.fields;
//             let values = fields.split(',');
//             console.log(values);
//             const wb = XLSX.utils.book_new();
//             wb.SheetNames.push("Sample");
//             var ws_data = [values];  //a row with 2 columns
//             var ws = XLSX.utils.aoa_to_sheet(ws_data);
//             wb.Sheets["Sample"] = ws;
//             let name = process.cwd()+'/uploads/samples/'+ Date.now() + 'out.xlsx';
//             XLSX.writeFile(wb, name );
//             var wbout =  XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
//             res.download(name);
//         }).catch(next);
// }

function updateSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        username: Joi.string().empty(''),
        password: Joi.string().min(6).empty('')
    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then(user => res.json(user))
        .catch(next);
}

function updatefields(req, res, next) {
    userService.updatefields(req.params.id, req.body)
        .then(user => res.json(user))
        .catch(next);
}

function updatePassword(req, res, next) {
    userService.updatePassword(req.body)
        .then(user => res.json(user))
        .catch(next);
}


function updateforms(req, res, next) {

    try{
        const storage = multer.diskStorage({
            destination: function(req, file, cb) {
                cb(null, 'uploads/');
            },        
            // By default, multer removes file extensions so let's add them back
            filename: function(req, file, cb) {
                cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
            }
        });

        let upload = multer({ storage: storage, fileFilter: null }).single('excel_file');

        upload(req, res, function(err) {
            console.log(req?.file?.filename)
            
            if (req.fileValidationError) {
                return res.send(req.fileValidationError);
            }
            else if (!req.file) {
                return res.send(401,{message:'Please select an file to upload'});
            }
            else if (err instanceof multer.MulterError) {
                return res.send(err);
            }
            else if (err) {
                return res.send(err);
            }
    
            //res.send({"message":"file uploaded successfully"})
             userService.updateforms(req.body.cid, req.file.filename)
             .then(data => {
                res.json({"table_data":data})                
            }).catch(next);

        });
    }catch(e){next}
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({ message: 'User deleted successfully' }))
        .catch(next);
}