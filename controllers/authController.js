const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');


const signToken = (id) => {
    return jwt.sign({ id: id } , process.env.JWT_SECRET , {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};


const createSendToken = (user , statusCode , res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res.cookie('jwt' , token , cookieOptions);
    user.password = undefined;
    user.active = undefined;

    res.status(statusCode).json({
        status: 'success',
        token: token,
        data: {
            user,
        }
    }); 
};


exports.signup = async (req , res , next) => {
    try{
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
        });
        createSendToken(newUser , 201 , res);
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
        if(!email || !password) {
            return next(new AppError('Please provide email and password' , 400));
        }
        const user = await User.findOne({email: email}).select('+password');
        if(!user || !await user.correctPassword(password , user.password)) {
            return next(new AppError('Incorrect email or password' , 401));
        }
        createSendToken(user , 200 , res);
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.protect = async (req , res ,next) => {
    try{
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if(!token) {
            return next(new AppError('You are not logged in!' , 401));
        }
        const decoded = await promisify(jwt.verify)(token , process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        if(!currentUser) {
            return next(new AppError('The user belonging to this token does not exist' , 401));
        }
        if(currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please login again.' , 401));
        }
        req.user = currentUser;
        next();
    }catch(err){
        res.status(401).json({
            status: 'fail',
            message: 'Invalid token. Please login again',
        });
    }
};


exports.restrictTo = (...roles) => {
    return (req , res , next) => {
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You are not authorized to delete a tour' , 403));
        }
        next();
    }
};


exports.forgotPassword = async (req , res , next) => {
    try{
        const user = await User.findOne({email: req.body.email});
        if(!user) {
            return next(new AppError('Please provide a valid email address' , 404));
        }
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false});
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        const message = `To reset your password please click the link sent to your email address ${resetURL}\n.If you did'nt requested for password reset please ignore the message.`;

        try{
            await sendEmail({
                email: req.body.email, // & OR user.email
                subject: 'Reset your password',
                message: message,
            });
        } catch(err) {
            user.createPasswordResetToken = undefined;
            user.createPasswordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new AppError('There was an error while sending email.Please try again',500));
        }
        res.status(200).json({
            status: 'success',
            message: 'Password reset link has been sent to your email address',
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.resetPassword = async (req , res , next) => {
    try{
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ passwordResetToken: hashedToken , passwordResetExpires: { $gt: Date.now() } });
        if(!user) {
            return next(new AppError('Invalid or expired token' , 400));
        }
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        createSendToken(user , 200 , res);
    } catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.updatePassword = async (req , res , next) =>{
    try{
        const user = await User.findById(req.user._id).select('+password');        
        if(! (await user.correctPassword(req.body.passwordCurrent , user.password))){
            return next(new AppError('Your entered a wrong password!' , 401));
        }
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save(); 
        createSendToken(user , 200 , res);
    }catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};
