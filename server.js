const express = require('express');
const mongoose = require('mongoose');
const path = require('path')
const app = express();
const session = require('express-session');
const dotenv = require('dotenv');
const passport = require('passport');
const bcrypt = require('bcryptjs')
const User = require('./models/User')
//const bodyParser = require('body-parser');
//const db = require('./config').mongoURI
const { ensureAuthenticated } = require('./config/auth')
const port = process.env.PORT || 8009

// mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }, () => {
//     console.log('mongoDB connected')
// })

//passport config
require('./config/passport')(passport)

dotenv.config();
mongoose.connect(process.env.DB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false },
    () => console.log('connected to mongodb')
);

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365
    }

}));


//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }))


app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/css', express.static(__dirname + '/css'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use('/js', express.static(__dirname + '/js'));



app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/login.html'))
})

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '/signup.html'))
})

app.get('/todo', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'))
})


//register handle
app.post('/signup_submit', (req, res) => {
    // console.log(req.body);
    // res.send('hello')
    const { name, email, password, } = req.body;
    //    res.send(typeof password)
    let errors = []
    if (!name || !email || !password) {
        errors.push({ msg: 'please fill in all fields' })
    }

    if (password.length < 6) {
        errors.push({ msg: 'password should be at least 6 characters' })
    }
    if (errors.length > 0) {
        res.status(400).send(errors)
    } else {
        //
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    res.send({ msg: 'Email is already registered' })

                } else {
                    const newUser = User({
                        name,
                        email,
                        password
                    });
                    // console.log(newUser)
                    // res.send('hello')
                    //Hash Passoword
                    bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        //set password to hashed password
                        newUser.password = hash;
                        newUser.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('user: ' + newUser.email + " saved.");
                                req.login(newUser, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }

                                    return res.redirect('/todo');
                                });
                            }
                        });
                    }))
                }
            })

        //        res.send('pass')
    }

});



app.post('/login_submit', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/todo',
        failureRedirect: '/login',
    })(req, res, next);
});


// app.get('/save', ensureAuthenticated, async (req, res) => {
//     user = await User.findById(req.user._id)
//     res.send(user)
// })


app.post('/save', ensureAuthenticated, async (req, res) => {
    data = req.body
    //console.log(req.body);

    //user = await User.findById(req.user._id.toString())
    // user.Data = req.body
    await User.findByIdAndUpdate({ _id: req.user._id }, { Data: data })
    console.log(data.constructor);

    // res.send(req.body)
    // res.send(user)
    //console.log(req.user);

})

app.get("/clear", async (req, res) => {

    await User.findByIdAndUpdate({ _id: req.user._id }, { Data: [] }, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    })
    //    res.send('deleted successfully')


})


app.get("/data", ensureAuthenticated, async (req, res) => {
    user = await User.findById(req.user._id)
    res.json(user.Data)
    console.log((user.Data).constructor);
    console.log((user.Data));
})


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
