/// <reference path="../angular.js" />
/// <reference path="../angular-resource.js" />
var app = angular.module('jabbrApp', [
    'ngRoute',
    'ngResource',
    'ngSanitize'
])
.config(function ($routeProvider) {
    $routeProvider.when('/rooms/lobby', {
        templateUrl: 'areas/rooms/lobby.html',
        title: 'Lobby',
        controller: 'LobbyController'
    });
})
.constant('jabbrConnection', window.jQuery.connection)
.constant('jabbrChat', window.chat)
.constant('$ui', $(window.chat.ui))
.service('roomService', ['jabbrChat', function (jabbrChat) {
            
    return {
        joinRoom: function(room) {
            var $ui = $(jabbrChat.ui);
            $ui.trigger(jabbrChat.ui.events.openRoom, [room.Name]);
        }
    }
}])
.constant('translate', function (resource) {
    return window.chat.utility.getLanguageResource(resource);
})
.controller('LobbyController', ['$scope', '$log', 'jabbrConnection', 'roomService', function ($scope, $log, jabbrConnection) {

    $scope.title = 'Lobby'; // Todo: this should be removed
    $scope.rooms = [];
    $scope.roomSearchText = '';
    $scope.showClosedRooms = false;
    $scope.pageSize = 100;
    $scope.pagesShown = 1;

    $scope.privateRooms = [];
    $scope.publicRooms = [];

    // Todo: make a filter for private rooms instead of this long function
    $scope.$watch('rooms | filter:{Private: true} | filter:roomSearchText | filter:(showClosedRooms || !showClosedRooms && room.Closed) | limitTo: itemsLimit()', function (selectedCompanies) {
        $scope.privateRooms = selectedCompanies;
    }, true);

    // Todo: make a filter for public rooms instead of this long function
    $scope.$watch('rooms | filter:{Private: false} | filter:roomSearchText | filter:(showClosedRooms || !showClosedRooms && room.Closed) | limitTo: itemsLimit()', function (selectedCompanies) {
        $scope.publicRooms = selectedCompanies;
    }, true);

    jabbrConnection.hub.stateChanged(function (change) {

        $log.info(change.newState);

        if (change.newState === jabbrConnection.connectionState.connected) {

            $log.info('Connected');

            jabbrConnection.chat.server.getRooms()
                .done(function (rooms) {

                    $log.info('getRooms returned: ' + rooms.length);
                    $scope.rooms = rooms;
                    $scope.$apply();
                })
                .fail(function (e) {
                    $log.error('getRooms failed: ' + e);
                });
        }
    });
}])
.controller('LobbyPublicRoomsController', ['$scope', 'roomService', function ($scope, roomService) {

    $scope.isPrivate = false;

    $scope.hasMoreItems = function () {
        return $scope.pagesShown < ($scope.rooms.length / $scope.pageSize);
    };

    $scope.joinRoom = function (event, room) {
        $log.info('Joining room: ' + room.Name);
        roomService.joinRoom(room);
    };

}])
.controller('LobbyPrivateRoomsController', ['$scope', 'roomService', function ($scope, roomService) {

    $scope.isPrivate = true;

    $scope.itemsLimit = function () {
        return $scope.rooms.length;
    };

    $scope.joinRoom = function (event, room) {
        $log.info('Joining room: ' + room.Name);
        roomService.joinRoom(room);
    };
}])
.directive('jabbrLobby', function () {
    return {
        restrict: 'A',
        templateUrl: 'Scripts/app/areas/rooms/lobby.html'
    };
})
.directive('jabbrLobbyRooms', ['$log', 'translate', function ($log, roomService) {
    return {
        restrict: 'A',
        scope: {
            rooms: '=',
            isPrivate: '=',
        },
        templateUrl: 'Scripts/app/areas/rooms/lobby-rooms.html',
    }
}])
.run(['$rootScope', 'translate', function ($rootScope, translate) {

    // Set translate function on rootScope so we can access it in the view like t(code)
    $rootScope.t = translate;
}]);
