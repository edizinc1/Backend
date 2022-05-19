var mongoose = require('mongoose');

var modelSchema = mongoose.Schema({
    name:{
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
    },
    imagenUrl:{
        type: String,
    },
    idSeller:{
        type: String,
    },
    storage:{
        type: Number,
    }
    
})

var Products = mongoose.model("Products", modelSchema);
module.exports = Products;