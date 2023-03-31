const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// & Object.keys(obj) returns array of keys in the obj

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

exports.getAllUsers = async (req , res , next) => {
    try{
        const users = await User.find();
        res.status(404).json({
            status: "success",
            results: users.length,
            data: {
                users,
            }
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

// *Authenticated User is updating His Profile

exports.updateMe = async (req , res , next) => {
    try{
        // *Create Error if user posts password data
        if(req.body.password || req.body.passwordConfirm) {
            return next(new AppError('You can not update your password here' , 400));
        }
        // *Update User document don't use save() method as it'll run password validators which are not required here
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
}


exports.createUser = (req , res) => {
    res.status(404).json({
        status: "fail",
        message: "This route is yet to be defined"
    });
};

exports.getUser = (req , res) => {
    res.status(404).json({
        status: "fail",
        message: "This route is yet to be defined"
    });
};

exports.updateUser = (req , res) => {
    res.status(404).json({
        status: "fail",
        message: "This route is yet to be defined"
    });
};

exports.deleteUser = (req , res) => {
    res.status(404).json({
        status: "fail",
        message: "This route is yet to be defined"
    });
};
