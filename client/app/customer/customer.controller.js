(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', '$mdBottomSheet', 'customerService', 'customerGroupService', customerCtrl]);

    function customerCtrl($scope, $window, $location, $mdBottomSheet, customerService, customerGroupService) {
        
        $scope.query = {};

        // 检测query的变化并改变路由
        $scope.$watch('query', function(query) {

            // $location.search(query);
            
            customerService.query(query).$promise.then(function(customers) {
                $scope.customers = customers;
            });
            
        }, true);

        // 除了这几个query字段，其他的被认为是精确字段
        $scope.arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup'];
        $scope.advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];

        // 初始化数组query字段
        $scope.arrayQueryParams.forEach(function(key) {
            if (!$scope.query[key]) {
                $scope.query[key] = [];
            }
            else if (!Array.isArray($scope.query[key])) {
                $scope.query[key] = [$scope.query[key]];
            }
        });

        // 初始化高级搜索query字段
        $scope.advancedQueryParams.forEach(function(key) {
            if($scope.query[key]) {
                $scope.query[key] = Number($scope.query[key]);
            }
        });

        // 访客字段
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

        // 显示字段
        $scope.showKey = function(key) {
            key.show = true;
        };

        // 自动完成时备选的显示字段
        $scope.getPossibleKeys = function(searchText) {
            return $scope.customerKeys.filter(function(key) {
                return (!searchText || key.label.search(searchText) > -1) && !key.show;
            });
        };

        // 自动完成时备选的标签
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
        };

        // 将数组型query字段复制，清空其他的query字段
        function removePreciseQueryParams() {
            
            var query = {};
            
            $scope.arrayQueryParams.forEach(function(key) {
                query[key] = $scope.query[key];
            });

            $scope.advancedQueryParams.forEach(function(key) {
                query[key] = $scope.query[key];
            });

            $scope.query = query;
        }

        // 监听精准搜索框的改变，将其应用到query中
        $scope.$watch('preciseSearchText', function(preciseSearchText) {
            
            removePreciseQueryParams();
            
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
                    // 支持将搜索的中文key转化为对应的英文key
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

        // 由于inGroup和notInGroup不是简单数组，因此监听其改变，并同步到query中的简单数组
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

        // inGroup和notInGroup需要初始值
        if(!$scope.inGroup) {
            $scope.inGroup = [];
        }

        if(!$scope.notInGroup) {
            $scope.notInGroup = [];
        }

        // 属于访客分组
        $scope.addInGroup = function(group) {
            $scope.inGroup.push(group);
        };

        // 不属于访客分组
        $scope.addNotInGroup = function() {
            $scope.notInGroup.push(group);
        }

        // 编辑分组
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
            if(!group._id) {
                $scope.customerGroups.push(group);
            }
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
