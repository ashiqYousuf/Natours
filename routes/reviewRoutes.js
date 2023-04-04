const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const express = require('express');


const router = express.Router({ mergeParams: true });


// todo POST: api/v1/tours/tourId/reviews
// todo GET: api/v1/tours/tourId/reviews

// ^ api/v1/reviews
// ^ api/v1/reviews/reviewId

router.route('/')
.get(reviewController.getAllReviews)
.post(authController.protect , authController.restrictTo('user' , 'guide') , reviewController.setTourUserIds , reviewController.createReview);

router.route('/:id')
.get(reviewController.getReview)
.delete(reviewController.deleteReview)
.patch(reviewController.updateReview)

module.exports = router;
