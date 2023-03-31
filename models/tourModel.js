const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// *Creating Database Scheme

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required:[true , 'A tour must have a name'],
        unique: true,
        trim: true,
        maxLength: [40 , 'A tour name must have less or equal than 40 characters'],
        minLength: [10 , 'A tour name must have more or equal than 10 characters'],
    },
    slug: String,
    duration: {
        type: Number,
        required:[true , 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required:[true , 'A tour must have a group size'],
    },
    difficulty: {
        type: String,
        required:[true , 'A tour must have a difficulty'],
        enum: {
            values: ['easy' , 'medium' , 'difficult'],
            message: 'Difficulty can be easy , medium or difficult',
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1 , 'Rating must be above 1.0'],
        max: [5 , 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required:[true , 'A tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below the regular price',            
        }
    },
    summary: {
        type: String,
        trim: true,
        required:[true , 'A tour must have a description'],
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required:[true , 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false,
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false,
    }
} , {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// * Creating Virtual Properties

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

// * Running Document Middleware (Hooks)

tourSchema.pre('save' , function(next) {
    this.slug = slugify(this.name , {lower: true});
    next();
});

tourSchema.pre('save' , function(next){
    next();
});


tourSchema.post('save' , function(doc , next) {
    next();
});

// * Running Query Middleware (Hooks)

tourSchema.pre(/^find/ , function(next) {
    this.find({ secretTour: {$ne : true}});
    next();
});

tourSchema.post(/^find/ , function(docs , next) {
    next();
});

// * Running Aggregation Middleware (Hooks)

tourSchema.pre('aggregate' , function(next) {
    this.pipeline().unshift({
        $match: { secretTour: { $ne: true } }
    });
    next();
});


// * Creating Model

const Tour = mongoose.model('Tour' , tourSchema);

module.exports = Tour;
