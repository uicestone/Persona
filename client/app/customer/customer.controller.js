(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', 'customerService', customerCtrl]);

    function customerCtrl($scope, $window, $location, customerService) {
        
        $scope.query = {withTags:[], withoutTags:[]};
        
        $scope.showKeys = [
            {key:'mobile', label:'手机号码', show:true},
            {key:'livingCity', 'label':'居住城市', show:true},
            {key:'sex', 'label':'性别', show:true},
            {key:'tags', 'label':'标签', show:true}
        ];

        $scope.otherKeys = [
            {key:'education', label:'学历'},
            {key:'age', label:'年龄'},
            {key:'marriage', label:'婚否'}
        ];

        $scope.$watch('query', function(query) {
            $location.search(query);
            $scope.customers = customerService.query(query);
        }, true);
    }
    
})(); 
