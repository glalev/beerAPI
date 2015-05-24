var express = require('express');
var _ = require('underscore');
var beerModel = require('../models/beerModel');
var Q = require('q');

var beers = express.Router();

module.exports = (function (){
    'use strict';


    beers.get('/', function (req, res){
        beerModel.getAll({page:2, perPage:10}).then(function (all) {
            res.send(all);
        });
    });

    beers.get('/bulgaria', function (req, res){
        beerModel.getBy({'country_id' : '31'}).then(function (beers) {
            res.send(beers);
        });
    });

    beers.get('/:id', function (req, res){
        beerModel.get(req.params.id)
            .then(function (beer) {
                //Q.all([
                //    //TODO това с нулите ( || 0), го оставих в случай, че бирата няма стил или държава.
                //    // Може би не е най-правилния подход, защото прави безмислена заяка до базата данни, но за сега го оставям така;
                //    beerModel.getRandom(3, {style_id: (beer.style.id || 0), '!id': beer.id}),
                //    beerModel.count({country_id: (beer.country.id || 0)})
                //])
                //    .spread(function(fromSameStyle, fromSameCountry){
                //        beer.fromSameStyle = fromSameStyle;
                //        beer.fromSameCountry = fromSameCountry;
                //        res.send(beer);
                //    });
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
