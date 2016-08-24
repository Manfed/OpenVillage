'use strict';

var _ = require('lodash'),
    projectsManager = require('../../../api/projects'),
    schemaValidator = require('../../../lib/schema-validator'),
    projectsSchemas = require('../../../schemas/projects-schema.json'),
    httpStatuses = require('../../../components/http-statuses');

exports.addNewProject = function (req, res) {
    var errors = schemaValidator.validate(req.body, projectsSchemas.addNewProject).errors;
    if (errors.length) {
        res.status(400).send(errors);
        return;
    }
    projectsManager.addNewProject(req.body, req.user.username)
        .then(function (result) {
            res.send(result);
        })
        .catch(function (err) {
            res.status(err.status || httpStatuses.Generic.InternalServerError.status).send(err);
        });
};

exports.deleteProject = function (req, res) {
    projectsManager.deleteProject(req.params.name, req.user.username)
        .then(function (result) {
            res.send(result);
        })
        .catch(function (err) {
            res.status(err.status || httpStatuses.Generic.InternalServerError.status).send(err);
        });
};
