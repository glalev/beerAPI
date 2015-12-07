'use strict';
var pluralize = require('pluralize');
var _ = require('underscore');

module.exports = (function () {
    /*****************************
     *  PRIVATE HELPER FUNCTIONS *
     *****************************/

    /*
     checks does the field has specific table
     for now simply check for '.' ;
     ex. beer.name has table and name does not;
     */
    function hasTable(field) {
        return field.indexOf('.') > -1;
    }

    //puts quotes around string
    function quotify(str) {
        if(typeof str !== 'string'){
            return new Error('Only strings can by quotified!');
        }

        return '\"' + str + '\"';
    }

    /*joins kye value pairs from object into string
     *
     * */
    function joinKeyValue(obj, pairsJoin, pairsSeparator, formatFunction) {
        var formatFn,
        //if pairsSeparator is provided the same is used, otherwise the default one (' = ')
            separator =  (_.isString(arguments[2])) ? pairsSeparator : ' = ';

        //checking if there is a format function
        if(_.isFunction(arguments[2])){
            formatFn = arguments[2];
        }else if(_.isFunction(arguments[3])){
            formatFn = arguments[3];
        }

        return _.map(obj, function (value, key) {

            //In case we want something to be NOT equal to some particular value
            if(key.indexOf('!') > -1){
                key = key.replace('!', '');
                separator = separator.replace('=', '!=');
            }

            //applying the format function, if such
            if(formatFn){
                var formattedPair = formatFn(key, value);
                key = formattedPair[0];
                value = formattedPair[1];
            }

            return key + separator + value;

        }).join(pairsJoin);
    }

    /************************************
     *  PRIVATE QUERY RELATED FUNCTIONS *
     ************************************/

    /*
     formats the provided fields, so the same may be used later in query;
     if the field does not have corresponding table the default table is used('table' parameter);
     */
    function getFields(table, fields) {
        if(!fields) return '';

        return _.map(fields, function (field) {
            if(hasTable(field)) return field;
            return table + '.' +  field;
        }).join(', ');
    }

    function getWhere(table, filter){
        if(!filter){
            return '';
        }
        table = table ? table + '.' : '';

        return ' WHERE ' + joinKeyValue(filter, ' AND ', function(key, val){
                var formattedKey = table + key;
                var formattedValue = (_.isString(val)) ? quotify(val) : val;
                return [formattedKey, formattedValue];
            });
    }

    //use: getJoins('beers', ['users.username', breweries.name]);
    function getJoins(table, foreignFields) {
        if(!foreignFields) return '';
        var foreignTables = [];
        //extracting all the foreign tables names
        _.each(foreignFields, function(field){
            var foreignTable = field.match(/^[^.]+(?=\.)/)[0]; //matching everything before the dot;
            if(foreignTables.indexOf(foreignTable) === -1){
                foreignTables.push(foreignTable);
            }
        });

        return _.map(foreignTables, function (foreignTable) {
            return ' LEFT JOIN ' + foreignTable + ' ON ' + table + '.' +
                pluralize.singular(foreignTable) + '_id = ' + foreignTable + '.id';
        }).join('');
    }

    function getOrderAndLimit(table, orderAndLimit){
        if(!orderAndLimit) return '';
        var orderBy, limit, desc;

        if(!orderAndLimit.orderBy){
            orderBy = ''
        }else{
            var field  = hasTable(orderAndLimit.orderBy) ? orderAndLimit.orderBy : table + '.' + orderAndLimit.orderBy;
            orderBy = ' ORDER BY ' + field;
        }

        limit = (orderAndLimit.page && orderAndLimit.perPage) ?
        ' LIMIT ' + ((orderAndLimit.page - 1) * orderAndLimit.perPage) + ', ' + orderAndLimit.perPage : '';

        desc = orderAndLimit.desc ? 'DESC' : '';

        return orderBy + desc + limit;
    }

    /*******************
     *  PUBLIC METHODS *
     *******************/
    return {
        select: function (config) {
            var table = config.table;
            var foreignFields = config.foreignFields || [];
            var ownFields = config.fields || ['*'];

            var fields = getFields(table, ownFields.concat(foreignFields));
            var where = getWhere(table, config.where);
            var join =  getJoins(table, foreignFields);
            var orderAndLimit = getOrderAndLimit(table, config.orderAndLimit);

            return 'SELECT ' + fields + ' FROM ' + table + join + where + orderAndLimit + ';';
            //return `SELECT ${fields} FROM ${table} ${join} ${where} ${orderAndLimit};`;
        },

        count: function (config) {
            config.field = config.field || '*';
            var table = config.table;

            //TODO тука се допука, че ако полето се split-ва на 3, значи е подадено във вид 'field as field';
            // Да добавя проверки или да го измисля по-добре;
            var splitField = config.field.split(' ');
            var counted = splitField[0];
            var name = splitField[2] || 'count';
            var distinct = counted !== '*' ? 'DISTINCT ' : ''; //туй, тъй също не ме кефи;
            var where =  getWhere(table, config.where);

            return 'SELECT COUNT(' + distinct + counted + ') AS ' + name + ' FROM ' + table + where + ';';

        },

        update: function (config) {
            var table = config.table;
            var where = getWhere(table, config.where);
            var values = joinKeyValue(config.values, ', ', function(key, val){
                var formattedValue = (_.isString(val)) ? quotify(val) : val;
                return [key, formattedValue];
            });

            return 'UPDATE ' + table + ' SET ' + values + where + ';';
        },

        insert: function (config) {
            var table = config.table;
            var fields = _.keys(config.fieldValues).join(', ');
            var values = _.values(config.fieldValues).map(function(value){
                if(!_.isString(value)) return value;
                return quotify(value);
            }).join(', ');

            return  'INSERT INTO ' + table + ' (' + fields + ')' + ' VALUES ' + '(' + values + ');';
        },
        //SELECT * FROM  `beers`WHERE name LIKE '%amst%' OR descript LIKE  '%ds%'
        search: function (config) {
            var table = config.table;
            var q = config.q;
            var fields = config.fields;
            //obj, pairsJoin, pairsSeparator, formatFunction
            var where = ' WHERE ' + fields.map(function(field){
                return field + ' LIKE "%' + q + '%"'
            }).join(' OR ');

           var selectFields = 'SELECT ' + getFields(table, '*') + ' FROM ' + table;

           return selectFields + where;

        }
    }
}());