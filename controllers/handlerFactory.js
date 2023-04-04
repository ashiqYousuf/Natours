const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

// * GENERIC DELETE HANDLER FOR CRUD OPERATIONS [TOUR | REVIEW | USER] (MODEL)
// & Factory functions return Handler Function (Actual CRUD functions)

exports.deleteOne = (Model) => {
    return (
        async(req , res , next) => {
            try{
                const doc = await Model.findByIdAndDelete(req.params.id);
                if(!doc){
                    return next(new AppError('No document found with that ID' , 404));
                }
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
        }
    );
};


exports.updateOne = (Model) => {
    return (
        async(req , res , next) => {
            try{
                const doc = await Model.findByIdAndUpdate(req.params.id , req.body , {
                    new: true,
                    runValidators: true,
                });
                if(!doc){
                    return next(new AppError('No document found with that ID' , 404));
                }
                res.status(200).json({
                    status: 'success',
                    data: {
                        data: doc,
                    }
                });
            } catch(err) {
                res.status(404).json({
                    status: 'fail',
                    message: err,
                });
            }
        }
    );
};


exports.createOne = (Model) => {
    return (
        catchAsync(async(req , res , next) => {
            const newDoc = await Model.create(req.body);
            res.status(201).json({
                status: 'success',
                data: {
                    data: newDoc,
                }
            });
        })
    );
};


// * We need populate argument also with Model bcz some of our Models need to populate the Referenced Documents also

exports.getOne = (Model , popOptions) => {
    return (
        async(req , res) => {
            try{
                let query = Model.findById(req.params.id);
                if(popOptions) {
                    query = query.populate(popOptions);
                }
                const doc = await query;
                if(!doc){
                    return next(new AppError('No document found with that ID' , 404));
                }
                res.status(200).json({
                    status: 'success',
                    data: {
                        data: doc,
                    }
                });
            } catch(err) {
                res.status(404).json({
                    status: 'fail',
                    message: err,
                });
            }
        }
    );
};


exports.getAll = (Model) => {
    return (
        async(req , res) => {
            try{
                // ^ To allow for nested GET reviews on tour (small hack)
                let filter = {};
                if(req.params.tourId) {
                    // * Query: Get all reviews where tour = req.params.tourId
                    filter = { tour: req.params.tourId };
                }
                // *BUILD THE QUERY
                const features = new APIFeatures(Model.find(filter) , req.query).filter().sort().limitFields().paginate();
                // *EXECUTE THE QUERY
                const docs = await features.query;
        
                res.status(200).json({
                    status: 'success',
                    results: docs.length,
                    data: {
                        data: docs,
                    }
                });
            } catch(err) {
                res.status(400).json({
                    status: 'fail',
                    message: err,
                });
            }
        }
    );
};
