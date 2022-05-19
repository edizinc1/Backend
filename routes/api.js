var express = require('express');
var bcrypt = require('bcryptjs');
var router = express.Router();
var sessionArray= [];
var session;

let user = require("../models/Users");
let product = require("../models/Products");
let cart = require("../models/Cart");
const { update } = require('../models/Users');


const saltRounds = 10;

//Main API page
router.get('/', function(req,res,next){
    res.send('Api Ecomes');
})

//Gets all the users
router.get('/users', function(req,res,next){
    user.find().exec(function(error,Users){
        if(error){
            res.status(500).json(error);
        }
        else{
            console.log("Mandando usuarios...")
            res.status(200).json(Users);
        }
    });
});

//Gets all the products, also it adds the vendorName to each product
router.get('/products/all', (req,res,next) => {
    (async () => {
        try {
            let products = await product.find().exec();
            let prod = JSON.parse(JSON.stringify(products));
            for await (let p of prod) {
                let userQuery = await user.findById(p.idSeller).exec();
                p.vendorName = userQuery.name
            }
            res.status(200).json(prod);
        } 
        catch(err) {
            res.status(500).send(err)
        }
    })();
});

//Gets a product depending the product's id
router.get('/product/:id', (req,res,next) => {
    (async () => {
        try {
            let products = await product.findById(req.params.id).exec();
            let prod = JSON.parse(JSON.stringify(products));
            let userQuery = await user.findById(products.idSeller).exec();
            console.log(userQuery);
            prod.vendorName = userQuery.name;
            console.log(prod.vendorName);
            res.status(200).json(prod);
        }
        catch(err){
            console.log(err);
            res.status(500).send(err);
        }
    })();
});

//Saves new user, also encrypts the user password
router.post('/new/user', function(req, res, next) {
        let data = req.body;
        bcrypt.hash(data.password,saltRounds,(err,hash)=>{
            var newUser = new user({
                name: data.name,
                password: hash,
                email: data.email,
                type: data.type
            });
    
            console.log(newUser);
    
            newUser.save(function(error){
                let array = ["name","email","password","type"];
                detectingErrors(array);
                async function detectingErrors(vec){
                    if(error){
                        for(let i = 0; i < vec.length; i++){
                            aux = vec[i];
                            console.log('revisando: '+ aux);
                            if(error.errors[aux]){
                                console.log("No se arma bruh");
                                console.log('Error en:' + error.errors[aux]);
                                res.status(500).json({
                                    status: "No se pudo insertar el registro, hay errores en "+ error.errors[aux]
                                });
                            }
                            else{
                                console.log("No errores en " + aux);
                            }
                        }
                    }
                    else{
                        console.log('Ya se hizo el guiso');
                        res.status(200).json({status: "success"})
                    }
                }
            });
        });
});

//Gets all the products wich has the same idSeller (all the products from one user)
router.get('/product/vendor/:id', function(req,res,next){
    (async()=>{
        try{
            let prods= {}
            product.find().exec(function(error,Products){
                if(error){
                    res.status(500).json(error);
                }
                else{
                    for(let i = 0; i < Products.length; i++){
                        if(Products[i].idSeller == req.params.id){
                            prods[i] = Products[i];
                        }
                    }
                    res.status(200).json(prods);
                }
            });
        }
        catch(err){
            console.log(err)
        }
    })();
});

//login section of the api
router.post('/login', function(req,res,next){
    (async() =>{
        try{
            let data = req.body;
            let use = new user({
                email: data.email,
                password: data.password
            })

            await user.findOne({email: data.email}).exec((err,Us) =>{
                if(err || Us == null){
                    console.log(err);
                    res.status(500).json({ErrorMessage:'Direccion de correo invalida'});
                }
                else{
                    bcrypt.compare(use.password, Us.password, function(error, result) {
                        if(result){
                            session = Us.id;
                            sessionArray.push(session);
                            console.log(session);
                            res.status(200).json({ErrorMessage:'', SuccessMessage: 'Success'});
                        } 
                        else {
                            res.status(500).json({ErrorMessage:'Contraseña incorrecta', SuccessMessage: '',ClassMessage:'alert alert-danger'});
                        }
                    });
                }
            })
        }
        catch(err){
            console.log(err)
        }
    })();
});

