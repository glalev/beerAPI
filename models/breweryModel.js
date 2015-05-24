var util = require("util");
var BaseModel = require("./baseModel");

var belongsTo = ['country'];
var hasOneOrMany = ['geocodes', 'beers'];

module.exports = (function (){
    'use strict';

    function BreweryModel () {
        BaseModel.call(this, 'breweries', belongsTo, hasOneOrMany);
    }

    util.inherits(BreweryModel, BaseModel);

    return new BreweryModel ();

})();