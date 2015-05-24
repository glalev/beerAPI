var util = require("util");
var BaseModel = require("./baseModel");

var belongsTo = ['brewery', 'country', 'category', 'style'];
var hasOneOrMany = ['comments', 'ratings'];

module.exports = (function (){
    'use strict';

    function BeerModel () {
        BaseModel.call(this, 'beers', belongsTo, hasOneOrMany);
    }

    util.inherits(BeerModel, BaseModel);

    return new BeerModel (); //TODO check which is better 'return Module', or 'return new Module ()'
    //return new baseModel('beers', [{'breweries': 'brewery_id', 'countries': 'country_id'}]);

})();
