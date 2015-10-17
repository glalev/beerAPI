var express = require('express');
var _ = require('underscore');
var baseModel = require("../models/baseModel");


var Q = require('q');

var beers = express.Router();

module.exports = (function (){
    'use strict';


    beers.get('/', function (req, res){
        beerModel.getAll().then(function (all) {
            res.send(all);
        });
    });
    beers.get('/test', function (req, res){
       res.send('It\'s alive!');
    });
    beers.get('/bulgaria', function (req, res){
        beerModel.getBy({'country_id' : '31'}).then(function (beers) {
            res.send(beers);
        });
    });

    beers.get('/count', function (req, res){
        beerModel.count('country_id as countries').then(function (count) {
            res.send(count);
        });
    });

    beers.get('/:id', function (req, res){
        baseModel.from('beers').get(req.params.id)
            .then(function (beer) {
                res.send(beer);
            });


    });

    beers.post('/add', function (req, res){
        if(_.isEmpty(req.body)){
            res.sendStatus(400);
            console.log('No data');
            return;
        }

        beerModel.insert(req.body).then(function (newBeerId) {
            res.send({id: newBeerId});
        });
    });

    beers.put('/update/:id', function (req, res){
        res.send(req.params.id);
    });

    return beers;

})();
