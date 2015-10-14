var express = require('express');
var baseModel = require('../models/baseModel');
var breweries = express.Router();

module.exports = (function (){
    'use strict';

    breweries.get('/:id', function (req, res){
        baseModel.from('breweries').get(req.params.id).then(function (brewery) {
            res.send(brewery);
        });
    });

    return breweries;

})();