//sends the last session
router.get('/session',(req,res,next) =>{
    if(sessionArray[sessionArray.length - 1]){
        (async()=>{
            try{
                let us = await user.findById(sessionArray[sessionArray.length -1]).exec()
                console.log(us);
                res.status(200).json({lastSession: sessionArray[sessionArray.length - 1], type: us.type});
            }
            catch(err){
                console.log(err)
            }
        })();
        
    }
    else{
        res.status(500)
    }
   
});

//Send the user depending the given id
router.get('/user/:id', (req,res,next) =>{
    (async() => {
        try{
            let us = await user.findById(req.params.id).exec()
            us.password = null;
            res.status(200).json(us);
        }
        catch(err){
            console.log(err)
            res.status(500)
        }
    })();
});

//Cart function, this petition saves an item in the users cart
router.post('/saves/item', (req,res,next) => {
    let data = req.body;
    console.log(data)
    var car = new cart({
        idBuy: data.idBuy,
        idProd: data.idProd,
        storage: 1,
        status: false
    });
    car.save((err)=>{
        if(err){
            console.log(err);
            res.status(500);
        }
        else{
            res.status(200).json(car);
        }
    });  
});

//gets all the orders from the same user depending on the user id
router.get('/orders/user/:id', (req,res,next) =>{
    (async()=>{
        try{
            let ords = {}
            let ordsTrue = {}
            let ordsFalse = {}
            let Carts = await cart.find().exec();
            let car = JSON.parse(JSON.stringify(Carts));
            for(let i = 0; i < car.length; i++){
                if(car[i].idBuy == req.params.id){
                    let prod = await product.findById(car[i].idProd).exec();
                    let p = JSON.parse(JSON.stringify(prod));
                    car[i].objectName = p.name;
                    car[i].objectDesc = p.description;
                    car[i].objectPrice = p.price;

                    if(car[i].status == true){
                        ordsTrue[i] = car[i];
                    }
                    else{
                        ordsFalse[i] = car[i];
                    }
                }
            }
            ords= {
                ordsFalse,
                ordsTrue
            }
            res.status(200).json(ords);
        }
        catch(err){
            console.log(err);
        }
    })();
});

//This service modifies the status property of a cart, changing it to true
router.post('/cart/pay', (req,res,next) =>{
    (async()=>{
        try{
            let data =  req.body;
            console.log(data)
            let Carts = await cart.find().exec();
            for await (let c of Carts){
                if(c.idBuy == data.idBuy){
                    console.log('entra');
                    let filter = {idBuy: c.idBuy, status:false}
                    let update = {status: true}
                    var car = await cart.findOneAndUpdate(filter, update).exec();
                    console.log(car);
                }
            }
        }
        catch(err){
            console.log(err)
        }
    })();
});

router.post('/new/product', (req,res,next) =>{
    let data = req.body;
    console.log(data);
    var prod = new product({
        name: data.name,
        description: data.description,
        price: data.price,
        imagenUrl: data.imagenUrl,
        idSeller: data.idSeller,
        storage: data.storage
    });
    prod.save((err)=>{
        if(err){
            console.log(err);
            res.status(500);
        }
        else{
            console.log(prod)
            res.status(200).json(prod);
        }
    });  
});

router.post('/user/delete', (req,res,next) => {
    (async () =>{
        let data = req.body;
        console.log(data);
        let us = await user.findByIdAndDelete(data.usId);
        console.log(us)
        try{
            us.remove();
            res.status(200).json({
                "message" : "Success"
            });
        }
        catch(err){
            console.log(err)
        }
    })();
});

module.exports = router;