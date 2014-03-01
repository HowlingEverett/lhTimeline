'use strict';

var lhTimeline = angular.module('lh.timeline', ['lh.service.utils']);

/**

**/
lhTimeline.directive('lhTimelineViewport', function() {
  return {
    restrict: 'E'
  , templateUrl: 'views/timeline.html'
  , transclude: true
  };
});

lhTimeline.directive('lhTimelineChannel', function() {
  return {
    restrict: 'E'
  , templateUrl: 'views/timeline_channel.html'
  }
});

lhTimeline.directive('lhTimeline', function ($injector) {
  return {
    restrict: 'A'
  , require: ['?^lhTimelineViewport']
  , transclude: 'element'
  , priority: 1000
  , terminal: true
  , compile: function(tElement, tAttrs) {
      return function(scope, iElement, iAttrs, controller, transcludeFn) {
        var match
          , itemName
          , datasourceName
          , datasource
          , tempScope;

        match = iAttrs.lhTimeline.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/);
        if (!match) {
          throw new Error('Expected lhTimeline directive in the form of "item in datasource" but got"' +
            iAttrs.lhTimeline + '"');
        }
        itemName = match[1];
        datasourceName = match[2];

        function isDatasource(datasource) {
          return angular.isObject(datasource) &&
            datasource.get &&
            angular.isFunction(datasource.get);
        }

        datasource = scope[datasourceName];

        if (!isDatasource(datasource)) {
          datasource = $injector.get(datasourceName);
          if (!isDatasource(datasource)) {
            throw new Error(datasourceName + ' is not a valid datasource for the timeline');
          }
        }

        // The transcluder's linker function call
        transcludeFn(tempScope = scope.new(), function(tempate) {

        });
      }
    }
  };
});
