const express = require('express')
const mongoose = require('mongoose')
const app = express()
const PORT = 5000
require("./models/User")
const User = mongoose.model("users")
require("./models/Votacao")
const Votacao = mongoose.model("votacoes")
const user = require('./routes/user')
const votacoes = require('./routes/votacoes')
const URL = require('url')

// Config
    // Mongoosse
        mongoose.connect('mongodb://localhost/votacoes')
        .then(() => {
            console.log('Database connect successfully')
        }).catch(err => {
            console.log(`erro: ${err}`)
        })

    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))


// Routes

    app.get('/', (req, res) => {
        console.log(req)
        const { order } = URL.parse(req.url, true).query
        const sort = {}
        if (order) {
            let [field, type] = order.split(" ")
            if ( field != "Date" && field != "totalVotes" || type != "desc" && type != "asc") {
                field = undefined
                type = undefined
            }
            sort[field] = type
        }

        Votacao.find({private: false}).populate("criador").sort(sort).lean().then(data => {
            for(i in data) {
                data[i].items = JSON.parse(data[i].items)
            }
            return res.json(data)
        })
    })

    app.use('/user', user)
    app.use('/votacoes', votacoes)

app.listen(PORT, () => {
    console.log(`servidor rodando na porta: ${PORT}`)
})