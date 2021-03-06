'use strict';

var projectsEntities = require('../entities/projects-entities'),
    buildsEntities = require('../entities/builds-entities'),
    httpStatuses = require('../components/http-statuses'),
    constants = require('../components/constants'),
    logger = require('../lib/logger/logger').init(),
    utils = require('../lib/utils/others'),
    config = require('../config/config'),
    path = require('path'),
    Q = require('q');


var addComandArg = function(argName, argValue, argsArray) {
    argsArray.push(argName);
    argsArray.push(argValue);
};

var runBuild = function (buildEntity, owner) {
    return Q.Promise(function (resolve, reject) {
        projectsEntities.findProjectByNameAndOwner(buildEntity.projectName, owner)
            .then(function (project) {
                if (project) {
                    var buildName = project.name + '-' + Date.now();
                    logger.debug('Project %s has been found', buildEntity.projectName);
                    var args = [constants.builder.uberScriptPath];
                    addComandArg('--build-name', buildName, args);
                    addComandArg('--project-owner', project.owner, args);
                    addComandArg('--project-name', project.name, args);
                    addComandArg('--project-version', buildEntity.projectVersion, args);
                    addComandArg('--github-url', project.url, args);
                    addComandArg('--destination', path.join(config.builder.workspace.path, owner, 'builds'), args);
                    addComandArg('--mongo-host', config.mongodb.host, args);
                    addComandArg('--mongo-port', config.mongodb.port, args);
                    addComandArg('--mongo-database-name', config.mongodb.databaseName, args);
                    addComandArg('--mongo-collection-name', constants.mongodb.collections.Builds, args);

                    if (project.isPrivate && project.username && project.password) {
                        addComandArg('--username', project.username, args);
                        addComandArg('--password', project.password, args);
                    }

                    if (buildEntity.steps.length) {
                        for(var i in buildEntity.steps) {
                            var scriptPath = null;
                            if (buildEntity.steps[i].public) {
                                scriptPath = path.join(constants.builder.commonScriptsPath, buildEntity.steps[i].scriptName + '.sh');
                            } else {
                                scriptPath = path.join(config.builder.workspace.path, owner, 'scripts', buildEntity.steps[i].scriptName + '.sh');
                            }
                            if (buildEntity.steps[i].args) {
                                addComandArg('--build-steps', '"bash ' + scriptPath + ' ' + buildEntity.steps[i].args + '"', args);
                            } else {
                                addComandArg('--build-steps', 'bash ' + scriptPath, args);
                            }
                        }
                    }

                    logger.debug('Spawning process: python ' + args);
                    utils.spawnProcess('python', args);
                    logger.debug('Building process has been triggered');
                    var response = {
                        buildName: buildName
                    }
                    resolve(response);
                } else {
                    utils.throwError(httpStatuses.Projects.NotExists);
                }
            })
            .catch(function (err) {
                logger.error('Error: ' + utils.translateError(err));
                reject(err);
            })
    });
};

var getBuildByName = function (name, owner) {
    return Q.Promise(function (resolve, reject) {
        buildsEntities.findBuildByNameAndOwner(name, owner)
            .then(function (build) {
                if (build) {
                    logger.debug('Build for ' + owner + ' found.');
                    resolve(build);
                } else {
                    utils.throwError(httpStatuses.Builds.NotExists);
                }
            })
            .catch(function (err) {
                logger.error('Error: ' + utils.translateError(err));
                reject(err);
            })
    });
};


var getBuildsByProjectName = function (projectName, owner) {
    return Q.Promise(function (resolve, reject) {
        buildsEntities.findBuildsByProjectNameAndOwner(projectName, owner)
            .then(function (builds) {
                logger.debug('Builds for %s project listed for user %s.', projectName, owner);
                resolve(builds);
            })
            .catch(function (err) {
                logger.error('Error: ' + utils.translateError(err));
                reject(err);
            })
    });
};

module.exports = {
    runBuild: runBuild,
    getBuildByName: getBuildByName,
    getBuildsByProjectName: getBuildsByProjectName
};
