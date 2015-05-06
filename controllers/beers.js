var express = require('express');
var beerModel = require('../models/beerModel');

var beers = express.Router();

module.exports = (function (){
    'use strict';
    //beerModel.update(5920, {name: 'test5', country_id: 20}).then(function(val){
    //   console.log(val);
    //});

    beers.get('/', function (req, res){
        beerModel.getAll().then(function (all) {
            res.send(all);
        });
    });

    beers.get('/bulgaria', function (req, res){
        beerModel.getBy({'country_id' : '31'}).then(function (beers) {
            res.send(beers);
        });
    });

    beers.get('/:id', function (req, res){
        beerModel.get(req.params.id).then(function (beer) {
            res.send(beer);
        });
    });

    return beers;

})();
