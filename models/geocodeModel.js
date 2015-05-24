var util = require("util");
var BaseModel = require("./baseModel");

var belongsTo = [];
var hasOneOrMany = [];

module.exports = (function (){
    'use strict';

    function GeocodeModel () {
        BaseModel.call(this, 'geocodes', belongsTo, hasOneOrMany);
    }

    util.inherits(GeocodeModel, BaseModel);

    return new GeocodeModel ();

})();