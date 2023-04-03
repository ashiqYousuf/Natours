const express = require('express');
const morgan = require('morgan');
const cors = require("cors");
const app = express();
app.use(cors());

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


app.use(helmet());

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP , please try again in an hour',
});
app.use('/api' ,limiter);

app.use(express.json({ limit: '10kb' }));

app.use(mongoSanitize());
app.use(xss());

app.use(hpp({
    whitelist: ['duration' , 'ratingsQuantity' , 'ratingsAverage' , 'maxGroupSize' , 'difficulty' , 'price'],
}));

app.use(express.static(`${__dirname}/public`));

app.use((req , res ,next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});

app.use('/api/v1/tours' , tourRouter);
app.use('/api/v1/users' , userRouter);
app.use('/api/v1/reviews' , reviewRouter);


app.all('*' , (req , res , next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server` , 404));
});

app.use(globalErrorHandler);

module.exports = app;
