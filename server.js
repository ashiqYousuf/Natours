const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: './config.env'});
const app = require('./app');

// *process.env has all ENV variables set

// &Connect Mongoose to the MongoDB

const DB = process.env.DATABASE;
mongoose.connect(DB , {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
}).then((con) => {
    console.log('DB Connection Successfull 👏');
}).catch((err) => {
    console.log(err);
});


// &Listen to incoming requests

const PORT = process.env.PORT || 3000;
app.listen(PORT , () => {
    console.log(`Server listening at PORT ${PORT}`);
});
