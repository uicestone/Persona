(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', '$mdBottomSheet', '$mdToast', 'customerService', 'customerGroupService', 'customerFieldService', 'customerReachingService', customerCtrl]);

    function customerCtrl($scope, $window, $location, $mdBottomSheet, $mdToast, customerService, customerGroupService, customerFieldService, customerReachingService) {
        
        $scope.query = $location.search();

        if(!$scope.query.page) {
            $scope.query.page = 1
        }

        if(!$scope.query.limit) {
            $scope.query.limit = 20;
        }

        // 检测query的变化并改变路由
        $scope.$watch('query', function(query) {

            $location.replace().search(query);
            
            $scope.promise = customerService.query(query).$promise.then(function(customers) {
                $scope.customers = customers;
            });
            
        }, true);

        // 除了这几个query字段，其他的被认为是精确字段
        $scope.arrayQueryParams = ['withTags', 'withoutTags', 'inGroup', 'notInGroup'];
        $scope.advancedQueryParams = ['rank', 'consumingWilling', 'consumingFrequency', 'consumingTendency', 'comsumingAbility', 'consumingReturning', 'consumingLayalty', 'creditRanking', 'consumingDriven'];
        $scope.utilQueryParams = ['token', 'export', 'fields', 'limit', 'page', 'skip'];

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
        $scope.customerFields = customerFieldService.query();
        
        $scope.customerFields.$promise.then(function(customerFields){
            $scope.customerFieldKeys = {};
            customerFields.forEach(function(customerField) {
                $scope.customerFieldKeys[customerField.label] = customerField.key;
            });
        });

        $scope.customerGroups = customerGroupService.query();

        $scope.queryCustomerReachings = {page: 1, limit: 20};
        
        $scope.getCustomerReachings = function() {
            $scope.promiseCustomerReachings = customerReachingService.query($scope.queryCustomerReachings).$promise.then(function(customerReachings) {
                $scope.customerReachings = customerReachings;
            });
        };

        $scope.getCustomerReachings();

        $scope.getCustomers = function() {};

        $scope.showingCustomerFields = [];

        // 显示字段
        $scope.showCustomerField = function(field) {
            
            if(!field || $scope.showingCustomerFields.indexOf(field) > -1) {
                return;
            }

            $scope.showingCustomerFields.push(field);
            $scope.searchOtherFieldsText = null;
        };

        $scope.hideCustomerField = function(fieldToRemove) {
            $scope.showingCustomerFields = $scope.showingCustomerFields.filter(function(field) {
                return field.key !== fieldToRemove.key;
            });
        }

        // 自动完成时备选的显示字段
        $scope.getPossibleFields = function(searchText) {
            return $scope.customerFields.filter(function(field) {
                return (!searchText || field.label.search(searchText) > -1)
                    && $scope.showingCustomerFields.map(function(field) { return field.key; }).indexOf(field.key) === -1;
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

            $scope.utilQueryParams.forEach(function(key) {
                query[key] = $scope.query[key];
            });

            $scope.query = query;
        }

        // 精确搜索表单，将其应用到query中
        $scope.preciseSearch = function(preciseSearchText) {
            
            // 移除现有的精确搜索条件
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

                if($scope.customerFieldKeys[key]) {
                    // 支持将搜索的中文key转化为对应的英文key
                    $scope.query[$scope.customerFieldKeys[key]] = value;
                }
                else {
                    $scope.query[key] = value;
                }
            });
        };

        // 由于inGroup和notInGroup不是简单数组，因此监听其改变，并同步到query中的简单数组
        $scope.$watch('inGroup', function(inGroup) {
            if(!inGroup) {
                $scope.query.inGroup = null;
            }
            else {
                $scope.query.inGroup = inGroup.map(function(group) {
                    return group._id;
                });

                inGroup.forEach(function(group) {
                    group.fields.forEach(function(field) {
                        if($scope.showingCustomerFields.indexOf(field) === -1) {
                            $scope.showingCustomerFields.push(field);
                        }
                    });
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
                group.fields = $scope.showingCustomerFields;
                group.query = {};
                Object.keys($scope.query).forEach(function(key) {
                    if(key !== 'page' && key !== 'limit') {
                        group.query[key] = $scope.query[key];
                    }
                });
            }

            $scope.group = group;

            $mdBottomSheet.show({
                templateUrl: 'app/customer/create-group-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.updateGroup = function(group) {
            var isNew = !group._id;
            group.$save();
            $mdToast.showSimple((isNew ? '创建' : '更新') + '分组成功');
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

        // 查看触达详情
        $scope.showCustomerReachingDetail = function(customerReaching) {

            $scope.customerReaching = customerReaching;

            $mdBottomSheet.show({
                templateUrl: 'app/customer/reaching-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.exportToXlsx = function() {

            var queryString = Object.keys($scope.query).filter(function(key) {
                return key !== 'page' && key !== 'limit';
            }).map(function(key) {
                return key + '=' + $scope.query[key];
            }).join('&');

            var fieldsString = $scope.showingCustomerFields.map(function(field) {
                return field.key;
            }).join(',');

            $window.location.href = 'http://localhost:8080/api/customer?token='
                + $window.localStorage.getItem('token')
                + '&export=xlsx'
                + '&fields=' + fieldsString
                + '&' + queryString;
        };

        if($location.path() === '/customer/reaching') {
            $scope.newCustomerReaching = new customerReachingService();
        }

        $scope.saveCustomerReaching = function(customerReaching) {
            customerReaching.$save().then(function() {
                $scope.newCustomerReaching = new customerReachingService();
                $scope.getCustomerReachings();
            });
        };

        $scope.reloadCustomerReaching = function(customerReaching) {
            $scope.newCustomerReaching = customerReaching;
        };

    }
    
})(); 
