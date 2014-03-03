'use strict';

var lhTimeline = angular.module('lh.timeline', ['lh.service.utils']);

lhTimeline.directive('lhTimelineViewport', function() {
  return {
    restrict: 'E'
  , replace: true
  , templateUrl: 'views/timeline.html'
  , transclude: true
  , priority: 1
  , link: function(scope, iElement) {
      iElement.on('scroll', function() {
        scope.$broadcast('viewportScrolled');
      });
    }
  };
}).directive('lhTimelineChannel', function() {
  return {
    restrict: 'E'
  , transclude: true
  , templateUrl: 'views/timeline_channel.html'
  }
}).directive('lhTimelineRepeat', function ($injector) {
  return {
    restrict: 'A'
  , priority: 1000
  , compile: function() {
      return function(scope, iElement, iAttrs, timelineController, linker) {
        var match
          , itemName
          , datasourceName
          , datasource
          , tempScope;

        match = iAttrs.lhTimeline.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/);
        if (!match) {
          throw new Error('Expected lhTimeline directive in the form of "item in datasource" but got "' +
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
        linker(tempScope = scope.new(), function(template) {
          var repeaterType;

          repeaterType = template.prop('localName');
        });

        function scrollHandler() {

        }
        scope.on('viewportScrolled', scrollHandler);


      }
    }
  };
});
