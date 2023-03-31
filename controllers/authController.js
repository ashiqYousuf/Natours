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
    // *Remove Passwords from displaying
    user.password = undefined;
    user.active = undefined;

    res.status(201).json({
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
        // *Login the new Signed User automatically after signup is complete
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
        createSendToken(user , 200 , res);
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
        // *^ Grant access to the protected route and store user in the req object to be used in further middlewares (for Authorization or other purposes)
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
    // *We can't directly pass args to the middleware functions , to do so we need a wrapper func returing a middleware func
    return (req , res , next) => {
        // roles: ['admin' ,'lead-guide']
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You are not authorized to delete a tour' , 403));
        }
        next();
    }
};



exports.forgotPassword = async (req , res , next) => {
    try{
        // ^ Get user on Email
        const user = await User.findOne({email: req.body.email});
        if(!user) {
            return next(new AppError('Please provide a valid email address' , 404));
        }
        // ^ Generate a Random Token
        const resetToken = user.createPasswordResetToken();
        // *IMP: Deactivate all Schema validators before saving a User
        await user.save({ validateBeforeSave: false});
        // ^ Send it to user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        const message = `To reset your password please click the link sent to your email address ${resetURL}\n.If you did'nt requested for password reset please ignore the message.`;

        try{
            await sendEmail({
                email: req.body.email, // & OR user.email
                subject: 'Reset your password',
                message: message,
            });
        } catch(err) {
            // *Reset both token and expires property
            console.log(err);
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
        console.log(err.message)
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.resetPassword = async (req , res , next) => {
    try{
        // ^Get user based on the token (Encrypt the token first as we have stored encrypted token in the DB)
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ passwordResetToken: hashedToken , passwordResetExpires: { $gt: Date.now() } });
        // ^If the token has not expired and user is there then set new password
        if(!user) {
            return next(new AppError('Invalid or expired token' , 400));
        }
        // ^Update passwordChangeAt property for the user
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        // ^Log the user in , send JWT to the client
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
        // ^ Get the user from collection
        const user = await User.findById(req.user._id).select('+password');        
        // ^ Check if the posted password is correct
        if(! (await user.correctPassword(req.body.passwordCurrent , user.password))){
            return next(new AppError('Your entered a wrong password!' , 401));
        }
        // ^ Update the password
        // * not use User.findByIdAndUpdate(...) as validators wont work as they are critical for passwords validation
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save(); 
        // ^ Log the user In , send JWT to the user(client)
        createSendToken(user , 200 , res);
    }catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};
