const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllReviews = async (req , res , next) => {
    try{
        const reviews = await Review.find();
        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: reviews,
        });
    } catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.createReview = async (req , res , next) => {
    try{
        if(!req.body.tour) req.body.tour = req.params.tourId;
        if(!req.body.user) req.body.user = req.user._id;
         
        const newReview = await Review.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                review: newReview,
            },
        });
    }catch(err){
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};
