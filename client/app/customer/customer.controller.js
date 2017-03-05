(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', '$mdBottomSheet', 'customerService', 'customerGroupService', customerCtrl]);

    function customerCtrl($scope, $window, $location, $mdBottomSheet, customerService, customerGroupService) {
        
        $scope.query = $location.search();

        $scope.$watch('query', function(query) {

            $location.search(query);
            
            customerService.query(query).$promise.then(function(customers) {
                $scope.customers = customers;
            });
            
        }, true);

        $scope.arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup'];

        $scope.arrayQueryParams.forEach(function(key) {
            if (!$scope.query[key]) {
                $scope.query[key] = [];
            }
            else if (!Array.isArray($scope.query[key])) {
                $scope.query[key] = [$scope.query[key]];
            }
        });

        $scope.customerKeys = [
            {key:'mobile', label:'手机号码', show:true},
            {key:'province', 'label':'居住城市', show:true},
            {key:'sex', 'label':'性别', show:true},
            {key:'tags', 'label':'标签', show:true},
            {key:'nuid', label:'NUID'},
            {key:'carrier', label:'手机号运营商'},
            {key:'mobileAge', label:'手机号入网年限'},
            {key:'studyCity', label:'就学城市'},
            {key:'workingCity', label:'工作城市'},
            {key:'sexualOrientation', label:'性取向'},
            {key:'creditCards', label:'信用卡数量'},
            {key:'hasChild', label:'有孩子'},
            {key:'annualSalary', label:'年收入'},
            {key:'education', label:'学历'},
            {key:'age', label:'年龄'},
            {key:'marriage', label:'婚否'}
        ];

        $scope.customerGroups = customerGroupService.query();

        $scope.showKey = function(key) {
            key.show = true;
        }

        $scope.getPossibleKeys = function(searchText) {
            return $scope.customerKeys.filter(function(key) {
                return (!searchText || key.label.search(searchText) > -1) && !key.show;
            });
        }

        $scope.getTags = function(searchText) {
            
            var possibleTags = [];
            $scope.customers.forEach(function(customer) {
                customer.tags.forEach(function(tag) {
                    if(possibleTags.indexOf(tag) === -1) {
                        possibleTags.push(tag);
                    }
                });
            });

            if(searchText) {
                possibleTags = possibleTags.filter(function(tag) {
                    return tag.search(searchText) > -1;
                });
            }

            possibleTags = possibleTags.filter(function(tag) {
                return $scope.query.withTags.indexOf(tag) === -1
                    && $scope.query.withoutTags.indexOf(tag) === -1
            });

            return possibleTags;
        }

        $scope.removePreciseQueryParams = function() {
            
            var query = {};
            
            $scope.arrayQueryParams.forEach(function(key) {
                query[key] = $scope.query[key];
            });

            $scope.query = query;
        };

        $scope.$watch('preciseSearchText', function(preciseSearchText) {
            
            $scope.removePreciseQueryParams();
            
            if(!preciseSearchText) {
                return;
            }

            preciseSearchText.split('&').forEach(function(pairString) {
                
                var match = pairString.match(/(\S+)=(\S+)/);
                var key, value;
                var param;

                if(!match) {
                    return;
                }

                key = match[1]; value = match[2];

                $scope.customerKeys.forEach(function(customerKey) {
                    if(customerKey.label === key) {
                        key = customerKey.key;
                        $scope.query[key] = value;
                    }
                    else if(customerKey.key === key) {
                        $scope.query[key] = value;
                    }
                });

            });
        });

        $scope.$watch('inGroup', function(inGroup) {
            if(!inGroup) {
                $scope.query.inGroup = null;
            }
            else {
                $scope.query.inGroup = inGroup.map(function(group) {
                    return group._id;
                });
            }
        }, true);

        $scope.$watch('notInGroup', function(notInGroup) {
            if(!notInGroup) {
                $scope.query.notInGroup = null;
            }
            else {
                $scope.query.notInGroup = notInGroup.map(function(group) {
                    return group._id;
                });
            }
        }, true);

        if(!$scope.inGroup) {
            $scope.inGroup = [];
        }

        if(!$scope.notInGroup) {
            $scope.notInGroup = [];
        }

        $scope.addInGroup = function(group) {
            $scope.inGroup.push(group);
        };

        $scope.addNotInGroup = function() {
            $scope.notInGroup.push(group);
        }

        $scope.editGroup = function(group) {
            if(!group) {
                group = new customerGroupService();
                group.showKeys = $scope.customerKeys.filter(function(key) {
                    return key.show;
                });
                group.query = $scope.query;
            }

            $scope.group = group;

            $mdBottomSheet.show({
                templateUrl: 'app/customer/create-group-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.updateGroup = function(group) {
            group.$save();
            $mdBottomSheet.hide();
            $scope.group = undefined;
        };

        $scope.removeGroup = function(groupToRemove) {
            
            if(!confirm('确定要删除访客组"' + groupToRemove.name + '"？')) {
                return;
            }

            $scope.customerGroups = $scope.customerGroups.filter(function(group) {
                return groupToRemove._id !== group._id;
            });
            
            groupToRemove.$delete();
        };
    }
    
})(); 
