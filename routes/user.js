const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/User')
const User = mongoose.model("users")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')
const { isAuthenticated } = require('../middlewares/auth')

function generateToken(params = []) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    })
}


router.post('/register', async (req, res) => {
        
    const errors = []
    
        if (await User.findOne({ email: req.body.email })) {
            return res.status(400).send({error: 'Usuario ja existe'})
        }

        if(!req.body.name || req.body.name == undefined || req.body.name == null) {
            errors.push({title: "invalid name"})
        }
        
        if(!req.body.email || req.body.email == undefined || req.body.email == null) {
            errors.push({title: "invalid email"})
        }
        
        if(!req.body.password || req.body.password == undefined || req.body.password == null) {
            errors.push({title: "invalid password"})
        }
        
        if(req.body.password != req.body.password2) {
            errors.push({title: "passwords are diferent"})
        }
        
        if(errors.length > 0) {
            console.log(errors)
            return res.json({error: "Failed at create your account", errors})
        } 

        const newUser = {
            name: req.body.name.trim(),
            email: req.body.email,
            password: req.body.password,
            birthday: req.body.birthday
        }

        try {
            const user = await User.create(newUser);
            user.password = undefined
            return res.send({
                user,
                token: generateToken({ id: user.id, name: user.name })
            });
        } catch (err) {
            console.log("error : " + err)
            res.json({error: "Failed at create your account"})
        }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password');

    if(!user) {
        return res.status(400).send({ error: 'User not found'})
    }
    
    if(!await bcrypt.compare(password, user.password)) {
        return res.status(400).send({ error: 'Invalid Password'})
    }

    user.password = undefined

    res.send({ 
        user,
        token: generateToken({ id: user.id, name: user.name })
    });

})

router.get('/user', isAuthenticated, (req, res) => {
    if(req.userId) {
        User.findById(req.userId).lean().then(data => {
            res.json({ data })
        })
    }
})

router.put('/user', isAuthenticated, (req, res) => {
    const { name, email} = req.body
    User.findByIdAndUpdate(req.userId, { name, email}, (err, user) => {
       if(err) {
        res.json(err)
       }else {
           res.json({ user})
       }
    })
})

module.exports = router