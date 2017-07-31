(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', '$mdBottomSheet', '$mdToast', 'customerService', 'customerGroupService', 'customerFieldService', 'customerReachingService', 'brandService', 'wechatService', customerCtrl])
    .controller('customerCollectingCtrl', ['$scope', '$route', '$location', 'customerService', customerCollectingCtrl])
    .filter('isWechat', isWechatFilter);

    function customerCtrl($scope, $window, $location, $mdBottomSheet, $mdToast, customerService, customerGroupService, customerFieldService, customerReachingService, brandService, wechatService) {
        
        $scope.query = $location.search();

        if(!$scope.query.page) {
            $scope.query.page = 1
        }

        if(!$scope.query.limit) {
            $scope.query.limit = 20;
        }

        if ($scope.query.wechatSubscribeBefore) {
            $scope.query.wechatSubscribeBefore = new Date($scope.query.wechatSubscribeBefore);
        }

        if ($scope.query.wechatSubscribeAfter) {
            $scope.query.wechatSubscribeAfter = new Date($scope.query.wechatSubscribeAfter);
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
        $scope.customerFields = customerFieldService.query({limit:9999});
        
        $scope.customerFields.$promise.then(function(customerFields){
            $scope.customerFieldKeys = {};
            customerFields.forEach(function(customerField) {
                $scope.customerFieldKeys[customerField.label] = customerField.key;
            });
        });

        $scope.customerGroups = customerGroupService.query({limit:1000});

        $scope.queryCustomerReachings = {page: 1, limit: 20};
        
        $scope.getCustomerReachings = function() {
            $scope.promiseCustomerReachings = customerReachingService.query($scope.queryCustomerReachings).$promise.then(function(customerReachings) {
                $scope.customerReachings = customerReachings;
            });
        };

        $scope.getCustomerReachings();

        $scope.getCustomers = function() {};

        $scope.showingCustomerFields = [];

        // 清空筛选条件
        $scope.clearQuery = function () {
            $scope.query = {page: 1, limit: 20};
        };

        $scope.hasQuery = function () {
            return Object.keys($scope.query).some(function (key) {
                return ['page', 'limit'].indexOf(key) === -1;
            });
        };

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
                
                var match = pairString.match(/([^=]+)=([^=]+)/);
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

        $scope.toggleInGroup = function(groupToToggle, $event) {
            var alreadyInGroup = false;

            // 给<md-chip>添加一个选中状态的class
            var chipElement = $event.currentTarget.parentElement.parentElement.parentElement

            if(chipElement.className.search('bg-primary') > -1) {
                chipElement.className = chipElement.className.replace('bg-primary', '');
            }
            else {
                chipElement.className += ' bg-primary';
            }

            $scope.inGroup = $scope.inGroup.filter(function(group) {
                if(group._id === groupToToggle._id) {
                    alreadyInGroup = true;
                    return false;
                }
                else {
                    return true;
                }
            });

            if(!alreadyInGroup) {
                $scope.inGroup.push(groupToToggle);
            }
        };

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
            group.$save().then(function(group) {
                if (isNew) {
                    wechatService.syncUserGroup(group.wechat.appId, group);
                }
            });
            $mdToast.show($mdToast.simple((isNew ? '创建' : '更新') + '分组成功').position('top right'));
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

        $scope.syncGroupToWechat = function (group) {
            wechatService.syncUserGroup(group.wechat.appId, group);
        };

        $scope.syncNewsMaterials = function (wechat) {
            wechatService.sync(wechat);
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
                console.log($scope.query[key]);
                return key !== 'page' && key !== 'limit';
            }).map(function(key) {
                if (angular.isArray($scope.query[key])) {
                    return $scope.query[key].map(function (value) {
                        return key + '=' + value
                    }).join('&');
                } else {
                    return key + '=' + $scope.query[key];
                }
            }).filter(function (param) {
                return param;
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
            if (confirm('即将立即发送短信模板 ' + $scope.newCustomerReaching.templateCode + ' 到用户组 ' + $scope.newCustomerReaching.group.name)) {
                customerReaching.$save().then(function() {
                    $scope.newCustomerReaching = new customerReachingService();
                    $scope.getCustomerReachings();
                });
            }
        };

        $scope.reloadCustomerReaching = function(customerReaching) {
            $scope.newCustomerReaching = customerReaching;
        };

        $scope.editQrScene = function(qrScene) {

            $scope.scene = {name: null, createdAt: new Date()};
            
            $mdBottomSheet.show({
                templateUrl: 'app/customer/reaching-scene-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.saveQrScene = function(qrScene) {
            $mdBottomSheet.hide();
            wechatService.saveQrScene($scope.wechatDetail, qrScene).then(function () {
                $scope.scene = undefined;
                $scope.getWechat($scope.wechatDetail);
            });
        };

        $scope.removeScene = function(sceneToRemove) {
            sceneToRemove.$delete();
            $scope.scenes = $scope.scenes.filter(function(scene) {
                return scene._id !== sceneToRemove._id;
            });
        };

        $scope.selectTab = function (tab) {
            $location.search('tab', tab);
        };

        $scope.currentTab = $location.search().tab || 'sms';

        $scope.$watch('$parent.$parent.user.$resolved', function (resolved) {
            if (!resolved) return;
            $scope.brand = brandService.get({id:$scope.$parent.$parent.user.brand.name});
        });

        $scope.getWechat = function (wechat) {
            wechatService.get(wechat.appId).then(function (response) {
                $scope.wechatDetail = response.data;
                $scope.wechatDetail.newsMaterials.forEach(function (newsMaterial) {
                    newsMaterial.content.newsItem.forEach(function (item) {
                        item.thumbUrl = item.thumbUrl.replace(/http:\/\/mmbiz\.qpic\.cn\//, 'http://qpic.stirad.com/');
                    });
                });
            });
        };

        $scope.sendNewsMaterial = function (wechat, customerGroup, newsMaterial) {
            wechatService.massSend(wechat.appId, customerGroup.wechatTagId, newsMaterial.mediaId);
        };
    }

    function customerCollectingCtrl ($scope, $route, $location, customerService) {
        if ($route.current.params.id) {
            $scope.customer = customerService.get({id:$route.current.params.id});
            $scope.customer.$promise.then(function (customer) {
                $scope.title = 'NUID: ...' + customer._id.substr(11);
            });
            $scope.qrcode = customerService.getQrcode({id:$route.current.params.id, scene: '人脸识别'});
        } else {
            $scope.title = '访客列表';
            $scope.customers = customerService.query({zgid: {$exists: true}, openid: null});
        }

        $scope.showDetail = function (customer) {
            $location.url('/customer/collecting/' + customer._id);
        };
    }

    function isWechatFilter () {
        return function (groups, appId) {
            return groups.filter(function (group) {
                return group.wechat && group.wechat.appId === appId;
            });
        }
    }
    
})(); 
