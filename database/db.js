'use strict';
/*TODO this is super duper ugly, has to be changed
 I changed a bit, though still may use some improvement
 and the 'bin' directory is probably no the best to put the file */
var mysql = require('mysql');
var Q = require('q');
var config = require('./config.json'); //TODO check significance of config.connectionLimit

function DB () {
    this.pool = mysql.createPool(config);
}

DB.prototype.makeQuery = function (query, onlyFirstRow) {
    //creating the deferred object
    var deferred = Q.defer();

    this.pool.getConnection(function(err, connection){
        if(err){
            //rejecting the promise if there is an error
            deferred.reject(err);
        }else{
            connection.query(query, function(err, rows){
                if (err) {
                    deferred.reject(err);
                }else{
                    //resolving the promise, with all rows or only the first depending on onlyFirstRow parameter
                    var result = onlyFirstRow ? rows[0] : rows;
                    deferred.resolve(result);
                }

                connection.release();
            });
        }
    });
    //returning the promise which shall be resolved or rejected
    return deferred.promise;
};

//making query and returning only the first row
DB.prototype.getRow = function (query) {
    return this.makeQuery(query, true)
};

module.exports = (function (){
    return new DB();
})();
