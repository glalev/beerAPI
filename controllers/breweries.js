var express = require('express');
var breweryModel = require('../models/breweryModel');

var breweries = express.Router();

module.exports = (function (){
    'use strict';

    breweries.get('/:id', function (req, res){
        breweryModel.get(req.params.id).then(function (brewery) {
            res.send(brewery);
        });
    });

    return breweries;

})();