const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


const filterObj = (obj , ...allowedFields) => {
    let newObj = {};
    Object.keys(obj).forEach((el) => {
        if(allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};


// *USER ROUTE HANDLERS

exports.getAllUsers = factory.getAll(User);

exports.updateMe = async (req , res , next) => {
    try{
        if(req.body.password || req.body.passwordConfirm) {
            return next(new AppError('You can not update your password here' , 400));
        }
        const filteredBody = filterObj(req.body , 'name' , 'email');
        const updatedUser = await User.findByIdAndUpdate(req.user._id , filteredBody , {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
            }
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.getMe = (req , res , next) => {
    req.params.id = req.user._id;
    next();
};

exports.deleteMe = async (req , res , next) => {
    try{
        await User.findByIdAndUpdate(req.user._id , {active: false});
        res.status(204).json({
            status: 'success',
            data: null,
        });
    }catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


// * BELOW ARE USER METHODS FOR ADMIN PURPOSE ONLY

exports.createUser = (req , res) => {
    res.status(404).json({
        status: "fail",
        message: "Please go to the SIGNUP route instead"
    });
};

exports.getUser = factory.getOne(User);
// * Do not update passwords with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
