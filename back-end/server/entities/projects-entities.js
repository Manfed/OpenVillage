'use strict';
var mongo = require('mongoskin'),
    config = require('../config/config'),
    collection = require('../components/constants').mongodb.collections.Projects,
    Q = require('q'),
    db = mongo.db(config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.databaseName, {native_parser: true});

db.bind(collection);

module.exports.addProject = function (project) {
    return Q.Promise(function (resolve, reject) {
        db[collection].insert(project, function (err, result) {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });
};

module.exports.findProjectByNameAndOwner = function (name, owner) {
    return Q.Promise(function (resolve, reject) {
        db[collection].findOne({name: name, owner: owner}, function (err, result) {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });
};

module.exports.deleteProjectByNameAndOwner = function (name, owner) {
    return Q.Promise(function (resolve, reject) {
        db[collection].remove({name: name, owner: owner}, function (err, result) {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });
};

module.exports.findProjectsByOwner = function (owner) {
    return Q.Promise(function (resolve, reject) {
        db[collection].find({owner: owner}).toArray(function (err, result) {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });
};
