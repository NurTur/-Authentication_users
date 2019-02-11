const express = require('express');
const bodyParser = require('body-parser');

const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const USERS = mongoose.model("users", require("./model"));

const LocalStrategy = require('passport-local');
const { PORT, SESSION_SECRET, DATABASE } = require("./config/keys");
const app = express();


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


mongoose.connect(DATABASE)
  .then(() => {
    console.log("MongoDB connected")

    //serialization and app.listen
    passport.serializeUser(function (user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
      USERS.findById(id, function (err, user) {
        done(err, user);
      });
    });

    /************************************************* */
    // password authentication
    passport.use(new LocalStrategy(
      function (username, password, done) {
        USERS.findOne({ username: username }, function (err, user) {
          console.log('User ' + username + ' attempted to log in.');
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (password !== user.password) { return done(null, false); }
          return done(null, user);
        });
      }
    ));

    /************************************************* */
    // index
    app.get('/', (req, res) => {
      res.render('index', { title: 'Home page', message: 'Please login', showLogin: true, showRegistration: true });
    });

    app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });


    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/');
    };

    app.get('/profile', ensureAuthenticated, (req, res) => {
      res.render('profile', { username: req.user.username, title: 'Profile Page' });
    });

    app.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    });


    app.post('/register', (req, res, next) => {
      USERS.findOne({ username: req.body.username }, function (err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {

          const data = {
            username: req.body.username,
            password: req.body.password
          };

          const newuser = new USERS(data);
          newuser.save().then(() => next(null, newuser)).catch((err) => res.redirect('/'))
        }
      })
    },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => { res.redirect('/profile'); }
    );

    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });

    app.listen(PORT || 3000, () => {
      console.log("Listening on port " + PORT);
    });
  })
  .catch(err => console.log(err));










