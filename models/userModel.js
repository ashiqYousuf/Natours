const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true , 'A user must have a name'],
    },
    email: {
        type: String,
        required: [true , 'A user must have an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail , 'Please provide a valid email']
    },
    photo: {
        type: String,
    },
    password: {
        type: String,
        required: [true , 'Please provide a password'],
        minlength: 8,
        select:false,
    },
    passwordConfirm: {
        type: String,
        required: [true , 'Please confirm your password'],
        validate: {
            // this works only on CREATE & SAVE! So we cant use findByIdAndUpdate to update the user
            validator: function(el) {
                return el === this.password;  // nick12 === nick12
            },
            message: 'Passwords are not the same',
        }
    },
    passwordChangedAt: {
        type: Date,
    },
});


// ^Encrypting Passwords using preSave Middleware

userSchema.pre('save' , async function(next) {
    // *If password isn't modified call next middleware and return
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password , 12);
    this.passwordConfirm = undefined; // *Delete passwordConfirm and do not save it in DB
    next();
});


// *Instance method is a method thats available for all the documents of a certain collection
// *schema.methods.methodname

userSchema.methods.correctPassword = async function(candidatePassword , userPassword) {
    // *this keyword points to the current document
    // *this.password isn't available here as we put select: false for it
    // *candidatePassword is coming from User Input
    return await bcrypt.compare(candidatePassword , userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000 , 10);
        return JWTTimestamp < changedTimestamp; // 01-01-2022 < 01-01-2023 true
    }
    // *False means not changed
    return false;
};


const User = mongoose.model('User' , userSchema);
module.exports = User;
