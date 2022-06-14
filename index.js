const express = require('express');
const bcrypt = require('bcryptjs');
const ejs = require('ejs')
const session = require('express-session')
const MongoDBSession = require('connect-mongodb-session')(session)
const mongoose = require('mongoose');
const Assignment = require('./models/assignment')
const Admin = require('./models/admin')
const { options } = require('nodemon/lib/config');
const Response = require('./models/response')
const flash = require('connect-flash')
const { status } = require('express/lib/response');
const path = require('path');
const multer = require('multer')
const User = require('./models/user');
const { readFileSync } = require('fs');
const crdir = __dirname
const port_number = process.env.PORT || 3000;

var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/')
        },
        filename: function (req, file, cb) {
            cb(null, req.session.user.username.split(' ').join('_') + '_' + file.originalname.split(' ').join('_'))
        }
    }),
})
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
app.use('/uploads', express.static('uploads'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(flash())
app.use(session({
    secret: 'jhwenjkdhnejkdn',
    resave: false,
    saveUninitialized: false,
    store: store,
}))
// app.use(bo)

const isAuthenticatedAdminDashboard = (req, res, next) => {
    if (req.session.isAuth) {
        if (req.session.user.isAdmin) {
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
        if (!req.session.isAdmin) {
            next()
        } else {
            res.redirect('/admin-dashboard')
        }
    } else {
        res.redirect('/login-choose')
    }
}

function authAdmin(req) {
    var isAdmin;
    if (req.session.isAuth) {
        isAdmin = req.session.isAdmin
    } else {
        isAdmin = false
    }
    return isAdmin
}

app.get('/', (req, res) => {
    isAdmin = authAdmin(req)
    res.render('index', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Home' })
})

app.post('/signup', async (req, res) => {
    const password = req.body.password.trim()
    const email = req.body.email.trim()
    const name = req.body.name.trim()
    if (password != '' && email != '' && name != '') {
        let isUser = await User.findOne({ email: email })
        console.log(isUser)
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
    isAdmin = authAdmin(req)
    res.render('signup', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Signup' })
})

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.find({ email: email })
    if (user.length == 0) {
        return res.redirect('/')
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
    isAdmin = authAdmin(req)
    res.render('student-dashboard', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Student Dashboard' })
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
    isAdmin = authAdmin(req)
    res.render('admin-login', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Teacher Login' })
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
            req.session.isAdmin = true
            req.session.user = user[0]
            console.log('admin logged in')
            res.redirect('/admin-dashboard')
        }
    }
})

app.get('/admin-dashboard', isAuthenticatedAdminDashboard, (req, res) => {
    isAdmin = authAdmin(req)

    res.render('admin-dashboard', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, user: req.session.user, crdir: crdir, user: req.session.user, page: 'Teacher Dashboard', user: req.session.user })
})

app.get('/admin-signup', (req, res) => {
    isAdmin = authAdmin(req)

    res.render('admin-signup', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Teacher Signup' })
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
                username: name,
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
    if (req.session.isAuth) {
        if (req.session.user.isAdmin === false) {
            res.redirect('/student-dashboard')
        } else {
            res.redirect('/admin-dashboard')
        }
    } else {
        res.redirect('/')
    }
})

app.get('/login-choose', (req, res) => {
    isAdmin = authAdmin(req)
    res.render('login-choose', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Login' })
})

app.post('/create-assignment', async (req, res) => {
    const title = req.body.title.trim()
    const description = req.body.description.trim()
    const dueDate = req.body.duedate
    const assignedBy = req.session.user.username;
    console.log(assignedBy)
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
    isAdmin = authAdmin(req)
    res.render('create', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, crdir: crdir, user: req.session.user, page: 'Create Assignment' })
})

app.get('/view-assignments', async (req, res) => {
    isAdmin = authAdmin(req)

    const assignments = await Assignment.find()
    res.render('view-assignments', { page: 'View Assignments', website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, assignments: assignments, crdir: crdir, convertDate: convertDate, user: req.session.user })
})

app.get('/assignments/:id', async (req, res) => {
    isAdmin = authAdmin(req)

    id = req.params.id
    const assignment = await Assignment.findById(id)
    const isResponse = await Response.find({ id: id, submittedBy: req.session.user.username })
    var dueDate = convertDate(assignment.dueDate)
    res.render('assignment', {
        website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, assignment: assignment, crdir: crdir, dueDate: dueDate, user:
            req.session.user, isResponse: isResponse, deleteAssignment: deleteAssignment, page: assignment.title
    })
})

app.post('/submit-form', async (req, res) => {
    const id = req.body.assignmentId
    const assignedBy = req.body.assignedBy
    const maximumMarks = req.body.maximumMarks
    const title = req.body.title
    const description = req.body.description
    const dueDate = req.body.dueDate
    const submittedBy = req.body.submittedBy
    res.render('submit-form', { website: website, isAuth: req.session.isAuth, isAdmin: req.session.isAdmin, id: id, assignedBy: assignedBy, maximumMarks: maximumMarks, title: title, description: description, dueDate: dueDate, submittedBy: submittedBy, crdir: crdir, user: req.session.user, page: 'Submit Work' })
})


app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        filename = req.session.user.username.split(' ').join('_') + '_' + req.file.originalname.split(' ').join('_')
        contentType = req.file.mimetype
        id = req.body.assignmentId
        const response = new Response({
            response: {
                data: filename,
                contentType: req.file.mimetype,
            },
            date: Date.now().toString(),
            id: req.body.id,
            submittedBy: req.session.user.username,
        })
        response.save()
            .then(() => {
                console.log('added response')
                res.redirect('/go-to-dashboard')
            }
            )
            .catch(err => {
                console.log("ERROR", err);
            }
            )
    }
})

app.post('/view-responses', async (req, res) => {
    isAdmin = authAdmin(req)
    const uploadPath = './uploads/'
    const responses = req.body.username ? await Response.find({ id: req.body.assignmentId, submittedBy: req.body.username }) : await Response.find({ id: req.body.assignmentId })
    const assignment = await Assignment.findById(req.body.assignmentId)
    const dueDate = convertDate(assignment.dueDate)
    res.render('view-responses', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, responses: responses, crdir: crdir, uploadPath: uploadPath, user: req.session.user, assignment: assignment, dueDate: dueDate, convertDate: convertDate, page: 'View Responses' })
})

function convertDate(inputDate) {
    var dueDate = inputDate
    const date = new Date(dueDate)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    dueDate = day + '/' + month + '/' + year
    return dueDate
}

app.get('/view-students', async (req, res) => {
    isAdmin = authAdmin(req)
    if (isAdmin) {
        const students = await User.find()
        res.render('view-students', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, students: students, crdir: crdir, user: req.session.user, page: 'View Students' })
    } else {
        res.redirect('/login-choose')
    }
})

app.post('/view-students', async (req, res) => {
    isAdmin = authAdmin(req)
    if (isAdmin) {
        const filter = req.body.filter
        const results = await User.find()
        const students = results.filter(student => {
            return student.username.toLowerCase().includes(filter.toLowerCase()) || student.email.toLowerCase().includes(filter.toLowerCase())
        })
        res.render('view-students', { website: website, isAuth: req.session.isAuth, isAdmin: isAdmin, students: students, crdir: crdir, user: req.session.user, page: 'View Students' })

    } else {
        res.redirect('/login-choose')
    }
}
)

function deleteAssignment(id) {
    Assignment.findByIdAndDelete(id)
        .then(() => {
            console.log('deleted assignment')
        })
        .catch(err => {
            console.log("ERROR", err);
        })
}

app.post('/delete/:id', async (req, res) => {
    isAdmin = authAdmin(req)
    if (isAdmin) {
        id = req.params.id
        deleteAssignment(id)
        res.redirect('/view-assignments')
    }
    else {
        res.redirect('/go-to-dashboard')
    }
})