// *Create a Script to load json data into the MongoDB Database
// &This Script has nothing to do with the rest of the Application
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
dotenv.config({path: './config.env'});

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

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json` , 'utf-8'));

const importData = async () => {
    try{
        await Tour.create(tours);
        console.log('Data loaded successfully');
    } catch(err) {
        console.log(err);
    }
    process.exit();
};

const deleteData = async () => {
    try{
        await Tour.deleteMany();
        console.log('Data deleted successfully');
    } catch(err){
        console.log(err);
    }
    process.exit();
};

if(process.argv[2] === '--import') {
    importData();
}

if(process.argv[2] === '--delete') {
    deleteData();
}
