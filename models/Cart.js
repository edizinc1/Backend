var mongoose = require('mongoose');

var modelSchema = mongoose.Schema({
    idBuy:{
        type: String
    },
    idProd:{
        type: String
    },
    storage:{
        type: Number
    },
    status:{
        type: Boolean
    }
})

var Carts = mongoose.model("Carts", modelSchema);
module.exports = Carts;