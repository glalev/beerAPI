var util = require("util");
var BaseModel = require("./baseModel");

var belongsTo = [];
var hasOneOrMany = [];

module.exports = (function (){
    'use strict';

    function RatingModel () {
        BaseModel.call(this, 'ratings');
    }

    util.inherits(RatingModel, BaseModel);

    return new RatingModel (); //TODO check which is better 'return Module', or 'return new Module ()'
    //return new baseModel('beers', [{'breweries': 'brewery_id', 'countries': 'country_id'}]);

})();
