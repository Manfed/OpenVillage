'use strict';

angular.module('openvillage')
    .controller('ProjectDetailsCtrl', function ($scope, usersService, projectsService, scriptsService, buildsService,
                                                $window, $stateParams, SweetAlert, $state, DTOptionsBuilder,
                                                DTColumnDefBuilder, $interval) {

        $scope.userName = $window.sessionStorage.sessionUsername;
        $scope.projectName = $stateParams.name;
        $scope.projectVersion = 'master';
        $scope.projectStatusDetails = '';
        var buildWatcher = null;
        $scope.buildName = null;
        $scope.isProjectBuilding = false;
        $scope.projectStatus = -1; // 2-during,0-ok,1-error
        $scope.selectedTasks = [];

        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withOption('bFilter', false)
            .withOption('order', [1, 'asc'])
            .withOption('lengthMenu', [2, 5, 10, 20, 50])
            .withOption('pageLength', 5);

        $scope.dtColumnDefs = [
            DTColumnDefBuilder.newColumnDef(2).notSortable()
        ];

        $scope.dtOptionsPublicScripts = DTOptionsBuilder.newOptions()
            .withOption('bFilter', false)
            .withOption('order', [0, 'asc'])
            .withOption('lengthMenu', [2, 5, 10, 20, 50])
            .withOption('pageLength', 5);

        $scope.dtColumnDefsPublicScripts = [
            DTColumnDefBuilder.newColumnDef(1).notSortable()
        ];

        $scope.getProjectDetails = function() {
            projectsService.getProjectDetails($scope.projectName)
                .then(function (res) {
                    $scope.projectDetails = res;
                }, function (err) {
                    console.log(err);
                    SweetAlert.swal({
                        title: 'Error occurred',
                        type: 'error',
                        text: JSON.stringify(err)
                    });
                });
        };

        $scope.getScriptsList = function() {
            scriptsService.getList()
                .then(function(res) {
                    $scope.scripts = res.scripts;
                    scriptsService.getDefaultList()
                        .then(function(res) {
                            $scope.scriptsPublic = res.scripts;
                        }, function (err) {
                            console.log(err);
                            SweetAlert.swal({
                                title: 'Error occurred',
                                type: 'error',
                                text: JSON.stringify(err)
                            });
                        });

                }, function (err) {
                    console.log(err);
                    SweetAlert.swal({
                        title: 'Error occurred',
                        type: 'error',
                        text: JSON.stringify(err)
                    });
                });
        };

        $scope.deleteScript = function(scriptName, index) {
            SweetAlert.swal({
                title: 'Are you sure?',
                text: 'You will not be able to recover this script!',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: false
            }, function(isConfirm) {
                if(!isConfirm) {
                    return;
                }

                scriptsService.deleteScript(scriptName)
                    .then(function() {
                        $scope.scripts.splice(index, 1);
                        SweetAlert.swal({
                            title: 'Deleted!',
                            text: 'Your script has been deleted.',
                            type: 'success'
                        });
                    }, function (err) {
                        console.log(err);
                        SweetAlert.swal({
                            title: 'Error occurred',
                            type: 'error',
                            text: JSON.stringify(err)
                        });
                    });
            });
        };

        $scope.getBuildDetails = function() {
            buildsService.getBuildByName($scope.buildName)
                .then(function (res) {
                    $scope.projectStatusDetails = 'Status code: '+ res.status_code;
                    var currentStep = '';
                    var i=0;
                    for(i=0; i<res.steps.length; i++) {
                        var step = res.steps[i];

                        currentStep = ' Current step: (' + step.order + ') ' + step.name;
                        if(step.status_code !== 0 && step.status_code !== 1) {
                            break;
                        }
                    }

                    $scope.projectStatusDetails += currentStep;
                    $scope.setBuildProgressBar(i, res.steps.length);

                    if(res.status_code === 0) {
                        $scope.stopWatchingBuild();
                        $scope.projectStatus = 0;
                        $scope.setBuildProgressBarSuccess();
                        return;
                    }
                    else if(res.status_code === 1) {
                        $scope.stopWatchingBuild();
                        $scope.projectStatus = 1;
                        $scope.setBuildProgressBarFailure();
                        return;
                    }

                }, function (err) {
                    console.log(err);
                    SweetAlert.swal({
                        title: 'Error occurred',
                        type: 'error',
                        text: JSON.stringify(err)
                    });
                });
        };

        $scope.runBuild = function() {
            $scope.isProjectBuilding = true;
            $scope.setBuildProgressBar(0, 1);
            $scope.projectStatus = 2;
            $scope.setBuildProgressBarActive();

            var body = {
                'projectVersion': $scope.projectVersion,
                'projectName': $scope.projectName,
                'steps': $scope.selectedTasks
            };

            buildsService.runBuild(body)
                .then(function (res) {
                    $scope.buildName = res.buildName;
                    buildWatcher = $interval(function() {
                        $scope.getBuildDetails();
                    }, 1000);
                }, function (err) {
                    console.log(err);
                    SweetAlert.swal({
                        title: 'Error occurred',
                        type: 'error',
                        text: JSON.stringify(err)
                    });
                });
        };

        $scope.stopWatchingBuild = function() {
            if (angular.isDefined(buildWatcher)) {
                $interval.cancel(buildWatcher);
                buildWatcher = undefined;
                $scope.isProjectBuilding = false;
            }
        };

        $scope.$on('$destroy', function() {
            // Make sure that the interval is destroyed too
            $scope.stopWatchingBuild();
        });

        $scope.setBuildProgressBar = function(currentStep, maxStep) {
            var value = currentStep / maxStep * 100;
          $('#buildInnerProgressBar').css('width', value+'%');
        };

        $scope.setBuildProgressBarSuccess = function() {
            $('#buildInnerProgressBar').removeClass('progress-bar-danger');
            $('#buildInnerProgressBar').removeClass('progress-bar-info');
            $('#buildProgressBar').removeClass('active');
        };

        $scope.setBuildProgressBarFailure = function() {
            $('#buildInnerProgressBar').removeClass('progress-bar-info');
            $('#buildInnerProgressBar').addClass('progress-bar-danger');
            $('#buildProgressBar').removeClass('active');
        };

        $scope.setBuildProgressBarActive = function() {
            $('#buildInnerProgressBar').removeClass('progress-bar-danger');
            $('#buildInnerProgressBar').addClass('progress-bar-info');
            $('#buildProgressBar').addClass('active');
        };

        $scope.sortableOptions = {
            connectWith: '.connectList'
        };

        $scope.queueTask = function(taskName, isPublic) {
            SweetAlert.swal({
                title: taskName,
                text: 'Add arguments if required:',
                type: 'input',
                showCancelButton: true,
                closeOnConfirm: false,
                inputPlaceholder: 'Arguments go here'
            }, function(inputValue) {
                if (inputValue === false) {
                    return false;
                }

                var newTask = {
                    'scriptName': taskName,
                    'public': isPublic,
                    'args': inputValue
                };

                $scope.selectedTasks.push(newTask);
                SweetAlert.swal({
                    title: 'Added!',
                    text: 'Step has been added to queue.',
                    type: 'success'
                });
            });
        };

        $scope.removeTask = function(pos) {
            SweetAlert.swal({
                title: 'Are you sure?',
                text: 'You will remove this task from your build steps',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: false
            }, function(isConfirm) {
                if(!isConfirm) {
                    return;
                }

                $scope.selectedTasks.splice(pos, 1);
                SweetAlert.swal({
                    title: 'Deleted!',
                    text: 'Step has been deleted.',
                    type: 'success'
                });
            });
        };

    });