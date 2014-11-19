var App = angular.module('App', []);

App.controller('AppController', ['$scope', function($scope) {
    $scope.test = 'test';

    $scope.button3Value = 29;

    $scope.actionCompleted = function(msg) {
      console.log(msg);
    };
}]);

