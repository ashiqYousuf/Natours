const express = require('express');
const morgan = require('morgan');
const app = express();

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// *Adding Middleware

if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req , res ,next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});

// *MOUNTING

app.use('/api/v1/tours' , tourRouter);
app.use('/api/v1/users' , userRouter);

app.all('*' , (req , res , next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server` , 404));
});

// *Error Handling Middleware: Express automatically knows this is a error handling middleware as it has got 4 params
app.use(globalErrorHandler);

module.exports = app;
