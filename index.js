const express = require('express');
const bcrypt = require('bcryptjs');
const ejs = require('ejs')
const session = require('express-session')
const MongoDBSession = require('connect-mongodb-session')(session)
const mongoose = require('mongoose');
const Assignment = require('./models/assignment')
const Admin = require('./models/admin')
const { options } = require('nodemon/lib/config');
const { status } = require('express/lib/response');
const User = require('./models/user');
const crdir = __dirname
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

const isAuthenticatedAdminDashboard = (req, res, next) => {
    if (req.session.isAuth) {
        if(req.session.user.isAdmin){
            next()
        } else {
            res.redirect('/student-dashboard')
        }
    } else {
        res.redirect('/login-choose')
    }
}

const isAuthenticatedStudentDashboard = (req, res, next) => {
    if (req.session.isAuth) {
        if(!req.session.isAdmin){
            next()
        } else {
            res.redirect('/admin-dashboard')
        }
    } else {
        res.redirect('/login-choose')
    }
}

app.get('/', (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('index', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir })
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
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('signup', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir  })
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
        return res.redirect('/')
    }
    else {
        req.session.isAuth = true
        req.session.user = user[0]
        console.log('student logged in')
        res.redirect('/student-dashboard')
    }
})

app.get('/student-dashboard', isAuthenticatedStudentDashboard, (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('student-dashboard', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, user: req.session.user, crdir: crdir  })
})

app.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) throw err;
        res.redirect('/')
    })
})

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) throw err;
        res.redirect('/')
    })
})

app.get('/admin-login', (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('admin-login', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin , crdir: crdir })
})

app.post('/admin-login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await Admin.find({ email: email })
    if (!user) {
        res.redirect('/admin-login')
    } else {
        const isMatch = await bcrypt.compare(password, user[0].password)
        if (!isMatch) {
            return res.redirect('/admin-login')
        } else {
            req.session.isAuth = true
            req.session.user = user[0]
            console.log('admin logged in')
            res.redirect('/admin-dashboard')
        }
    }
})

app.get('/admin-dashboard', isAuthenticatedAdminDashboard, (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('admin-dashboard', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, user: req.session.user, crdir: crdir  })
})

app.get('/admin-signup', (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('admin-signup', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir  })
})

app.post('/admin-signup', async (req, res) => {
    const password = req.body.password.trim()
    const email = req.body.email.trim()
    const name = req.body.name.trim()
    if (password != '' && email != '' && name != '') {
        let isUser = await Admin.findOne({ email: email })
        if (isUser) {
            res.redirect('/admin-signup')
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const admin = new Admin({
                name: name,
                email: email,
                password: hashedPassword,

            })
            await admin.save()

                .then(() => {
                    res.redirect('/admin-login')
                    console.log('added admin')
                })
                .catch(err => {
                    console.log("ERROR", err);
                })
        }
    }
    else {
        res.redirect('/admin-signup')
    }
}
)


app.get('/go-to-dashboard', (req, res) => {
    if (req.session.isAuth){
        if(req.session.user.isAdmin === false){
            res.redirect('/student-dashboard')
        } else {
            res.redirect('/admin-dashboard')
        }
    } else {
        res.redirect('/')
    }
})

app.get('/login-choose', (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('login-choose', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir  })
})

app.post('/create-assignment', async (req, res) => {
    const title = req.body.title.trim()
    const description = req.body.description.trim()
    const dueDate = req.body.duedate
    const assignedBy = req.session.user.name;
    const maximumMarks = req.body.maxmarks
    const assignment = new Assignment({
        title: title,
        description: description,
        dueDate: dueDate,
        maximumMarks: maximumMarks,
        assignedBy: assignedBy,
    })
    await assignment.save()
        .then(() => {
            res.redirect('/admin-dashboard')
            console.log('added assignment')
        })
        .catch(err => {
            console.log("ERROR", err);
        })
})

app.get('/create', isAuthenticatedAdminDashboard, (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    res.render('create', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir  })
})

app.get('/view-assignments', async (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    const assignments = await Assignment.find()
    res.render('view-assignments', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, assignments: assignments, crdir: crdir  })
})

app.get('/assignments/:id', async (req, res) => {
    var isAdmin;
    if(req.session.isAuth){
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    const assignment = await Assignment.findById(req.params.id)
    console.log(assignment)
    res.render('assignment', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, assignment: assignment , crdir: crdir })
})