const express = require('express');
const morgan = require('morgan');
const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


// &Use helmet() early in the Middleware stack for security purposes
// &Set Security HTTP Headers
app.use(helmet());

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// *Adding Middleware

if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


// & Creating Rate Limiter to prevent from DOS Attacks
// Limiting 100 REQUESTS per IP in 1 hour
// *limiter is our middleware

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP , please try again in an hour',
});
app.use('/api' ,limiter);

// * Body Parser : Reading data from body into req.body
// *Limit Body size for security purposes
app.use(express.json({ limit: '10kb' }));


// &Sanitize Data against noSQL Query Injection (Clean Data)
app.use(mongoSanitize());

// &Data Sanitization against XSS
app.use(xss());

// & Prevent Parameter Pollution [Clear Query String like ?sort=duration&sort=price sort used 2 times]
// ?sort=duration&sort=price but we want this query to RUN both durations

// ?Whitelist is a array of properties for which we actually allow duplicates in the Query String
app.use(hpp({
    whitelist: ['duration' , 'ratingsQuantity' , 'ratingsAverage' , 'maxGroupSize' , 'difficulty' , 'price'],
}));

// *Serve static files

app.use(express.static(`${__dirname}/public`));

// *Custom Middleware

app.use((req , res ,next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});

// *Routing Middleware (Mouting)

app.use('/api/v1/tours' , tourRouter);
app.use('/api/v1/users' , userRouter);

app.all('*' , (req , res , next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server` , 404));
});

// *Error Handling Middleware: Express automatically knows this is a error handling middleware as it has got 4 params
app.use(globalErrorHandler);

module.exports = app;
