const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

const factory = require('./handlerFactory');
// *MIDDLEWARE

exports.aliasTopTours = (req , res , next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summay,difficulty';
    next();
};


// * TOUR ROUTE HANDLERS

exports.createTour = factory.createOne(Tour);


exports.getAllTours = factory.getAll(Tour);


exports.getTour = factory.getOne(Tour , { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

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
