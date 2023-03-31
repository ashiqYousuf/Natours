const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');


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
