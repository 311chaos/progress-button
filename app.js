var App = angular.module('App', []);

App.controller('AppController', ['$scope', function($scope) {
    $scope.test = 'test';

    $scope.button3Value = 100;

    $scope.actionCompleted = function(msg) {
      console.log(msg);
    };
}]);

