var Q = require('q');
var pluralize = require('pluralize');
var db = require('../database/db');
var _ = require('underscore');

function quotify(str) {
    if(typeof str !== 'string'){
        return new Error('Only strings can by quotified!');
    }

    return '\"' + str + '\"';
}

function getOrderAndLimit(orderAndLimit){
    var limit  = (orderAndLimit.page && orderAndLimit.perPage) ?
        ' LIMIT ' + ((orderAndLimit.page-1) * orderAndLimit.perPage) + ', ' + orderAndLimit.perPage :
        '';

    var orderBy = orderAndLimit.orderBy ? ' ORDER BY ' + orderAndLimit.orderBy : '';

    return orderBy + limit;
}

function joinKeyValue(obj, pairsJoin, pairsSeparator) {
    pairsSeparator = pairsSeparator || ' = '
    return _.map(obj, function (value, key) {

        //In case we want something to be NOT equal to some particular value
        if(key.indexOf('!') > -1){
            key = key.replace('!', '');
            pairsSeparator = pairsSeparator.replace('=', '!=');
        }

        value = (_.isString(value)) ? quotify(value) : value;

        return key + pairsSeparator + value;

    }).join(pairsJoin);
}


function getWhereClause (filter){
    if(!filter){
        return '';
    }

    return ' WHERE ' + joinKeyValue(filter, ' AND ');
}


module.exports = (function (){
    'use strict';

    var baseModel = function(table, belongsTo, hasOneOrMany) {
        this.table = table;

        //how the id appears in foreign tables, for beers is beer_id
        this.externalID = pluralize(table, 1) + '_id';

        this.belongsTo = belongsTo || [];
        this.hasOneOrMany = hasOneOrMany || [];
        //this.loadForeign(this.belongsTo, this.hasOneOrMany);
    };

    baseModel.prototype.get = function(id){
        var where = getWhereClause({id: id});
        var query = 'SELECT * FROM ' + this.table + where + ';';
        var _this = this;

        /*all foreigner tables 'belongsTo' have to be first for key - value consistency
        not very elegant but for now works TODO */
        var has = this.belongsTo.concat(this.hasOneOrMany);

        return db.getRow(query)
            .then(function(value){ //the initial row from the main table

                if(!value) throw new Error ('No object with that id'); //No value was found

                return _this.join(value)//joining all belongsTo and hasOneOrMany objects
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

    //use: beerModel.getAll();
    baseModel.prototype.getAll = function (orderAndLimit) { //TODO
        orderAndLimit = (orderAndLimit) ? getOrderAndLimit(orderAndLimit) : '';

        var query = 'SELECT * FROM ' + this.table + orderAndLimit + ';';
        this.count();
        return db.makeQuery(query)
            .fail(function (err) {
                console.error(err);
                return err;
            });
    };

    //use: beerModel.getBy({country_id: 20, style_id = 5'});
    baseModel.prototype.getBy = function(fieldsAndValues, orderAndLimit) {

        orderAndLimit = (orderAndLimit) ? getOrderAndLimit(orderAndLimit) : '';

        var where = getWhereClause(fieldsAndValues);

        var query = 'SELECT * FROM ' + this.table + where + orderAndLimit + ';';

        return db.makeQuery(query)
            .fail(function (err) {
                console.error(err);
                return err;
            });
    };

    /*
        use: beerModel.getRandom(3, {style_id: 78, '!id': 4311})
        gets 3 random beers with style_id = 78 and id not equal 4311
    */
    baseModel.prototype.getRandom = function(numOfRows, fieldsAndValues) {
        var where = getWhereClause(fieldsAndValues);

        var query = 'SELECT * FROM ' + this.table + ', (SELECT id AS sid FROM ' +
            this.table + where + ' ORDER BY RAND( ) LIMIT ' +
            numOfRows + ')tmp WHERE ' + this.table +'.id = tmp.sid;';

        return db.makeQuery(query)
            .fail(function (err) {
                console.error(err);
                return err;
            });
    };

    //use: beerModel.count('style_id', {country_id: 31});
    baseModel.prototype.count = function (){
        var args = Array.prototype.slice.call(arguments);
        var field = '*';
        var where = '';

        //if a field is provided the unique items of this item are counted, otherwise all records
        if(typeof args[0] === 'string'){
            field = 'DISTINCT ' + args[0];
        }

        //if an object is provided with one of the two parameters the same is used for the where clause
        if(typeof args[0] === 'object'){
            where = getWhereClause(args[0]);
        }else if(typeof args[1] === 'object') {
            where = getWhereClause(args[1]);
        }

        var query = 'SELECT COUNT(' + field + ') AS count FROM ' + this.table + where + ';';

        return db.getRow(query)
            .fail(function (err) {
                console.error(err);
                return err;
            });
    };

    //use: beerModel.update(5920, {country_id: 20, style_id: 5})
    baseModel.prototype.update = function(id, fieldValue) {

        var newValues = joinKeyValue(fieldValue, ', ');
        var where = getWhereClause({id: id});
        var query = 'UPDATE ' + this.table + ' SET ' + newValues + where + ';';

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

    //use: beerModel.insert({name: 'Kamenitza', country_id: 31, brewery_id: 1428});
    baseModel.prototype.insert = function (fieldValue) {
        if(_.isEmpty(fieldValue)) return new Error ('No data provided for the insert clause');

        var fields = _.keys(fieldValue);
        var values = _.values(fieldValue).map(function(value){
            if(!_.isString(value)) return value;

            return quotify(value);
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


    baseModel.prototype.loadForeign = function(belongsTo, hasOneOrMany) {
        var foreignModels = [];
        //Зарежда моделите на таблиците към който основния обект принадлежи (e.g. beers belongsTo brewery)
        for (var i = 0, l = belongsTo.length; i < l; i++){
            var model = require('./' + belongsTo[i] + 'Model');
            foreignModels.push({name: model, key: belongsTo[i] + '_id'});
        }

        /*Зарежда моделите на таблиците който съдържат ид-то на главния обект, като външно такова
        (e.g. beers may have zero, one or many comments)*/
        for (var j = 0, l = hasOneOrMany.length; j < l; j++){
            var singular = pluralize(hasOneOrMany[j], 1)
            model = require('./' + singular + 'Model');

            foreignModels.push({name: model, key: 'id'});
        }
        return foreignModels;

    };

    baseModel.prototype.join = function(value) {
        var foreignModels  = this.loadForeign(this.belongsTo, this.hasOneOrMany);
        var _this = this;

        return Q.all(foreignModels.map(function(model) {

            /*if the key is simply 'id', we have 'hasOneOrMany' relation,
            in that case we are getting all rows with the main object id*/
            if (model.key === 'id'){
                var filter = {};
                filter[_this.externalID] = value.id;

                return model.name.getBy(filter);

            //otherwise we have 'belongsTo' relation
            }else{
                return model.name.getBy({id: value[model.key]});
            }
        })).spread(function () {
            return Array.prototype.slice.call(arguments);
        });
    };

    return baseModel;

})();
