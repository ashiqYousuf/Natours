const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// *No REST pattern (Intutive)

// *NOTE authController.protect will check if the User is Authenticated , if so it'll put the user on the request object

router.post('/signup' , authController.signup);
router.post('/login' , authController.login);

router.post('/forgotPassword' , authController.forgotPassword);
router.patch('/resetPassword/:token' , authController.resetPassword);
router.patch('/updatePassword' , authController.protect , authController.updatePassword);

router.patch('/updateMe' , authController.protect , userController.updateMe);
router.delete('/deleteMe' , authController.protect , userController.deleteMe);

// ^Follows REST design

router.route('/')
.get(userController.getAllUsers)
.post(userController.createUser);
router.route('/:id').
get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);


module.exports = router;
