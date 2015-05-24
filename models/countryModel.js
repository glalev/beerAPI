var util = require("util");
var BaseModel = require("./baseModel");

var belongsTo = [];
var hasOneOrMany = [];

module.exports = (function (){
    'use strict';

    function CountryModel () {
        BaseModel.call(this, 'countries', belongsTo, hasOneOrMany);
    }

    util.inherits(CountryModel, BaseModel);

    return new CountryModel ();

})();