var util = require("util");
var BaseModel = require("./baseModel");

module.exports = (function (){
    'use strict';

    function CountryModel () {
        BaseModel.call(this, 'countries');
    }

    util.inherits(CountryModel, BaseModel);

    return new CountryModel ();

})();