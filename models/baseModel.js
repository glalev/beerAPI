var Q = require('q');
var pluralize = require('pluralize');
var db = require('../bin/db');
var _ = require('underscore');

String.prototype.quotify = function() { //TODO probably this is not the best place for that particular function
    return '\"' + this + '\"';
};

module.exports = (function (){
    'use strict';

    var baseModel = function(table, hasOne, hasMany) {
        this.table = table;

        //how the id appears in foreign tables, for beers is beer_id
        this.externalID = pluralize(table, 1) + '_id';

        this.hasOne = hasOne || [];
        this.hasMany = hasMany || [];
        this.forignModels = [];
        this.loadForeign(this.hasOne, this.hasMany);
    };

    //TODO LIMIT and ORDER BY

    baseModel.prototype.get = function(id){
        var query = 'SELECT * FROM ' + this.table + ' WHERE id =' + id;
        var _this = this;

        /*all foreigner tables 'hasOne' have to be first for key - value consistency
        not very elegant but for now works TODO */
        var has = this.hasOne.concat(this.hasMany);

        return db.getRow(query)
            .then(function(value){ //the initial row from the main table

                if(!value) throw new Error ('No object with that id'); //No value was found

                return _this.join(value)//joining all hasOne and hasMany objects
                    .then(function(joined){
                        for (var i = 0, l = has.length; i < l; i++){

                            //if there is no foreign object an empty string is set
                            value[has[i]] = joined[i] || '';

                            /*deleting foreign ids otherwise there is repetition,
                            for instance we have brewery id in beer.brewery_id, and in brewery.id*/
                            delete value[has[i] + '_id'];
                        }

                        return value;
                    })
             })
            .fail(function (err) {
                console.error(err);
                return err; //TODO може би false да връша? Или да връща в различни неща взависимост дали е в dev mode или не.
            });

    };

    //exp.: beerModel.getAll();
    baseModel.prototype.getAll = function() {
        var query = 'SELECT * FROM ' + this.table;

        return db.makeQuery(query)
            .fail(function (err) {
                console.error(err);
                return err;
            });
    };

    //exp.: beerModel.getBy({country_id: 20, style_id = 5'});
    baseModel.prototype.getBy = function(fieldValue) {

        var filter = _.map(fieldValue, function(value, key){

            value = (_.isString(value)) ? value.quotify() : value;

            return key + ' = ' + value;

        }).join(' AND ');

        var query = 'SELECT * FROM ' + this.table + ' WHERE ' + filter + ';';

        return db.makeQuery(query)
            .fail(function (err) {
                console.error(err);
                return err;
            });
    };

    //exp.: beerModel.update(5920, {country_id: 20, style_id = 5'});
    baseModel.prototype.update = function(id, fieldValue) {

        var newValues = _.map(fieldValue, function(value, key){

            value = (_.isString(value)) ? value.quotify() : value;

            return key + ' = ' + value;

        }).join(', ');

        var query = 'UPDATE ' + this.table + ' SET ' + newValues + ' WHERE id = ' + id;

        return db.makeQuery(query)
            .then(function (result) {
                if(!result.affectedRows){
                    throw new Error ('No object was affected');
                }

                return result;

            }).fail(function (err) {
                console.error(err);
                return err;
            });


    };

    //exp.: beerModel.insert({name: 'Kamenitza', country_id: 31, brewery_id: 1428});
    baseModel.prototype.insert = function (fieldValue) {
        var fields = _.keys(fieldValue);
        var values = _.values(fieldValue).map(function(value){
            if(!_.isString(value)) return value;

            return value.quotify();
        });

        var query = 'INSERT INTO ' + this.table + ' (' + fields.join(', ') + ')' + ' VALUES ' + '(' + values.join(', ') + ');';
       // console.log(query);
        return db.makeQuery(query)
            .then(function (result) {
                return result.insertId;
            }).fail(function (err) {
                console.error(err);
                return err;
            });
    };

    baseModel.prototype.loadForeign = function(hasOne, hasMany) {

        //Зарежда моделите на таблиците от който търсим само един обект (e.g. beers has one brewery)
        for (var i = 0, l = hasOne.length; i < l; i++){
            var model = require('./' + hasOne[i] + 'Model');
            this.forignModels.push({name: model, key: hasOne[i] + '_id'});
        }

        /*Зарежда моделите на таблиците който съдържат ид-то на главния обект, като външно такова
        (e.g. beers may have many comments)*/
        for (var j = 0, l = hasMany.length; j < l; j++){
            var singular = pluralize(hasMany[j], 1)
            var model = require('./' + singular + 'Model');

            this.forignModels.push({name: model, key: 'id'});
        }

    };

    baseModel.prototype.join = function(value) {
        var _this = this;
        return Q.all(this.forignModels.map(function(model) {

            /*if the key is simply 'id', we have 'has many' relation,
            in that case we are getting all rows with the main object id*/
            if (model.key === 'id'){
                var filter = {}
                filter[_this.externalID] = value.id;

                return model.name.getBy(filter);

            //otherwise we have 'has one' relation
            }else{
                return model.name.get(value[model.key]);
            }
        })).spread(function () {
            return Array.prototype.slice.call(arguments);
        });
    };

    return baseModel;

})();
