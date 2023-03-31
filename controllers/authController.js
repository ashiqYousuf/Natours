const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util');


const signToken = (id) => {
    return jwt.sign({ id: id } , process.env.JWT_SECRET , {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};


exports.signup = async (req , res , next) => {
    try{
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt
        });
        // *Login the new Signed User automatically after signup is complete
        const token = signToken(newUser._id);
        res.status(201).json({
            status: 'success',
            token: token,
            data: {
                user: newUser,
            }
        });
    } catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.login = async (req , res , next) => {
    try{
        const { email , password } = req.body;
    // *1. Check if email and password exists
        if(!email || !password) {
            return next(new AppError('Please provide email and password' , 400));
        }
        // *2. Check if the user exists & password is correct
        // &Since in Schema we set password{ select: false } so we explicitly add password to be sent to the client
        const user = await User.findOne({email: email}).select('+password');
        if(!user || !await user.correctPassword(password , user.password)) {
            return next(new AppError('Incorrect email or password' , 401));
        }
        // *3. If everything is OK , send token to client
        const token = signToken(user._id);
        res.status(200).json({
            status: 'success',
            token,
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

// *Middleware used to protect the routes

exports.protect = async (req , res ,next) => {
    try{
        // *1 Get the token if its there
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if(!token) {
            return next(new AppError('You are not logged in!' , 401));
        }
        // *2 verify the token
        const decoded = await promisify(jwt.verify)(token , process.env.JWT_SECRET);
        // *3 Check if User still exists
        const currentUser = await User.findById(decoded.id);
        if(!currentUser) {
            return next(new AppError('The user belonging to this token does not exist' , 401));
        }
        // *4 Check if the user changed password after the token was issued
        if(currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please login again.' , 401));
        }
        // *5 Grant access to the protected route
        req.user = currentUser;
        next();
    }catch(err){
        res.status(401).json({
            status: 'fail',
            message: 'Invalid token. Please login again',
        });
    }
};
