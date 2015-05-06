var util = require("util");
var BaseModel = require("./baseModel");

module.exports = (function (){
    'use strict';

    function CommentModel () {
        BaseModel.call(this, 'comments');
    }

    util.inherits(CommentModel, BaseModel);

    return new CommentModel ();

})();