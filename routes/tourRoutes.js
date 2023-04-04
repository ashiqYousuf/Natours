const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');


const router = express.Router();

// *Param Middleware which runs for param id in the url & it would'nt run for any other router it's specific to the tourRoutes

// router.param('id' , tourController.checkID);

// * Exactly Mounting a Router
router.use('/:tourId/reviews' , reviewRouter);


router.route('/top-5-cheap').get(tourController.aliasTopTours ,tourController.getAllTours)
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);


router.route('/')
.get(authController.protect , tourController.getAllTours)
.post(tourController.createTour);


router.route('/:id')
.get(tourController.getTour)
.patch(tourController.updateTour)
.delete(authController.protect , authController.restrictTo('admin' , 'lead-guide' , 'guide') , tourController.deleteTour);

module.exports = router;
