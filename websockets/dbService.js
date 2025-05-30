const db = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config'); // Replace this with your secret key

exports.validateAuthToken = async (socket,token,next) => {

    try{
    jwt.verify(token, SECRET_KEY, async (err, decodedToken) => {
        if (err) {
          console.log("jwt not authenticated",err);
          return next(new Error('Socket authentication failed - invalid jwt'));
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
            return next(new Error('Socket authentication failed - payment'));
        }else{
            socket.sessionId = session.id;
        }
        return next();
        
      });
    }catch(err){
        console.log("jwt error",err.message);
        return next(new Error('Socket authentication failed - jwt error'));
    }


    // const user = await db.User.findOne({ where: {auth_token_socket:token} });
    // if(user){
    //     console.log("user",user);
    //     socket.userId = user.admin_id;
    //     const currentDate = new Date().toISOString().slice(0, 10);

    //     const session = await  db.Session.findOne({
    //     where: {
    //         admin_id: user.admin_id,
    //         start_date: { [Op.lte]: currentDate },
    //         end_date: { [Op.gte]: currentDate },
    //     },
    //     attributes: ['id','paid_status'],
    //     });
        
    //     if (!session || session.paid_status !== 'paid') {
    //         return false
    //     }else{
    //         socket.sessionId = session.id;
    //     }
    //     return user;
    //     }

    // return false;
}

exports.markAttendance = async (params) => {
    const student = await db.Student.findOne({ where: {id:id}});
    //if(student)

}