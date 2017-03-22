(function () {
    'use strict';

    angular.module('app.core', [
        // Angular modules
         'ngAnimate'
        ,'ngAria'
        ,'ngMessages'
        ,'ngResource'
        ,'ngRoute'

        // Custom modules
        ,'app.layout'
        ,'app.i18n'
        
        // 3rd Party Modules
        ,'oc.lazyLoad'
        ,'ngMaterial'
        ,'duScroll'
        ,'angular-clipboard'
        ,'as.sortable'
    ]);

})();

