const express = require('express');
const bodyParser = require('body-parser');

const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local');

const USERS = mongoose.model("users", require("./model"));

const routes = require('./routes');
const auth = require('./auth');
const { PORT, SESSION_SECRET, DATABASE } = require("./config/keys");


app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'ejs')


/*********************************************/
app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

/*********************************************/


mongoose.connect(DATABASE, { useNewUrlParser: true })
  .then(() => {
    console.log("MongoDB connected")
    auth(app, USERS);
    routes(app, USERS);

    app.listen(PORT || 3000, () => {
      console.log("Listening on port " + PORT);
    });
  })
  .catch(err => console.log(err));










