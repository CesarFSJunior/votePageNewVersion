const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Votacao = new Schema({
    title: {
        type: String,
        required: true
    },
    items: {
        type: String,
        required: true
    },
    Date: {
        type: Date,
        default: Date.now()
    },
    criador: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    totalVotes:{
        type: Number,
        default: 0
    },
    userVotes: {
        type: String
    },
    private: {
        type: Boolean,
        required: true
    },
    anonymous: {
        type: Boolean,
        required: true
    },
    expires: {
        type: String
    }
})

mongoose.model("votacoes", Votacao)