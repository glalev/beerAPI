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

    beers.get('/search', function (req, res){
        if(!req.query.q) return res.send('No query Provided');
        var q = req.query.q;

        baseModel.from('beers').search(q).then(function (result) {
            res.send(result);
        });

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

    beers.get('/:beer_id/comments/:id', function (req, res){
        baseModel.from('comments').getBy({beer_id: req.params.beer_id, id: req.params.id})
            .then(function (comment) {
                res.send(comment);
            });
    });

    beers.get('/:id/comments', function (req, res){
        baseModel.from('beers').get(req.params.id)
            .then(function (beer) {
                res.send(beer.comments);
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
