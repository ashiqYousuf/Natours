const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

// *MIDDLEWARE

exports.aliasTopTours = (req , res , next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summay,difficulty';
    next();
};


// * TOUR ROUTE HANDLERS

exports.createTour = catchAsync(async(req , res , next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour,
        }
    });
});


exports.getAllTours = async(req , res) => {
    try{
        // *BUILD THE QUERY
        const features = new APIFeatures(Tour.find() , req.query).filter().sort().limitFields().paginate();
        // *EXECUTE THE QUERY
        const tours = await features.query;

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.getTour = async(req , res) => {
    try{
        const tour = await Tour.findById(req.params.id).populate('reviews');
        res.status(200).json({
            status: 'success',
            data: {
                tour,
            }
        });
    } catch(err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};



exports.updateTour = async(req , res) => {
    try{
        const tour = await Tour.findByIdAndUpdate(req.params.id , req.body , {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            status: 'success',
            data: {
                tour,
            }
        });
    } catch(err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.deleteTour = async(req , res) => {
    try{
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


// * AGGREGATION PIPELINE [Doing a Regular Query + We can manipulate data in a couple of steps]

exports.getTourStats = async (req , res) => {
    try{
        const stats = await Tour.aggregate([
            // ^ Array: Denotes Stages for a Document to pass through
            {
                $match: { ratingsAverage: {$gte: 4.5}},
            },
            {
                $group: {
                    // _id: { $toUpper: '$difficulty' },
                    _id: '$difficulty',
                    numRatings: { $sum: '$ratingsQuantity' },
                    // *numTours: #(tours) documents in our collection
                    // &For each document add 1
                    numTours: { $sum: 1 },
                    avgRating: { $avg: '$ratingsAverage'},
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                }
            },
            {
                // *Note mention field names already in the GROUP not other names
                $sort: { avgPrice: 1 },
            },
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                stats,
            }
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};


exports.getMonthlyPlan = async (req , res) => {
    try{
        const year = req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates',
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    },
                }
            },
            {
                $group: {
                    // ^ GROUP BY MONTH and Find number of tours in that month and other related information
                    _id: { $month: '$startDates'},
                    numTourStarts: { $sum: 1},
                    // *Get Tours in the each Month as Array
                    tours: { $push: '$name' }
                }
            },
            {
                $addFields: { month: '$_id' },
            },
            {
                $project: {
                    _id: 0,
                }
            },
            {
                $sort: { numTourStarts: -1}
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                plan,
            }
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};
