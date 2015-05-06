var util = require("util");
var BaseModel = require("./baseModel");
var hasOne = ['country'];

module.exports = (function (){
    'use strict';

    function BreweryModel () {
        BaseModel.call(this, 'breweries', hasOne);
    }

    util.inherits(BreweryModel, BaseModel);

    return new BreweryModel ();

})();