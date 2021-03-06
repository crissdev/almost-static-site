/*global angular*/
'use strict';

require('angular');
require('angular-route');
require('angular-animate');
require('angular-sanitize');

var
  bootstrapData = window && window.ASS_BOOTSTRAP ? window.ASS_BOOTSTRAP : {},
  mainModule = angular.module('assMain', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
]);

mainModule
.constant('config', angular.extend(bootstrapData.runtimeConfig,{
  // Generate url for navigation link href
  href:function(suffix) {
    if ( suffix.match(/^([a-z]*:?\d*)\/\//) ) { return suffix; }
    var base =  this.enablePushState ? this.baseUrl : '#/';
    return  base + suffix.replace(/^\//,'');
  },
  url:function(suffix) {
    if ( suffix.match(/^([a-z]*:?\d*)\/\//) ) { return suffix; }
    return  this.baseUrl + suffix.replace(/^\//,'');
  }
}))

.run(['$templateCache', function($templateCache) {
  angular.forEach(bootstrapData.templates||{}, function(t,url) {
    $templateCache.put(url, t);
  });
}])

.factory('menu', require('./services/menu'))
.factory('features', require('./services/features'))

.run(['features', function(features) {
  features.register('content', 'page', require('../features/content'));
  features.register('filter', 'page', require('../features/filter'));
  features.register('includes', 'page', require('../features/includes'));
  features.register('submenu', 'menu', require('../features/submenu'));
  features.register('toc', 'page', require('../features/toc'));
  features.register('subpages', 'page', require('../features/subpages'));
}])

.controller('ass.ctrl.menu', require('./controllers/menu'))
.controller('ass.ctrl.page', require('./controllers/page'))
.controller('ass.ctrl.header', require('./controllers/header'))
.controller('ass.ctrl.footer', require('./controllers/footer'))

.directive('assCompileHtml', require('./directives/compileHtml'))
.directive('assFixContainerHeight', require('./directives/fixContainerHeight'))
.directive('assPageTransition', require('./directives/pageTransition'))
.directive('assBroadcastScrollPosition', require('./directives/broadcastScrollPosition'))

.config(
  ['$routeProvider', '$locationProvider', 'config',
  function($routeProvider, $locationProvider, config) {
    $locationProvider.html5Mode(config.enablePushState);
    $routeProvider
    .otherwise({
      templateUrl: 'main/views/page.html',
      controller: 'ass.ctrl.page'
    });
  }
])
.config(
  ['$logProvider', 'config',
  function($logProvider, config){
    $logProvider.debugEnabled(true, !!config.debug);
  }
])
;

module.exports = mainModule;