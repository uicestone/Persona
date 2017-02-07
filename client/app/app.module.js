(function () {
    'use strict';

    angular.module('app', [
        // Core modules
         'app.core'
        
        // Custom Feature modules
        ,'app.chart'
        ,'app.client'
        ,'app.project'
        ,'app.ui'
        ,'app.ui.form'
        ,'app.ui.form.validation'
        ,'app.setting'
        ,'app.page'
        ,'app.table'
        ,'app.wizard'
        
        // 3rd party feature modules
        ,'md.data.table'
    ]);

})();

