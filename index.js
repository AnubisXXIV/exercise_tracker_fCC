const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// mongoose setup
mongoose.connect(process.env.MONGO_URI);

// userSchema
const userSchema = new mongoose.Schema({
  username: {
      type: String,
      required: true
  }
});
const User = new mongoose.model('users', userSchema);

// exerciseSchema
const exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date}
});
const Exercise = new mongoose.model('exercises', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// create new user
app.post('/api/users', async (req, res) => {

  const usernameInput = req.body['username'];

  const userDoc = new User({
    username: usernameInput
  });

  const newDoc = await userDoc.save();
  const userId = newDoc._id.toString();
  
  res.json({
    username: usernameInput,
    _id: userId
  });
});

// get all users
app.get('/api/users', async (req, res) => {
  const allUsers = await User.find({}).exec();
  res.json(allUsers);
});

// post new exercise
app.post('/api/users/:id/exercises', async (req, res) => {
  // console.log(req.body);
  let dateInput;
  const descriptionInput = req.body.description;
  const durationInput = parseInt(req.body.duration);
  if (!req.body.date) {
    dateInput = new Date();
  } else {
    dateInput = new Date(req.body.date);
  }

  const queryUser = await User.findById(req.params.id);
  
  const exerciseDoc = new Exercise({
    userId: req.params.id,
    description: descriptionInput,
    duration: durationInput,
    date: dateInput
  });
  await exerciseDoc.save();

  res.json({
    username: queryUser.username,
    description: descriptionInput,
    duration: durationInput,
    date: dateInput.toDateString(),
    _id: req.params.id
  });
});

// get logs from user
app.get('/api/users/:id/logs', async (req, res) => {
  const {from, to, limit} = req.query;

  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    userId: req.params.id
  }
  if (from || to) {
    filter.date = dateObj;
  }
  console.log(dateObj);

  const queryUser = await User.findById(req.params.id);
  const userExercises = await Exercise.find(filter).limit(+limit ?? 500);
  const count = userExercises.length;

  res.json({
    username: queryUser.username,
    count,
    _id: req.params.id,
    log: userExercises.map((exercice) => {
          return {
            description: exercice.description,
            duration: exercice.duration,
            date: exercice.date.toDateString()
          }
      })

  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
