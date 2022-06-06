const express = require('express');
const app = express()
const ejs = require('ejs')
const models = require('./models/user')
const mongoose = require('mongoose');
const { options } = require('nodemon/lib/config');
const User = require('./models/user');

const dbURI = 'mongodb+srv://bisht:326ce21s@cluster0.glnxr.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(
    (res) => {
      console.log('connected to db');
      app.listen(port, () => {
        console.log(`listening on port ${port}`)
      })
    }

  )
  .catch(
    (err) => {
      console.log(err);
    } // end of catch
  )

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/signup', (req, res) => {
  // console.log(req.body.name)
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    group: ''
  });
  user.save()
    .then(() => {
      res.redirect('/');
      console.log('added user')
    })
    .catch(err => {
      console.log(err);
    })
})

app.get('/all-users', (req, res) => {
  User.find()
    .then(users => {  
      res.send(users)
    })
    .catch(err => {
      console.log(err);
    })
})

app.get('/find-user', (req, res) => {
  User.findById('629db5c034d139558795e36f')
  .then(user => {
    res.send(user)
  }
  )
  .catch(err => {
    console.log(err);
  }
  )
})


app.get('/', (req, res) => {
  res.render('index')
})


const port = process.env.port || 3000;
