(function() {
    'use strict';

    angular.module('app.core')
        .factory('appConfig', [appConfig])
        .config(['$mdThemingProvider', '$mdDateLocaleProvider', mdConfig]);

    function appConfig() {
        var pageTransitionOpts = [
            {
                name: 'Fade up',
                "class": 'animate-fade-up'
            }, {
                name: 'Scale up',
                "class": 'ainmate-scale-up'
            }, {
                name: 'Slide in from right',
                "class": 'ainmate-slide-in-right'
            }, {
                name: 'Flip Y',
                "class": 'animate-flip-y'
            }
        ];
        var date = new Date();
        var year = date.getFullYear();
        var main = {
            brand: 'Persona',
            name: 'Tracy',
            year: year,
            layout: 'wide',                                 // String: 'boxed', 'wide'
            menu: 'vertical',                               // String: 'horizontal', 'vertical'
            isMenuCollapsed: false,                         // Boolean: true, false
            fixedHeader: true,                              // Boolean: true, false
            fixedSidebar: true,                             // Boolean: true, false
            pageTransition: pageTransitionOpts[0],          // Object: 0, 1, 2, 3 and build your own
            skin: '12',                                     // String: 11,12,13,14,15,16; 21,22,23,24,25,26; 31,32,33,34,35,36
            link: ''
        };
        var color = {
            primary:    '#FFA800', // Amber 600-700
            success:    '#8BC34A',
            info:       '#00BCD4',
            infoAlt:    '#7E57C2',
            warning:    '#FFCA28',
            danger:     '#F44336',
            text:       '#3D4051',
            gray:       '#EDF0F1'
        };

        return {
            pageTransitionOpts: pageTransitionOpts,
            main: main,
            color: color
        }
    }

    function mdConfig($mdThemingProvider, $mdDateLocaleProvider) {
        var amberAlt = $mdThemingProvider.extendPalette('amber', {
            'contrastLightColors': '600 700 800 900',
            'contrastStrongLightColors': '600 700 800 900'
        });
        // var cyanAlt = $mdThemingProvider.extendPalette('cyan', {
        //     'contrastLightColors': '500 600 700 800 900',
        //     'contrastStrongLightColors': '500 600 700 800 900'
        // })
        // var lightGreenAlt = $mdThemingProvider.extendPalette('light-green', {
        //     'contrastLightColors': '500 600 700 800 900',
        //     'contrastStrongLightColors': '500 600 700 800 900'
        // })        

        $mdThemingProvider
            .definePalette('amberAlt', amberAlt);
            // .definePalette('cyanAlt', cyanAlt)
            // .definePalette('lightGreenAlt', lightGreenAlt);


        $mdThemingProvider.theme('default')
            .primaryPalette('amberAlt', {
                'default': '600'
            })
            .accentPalette('amberAlt', {
                'default': '800'
            });
            // .warnPalette('red', {
            //     'default': '500'
            // })
            // .backgroundPalette('grey', {'default':'50'});

        $mdDateLocaleProvider.months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        $mdDateLocaleProvider.shortMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        $mdDateLocaleProvider.days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        $mdDateLocaleProvider.shortDays = ['日', '一', '二', '三', '四', '五', '六'];

        $mdDateLocaleProvider.formatDate = function(date) {
            if(date) {
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            }
            else {
                return '';
            }
        };
    }

})();