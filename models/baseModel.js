'use strict';

var Q = require('q');
var pluralize = require('pluralize');

var db = require('../database/db');
var schema = require('../database/schema.json');
var queryHelper = require('../helpers/query');

module.exports = (function () {
    var _table, _belongsTo, _hasOneOrMany, _foreignFields;

    return {
        use: function (tableToUse) {
            _table = tableToUse;
            _belongsTo = schema[_table].belongsTo || [];
            _hasOneOrMany = schema[_table].hasOneOrMany || [];
            _foreignFields = schema[_table].foreignFields || [];

            return this;
        },

        //just an alias for 'use'
        from: function (tableToUse) {
            return this.use.call(this, tableToUse);
        },

        get: function(id){
            var query = queryHelper.select({
                table: _table,
                where: {
                    id: id
                },
                foreignFields: _foreignFields
            });

            var _this = this;
            var hasOrBelongs = _belongsTo.concat(_hasOneOrMany);
            var extId = pluralize.singular(_table) + '_id'; //external Id for the main table - for beers is beer_id

            return db.getRow(query)
                .then(function(result){ //the initial row from the main table

                    if(!result) throw new Error ('No object with that id'); //No value was found

                    return Q.all(hasOrBelongs.map(function (foreignTable) { //getting the rows from all hasOneOrMany and belongsTo methods
                        var table, firstRowOnly, filter = {};

                        if (result[foreignTable + '_id']){
                            //belongsTo relationship
                            table = pluralize(foreignTable);
                            filter['id'] = result[foreignTable + '_id'];
                            firstRowOnly = true;

                        }else{
                            //hasOneOrMany relationship
                            table = foreignTable;
                            filter[extId] = result.id;
                            firstRowOnly = false;
                        }

                        return _this.from(table).getBy(filter, null, firstRowOnly)
                    })).then(function (additionResult) {
                        hasOrBelongs.forEach(function (value, index) {
                            //if there is no foreign object an empty string is set
                            result[value] = additionResult[index] || '';
                            /*deleting foreign ids otherwise there is repetition,
                             for instance we have brewery id in beer.brewery_id, and in brewery.id*/
                            delete result[value + '_id'];
                        });

                        return result;
                    })
                })
                .fail(function (err) {
                    console.error(err);
                    console.log(query);
                    return err; //TODO може би false да връша? Или да връща в различни неща взависимост дали е в dev mode или не.
                });

        },

        //use: baseModel.from('beers').getAll({page:1, perPage: 10, orderBy: 'name'});
        getAll: function (orderAndLimit) {
            var query = queryHelper.select({
                table: _table,
                orderAndLimit: orderAndLimit
            });

            return db.makeQuery(query)
                .fail(function (err) {
                    console.error(err);
                    console.log(query);
                    return err;
                });
        },

        //use: baseModel.from('beers').getBy({country_id: 20, style_id = 5'});
        getBy: function(where, orderAndLimit, firstRowOnly) {

            var query = queryHelper.select({
                table: _table,
                where: where,
                foreignFields: _foreignFields,
                orderAndLimit: orderAndLimit
            });

            var queryMethod = !firstRowOnly ? 'makeQuery' : 'getRow';

            return db[queryMethod](query)
                .fail(function (err) {
                    console.error(err);
                    console.log(query);
                    return err;
                });
        },

        /*
         use: baseModel.from('beers').getRandom(3, {style_id: 78, '!id': 4311})
         gets 3 random beers with style_id = 78 and id not equal 4311
         */
        //getRandom: function(numOfRows, fieldsAndValues) { //TODO това трябва да се пренапише
        //    //var where = queryHelper.getWhere(fieldsAndValues);
        //    //
        //    //var query = 'SELECT * FROM ' + _table + ', (SELECT id AS sid FROM ' +
        //    //    _table + where + ' ORDER BY RAND( ) LIMIT ' +
        //    //    numOfRows + ')tmp WHERE ' + _table +'.id = tmp.sid;';
        //    //
        //    //return db.makeQuery(query)
        //    //    .fail(function (err) {
        //    //        console.error(err);
        //    //        console.log(query);
        //    //        return err;
        //    //    });
        //},

        //use: baseModel.from('beers').count('style_id', {country_id: 31});
        count: function (){
            var args = Array.prototype.slice.call(arguments);
            var field, where;

            //if a field is provided the unique items of this item are counted, otherwise all records
            if(typeof args[0] === 'string'){
                field = args[0];
            }

            //if an object is provided with one of the two parameters the same is used for the where clause
            if(typeof args[0] === 'object'){
                where = args[0];
            }else if(typeof args[1] === 'object') {
                where = args[1];
            }

            var query = queryHelper.count({
                table: _table,
                field: field,
                where: where
            });

            return db.getRow(query)
                .fail(function (err) {
                    console.error(err);
                    console.log(query);
                    return err;
                });
        },

        //use: baseModel.from('beers').update(5920, {country_id: 20, style_id: 5})
        update: function(where, values) {
            if(!where) return new Error('a where clause must be provided for the update statment');

            //if the where is not an object but a number, an id is passed
            if(typeof where === 'number'){
                where = {id: where}
            }

            var query =  queryHelper.update({
                table: _table,
                where: where,
                values: values
            });

            return db.makeQuery(query)
                .then(function (result) {
                    if(!result.affectedRows){
                        throw new Error ('No object was affected');
                    }

                    return result;

                }).fail(function (err) {
                    console.error(err);
                    console.log(query);
                    return err;
                });
        },

        //use: baseModel.use('beers').insert({name: 'Kamenitza', country_id: 31, brewery_id: 1428});
        insert: function (fieldValues) {
            if(!Object.keys(fieldValues).length) return new Error ('No data provided for the insert clause');

            var query =  queryHelper.insert({
                table: _table,
                fieldValues: fieldValues
            });

            return db.makeQuery(query)
                .then(function (result) {
                    return result.insertId;
                }).fail(function (err) {
                    console.error(err);
                    console.log(query);
                    return err;
                });
        }
    }
}());