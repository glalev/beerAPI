var util = require("util");
var BaseModel = require("./baseModel");

module.exports = (function (){
    'use strict';

    function StyleModel () {
        BaseModel.call(this, 'styles');
    }

    util.inherits(StyleModel, BaseModel);

    return new StyleModel ();

})();
