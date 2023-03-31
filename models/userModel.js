const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    role: {
        type: String,
        enum: ['user' , 'guide' , 'lead-guide' , 'admin'],
        default: 'user',
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
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    }
});


// ^Encrypting Passwords using preSave Middleware

userSchema.pre('save' , async function(next) {
    // *If password isn't modified call next middleware and return
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password , 12);
    this.passwordConfirm = undefined; // *Delete passwordConfirm and do not save it in DB
    next();
});


userSchema.pre('save' , function (next){
    // *If the password isnt modified || if its the new document do not do anything
    if(!this.isModified('password') || this.isNew) return next();
    // *Sometimes DB save operations are slow (token is created but data is not yet saved in the DB)
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// *Query Middleware: this points to current Query
userSchema.pre(/^find/ , function(next) {
    this.find({active: { $ne: false}});
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

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // & 10 Minutes from now
    // *Store encrypted token in DB and send plain token via email [For Security Purposes]
    return resetToken;
};


const User = mongoose.model('User' , userSchema);
module.exports = User;
