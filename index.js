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

const website = 'Assign';

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
    res.render('index', { website: website })
})

app.post('/signup', async (req, res) => {

    const password = req.body.password.trim()
    const email = req.body.email.trim()
    const name = req.body.name.trim()
    if (password != '' && email != '' && name != '') {
        let isUser = await User.findOne({ email: email })
        if (isUser) {
            res.redirect('/signup')
        } else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const user = new User({
                username: name,
                email: email,
                password: hashedPassword,
                group: ''
            })
            await user.save()
                .then(() => {
                    res.redirect('/');
                    console.log('added user')
                })
                .catch(err => {
                    console.log("ERROR", err);
                })  
        }
    }
    else {
        res.redirect('/signup')
    }
})

app.get('/signup', (req, res) => {
    res.render('signup', { website: website })
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
    res.render('dashboard', { website: website })
})

app.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) throw err;
        res.redirect('/')
    })
})
