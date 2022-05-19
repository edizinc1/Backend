var mongoose = require('mongoose');

var modelSchema = mongoose.Schema({
    name: {
        type: String,
        minlength: [4, "El nombre es muy corto: min 4 caracteres"],
        maxlength: [30, "El nombre es muy largo: max 30 caracteres"],
    },
    email: {
        type: String,
        required: [true, "El correo electrónico es obligatorio"]
    },
    password: {
        type: String
    },
    type: {
        type: String,
        enum: ["Vendedor", "Comprador"]
    }
})

var Users = mongoose.model("Users", modelSchema)
module.exports = Users;