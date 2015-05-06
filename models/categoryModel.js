var util = require("util");
var BaseModel = require("./baseModel");

module.exports = (function (){
    'use strict';

    function CategoryModel () {
        BaseModel.call(this, 'categories');
    }

    util.inherits(CategoryModel, BaseModel);

    return new CategoryModel ();

})();