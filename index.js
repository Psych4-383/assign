const express = require('express');
const bcrypt = require('bcryptjs');
const ejs = require('ejs')
const session = require('express-session')
const MongoDBSession = require('connect-mongodb-session')(session)
const mongoose = require('mongoose');
const { options } = require('nodemon/lib/config');
const { status } = require('express/lib/response');
const User = require('./models/user');
const port_number = process.env.PORT || 3000;

const app = express()

const dbURI = 'mongodb+srv://bisht:326ce21s@cluster0.glnxr.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(
        (res) => {
            console.log('connected to db');
            app.listen(port_number, () => {
                console.log(`listening on port ${port_number}`)
            })
        }

    )
    .catch(
        (err) => {
            console.log(err);
        } // end of catch
    )


const store = new MongoDBSession(
    {
        uri: dbURI,
        collection: 'sessions',
    }
)

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'jhwenjkdhnejkdn',
    resave: false,
    saveUninitialized: false,
    store: store,
}))

const isAuthenticated = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect('/login')
    }
}

app.get('/', (req, res) => {
    // console.log()
    res.render('index')
})

app.post('/signup', async (req, res) => {
    let isUser = await User.findOne({ email: req.body.email })
    if (isUser) {
        res.redirect('/')
    } else {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = new User({
            username: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            group: ''
        })
        await user.save()
            .then(() => {
                res.redirect('/login');
                console.log('added user')
            })
            .catch(err => {
                console.log("ERROR", err);
            })
    }
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.find({ email: email })
    if (!user) {
        res.redirect('/')
    }
    const isMatch = await bcrypt.compare(password, user[0].password)

    if (!isMatch) {
        return res.redirect('/login')
    }
    else {
        req.session.isAuth = true
        res.redirect('/dashboard')
    }
})

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard')
})

app.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) throw err;
        res.redirect('/')
    })
})
