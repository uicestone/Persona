(function () {
    'use strict';

    angular.module('app.client')
    .controller('clientCtrl', ['$scope', '$window', clientCtrl]);

    function clientCtrl($scope, $window) {
        $scope.query = {withTags:[], withoutTags:[]};
        $scope.showKeys = [
            {key:'mobile', label:'手机号码', show:true},
            {key:'name', 'label':'姓名', show:true},
            {key:'region', 'label':'地区', show:true},
            {key:'sex', 'label':'性别', show:true},
            {key:'tags', 'label':'标签', show:true}
        ];
        $scope.otherKeys = [
            {key:'education', label:'学历'},
            {key:'age', label:'年龄'},
            {key:'marriage', label:'婚否'}
        ];
    }
    
})(); 



