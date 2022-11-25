const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/User')
const User = mongoose.model("users")
require('../models/Votacao')
const Votacao = mongoose.model("votacoes")
const URL = require('url')
const { isAuthenticated } = require('../middlewares/auth')

    router.post('/criar', isAuthenticated, async (req, res) => {

        const error = []
        
        const items = {}
        
        let { title, private, anonymous, expires, expiresDate, expiresTime } = req.body

        if(!title || title == undefined || title == null) {
            error.push({ error: "title invalid"})
        }

        for (i in req.body) {
            if(/^item\d$/.test(i)) {
                req.body[i] = req.body[i].trim()
                if(!req.body[i] || req.body[i] == undefined || req.body[i] == null) {
                    error.push({ error: `${i} invalid`})
                } else if (/^\d/.test(req.body[i])) {
                    error.push({error: `${i} starts with number`})
                } else {        
                    req.body[i] = req.body[i].trim()
                    if(anonymous == true) {
                        items[i] = { "name": req.body[i], "count": 0 }
                    } else {
                        items[i] = { "name": req.body[i], "count": 0, userVotes: []}
                    }
                }
            }
        }

        if(expires == true) {
            try{
                expiresDate = expiresDate.split('-')
                expiresTime = expiresTime.split(':')
                expires = { expires: expires, expiresDate: new Date(expiresDate[0], expiresDate[1] - 1, expiresDate[2], expiresTime[0], expiresTime[1])}
                expires = JSON.stringify(expires)
            } catch {
                error.push({ error: "invalid expires date"})
            }
        }

        if(error.length > 0) {
            res.status(400)
            return res.json(error)
        }

        const newVotacao = {
            title: title.trim(),
            items: JSON.stringify(items),
            criador: req.userId,
            userVotes: JSON.stringify([]),
            private: private || false,
            anonymous: anonymous || false,
            expires: expires
        }

        try {
            const votacao = await Votacao.create(newVotacao);
            res.send({ votacao})
        } catch {
            res.send({ error: "erro ao criar a votação"})
        }

    })

    router.get('/votacoes/find', (req, res) => {
        const { search } = URL.parse(req.url, true).query
        Votacao.find({title: { $regex: '.*' + search + '.*', $options: 'i'}, public: true}).populate("criador").sort({Date: "desc"}).lean().then(data => {
            for(i in data) {
                data[i].items = JSON.parse(data[i].items)
            }
            res.json(data)
        })
    })

    router.get('/minhasVotacoes', isAuthenticated, async (req, res) => {
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

        const votacoes = await Votacao.find({criador: req.userId}).populate("criador").sort(sort).lean()

        for(i in votacoes) {
            votacoes[i].items = JSON.parse(votacoes[i].items)
        }
        res.send({ votacoes })
    }) 

    router.get('/votacao/:id', async (req, res) => {
        await Votacao.findById(req.params.id).lean().then(data => {
            data.userVotes = JSON.parse(data.userVotes)
            data.items = JSON.parse(data.items)
            res.json(data)
        }).catch(err => {
            res.status(404)
            res.json({error: "Não foi possivel achar a votação"})
        })
    })

    router.post('/votacao/:id', isAuthenticated, async (req, res) => {
        const votacao = await Votacao.findById(req.params.id).lean()

        votacao.items = JSON.parse(votacao.items)
        votacao.userVotes = JSON.parse(votacao.userVotes)
        const { items, userVotes, anonymous, expires } = votacao
        const { voto } = req.body

        if(expires) {
            if(new Date(JSON.parse(expires).expiresDate) < new Date()) {
                return res.send({error: "Voting Expired"})
            }
        }
        
        for(i in userVotes) {
            if (userVotes[i] == req.userId) 
                return res.send({error: "user has been voted"})
        }

        if(!voto || voto == undefined || voto == null) 
            return res.status(400).send({ error: "Voto invalido"})
        
        for(i in items) {
            if(i == voto) {
                items[i].count ++
                userVotes.push(req.userId)
                votacao.totalVotes ++
                if(anonymous == false) {
                    items[i].userVotes.push({name: req.userName  ,id: req.userId})
                }
            }
        }

        votacao.items = JSON.stringify(items)
        votacao.userVotes = JSON.stringify(userVotes)

        try {
            const votacaoResult = await Votacao.findByIdAndUpdate(req.params.id, votacao)
            res.send({ votacao })
        } catch {
            res.status(400).send({ error: "erro ao votar"})
        }
    })
module.exports = router