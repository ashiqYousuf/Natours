const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();

// *Param Middleware which runs for param id in the url & it would'nt run for any other router it's specific to the tourRoutes

// router.param('id' , tourController.checkID);

// *Make a seperate route for Top 5 cheap tours (Don't make a seperate function , run middleware to modify req.query)
router.route('/top-5-cheap').get(tourController.aliasTopTours ,tourController.getAllTours)
// *Adding More Functionality and Flexibility in Search
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);


router.route('/')
// ^Protect your route
.get(authController.protect , tourController.getAllTours)
.post(tourController.createTour);


router.route('/:id')
.get(tourController.getTour)
.patch(tourController.updateTour)
// ^Protect your route (Authentication) and restrict certain activities to admin and lead-guide users only (Authorization)
.delete(authController.protect , authController.restrictTo('admin' , 'lead-guide') , tourController.deleteTour);

module.exports = router;
