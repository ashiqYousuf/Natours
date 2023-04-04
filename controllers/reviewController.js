const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req , res , next) => {
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user._id;
    next();
}

exports.getAllReviews = factory.getAll(Review);
// ^ Create review needs tourId and userId so to use GENERIC FACTORY FUNCTION for creating Reviews we'll run a Middleware function that sets the tourId and userId on req.body before actually invoking the Create Document Factory Function
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
