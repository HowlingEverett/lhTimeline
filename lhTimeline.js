'use strict';

var lhTimeline = angular.module('lh.timeline', ['lh.service.utils']);

lhTimeline.filter('durationToPixels', function() {
  return function(viewportWidth, totalDuration, elementDuration) {
    var widthPat
      , widthMatch
      , widthValue
      , widthUnit
      , unitPerMs
      , elementWidth;

    if (!(arguments.length === 3 || arguments.length === 4)) {
      throw new Error('durationToPixels(elementWidth, totalDuration, elementDuration, [bufferDuration])');
    }

    widthValue = Number(viewportWidth);
    if (!widthValue) {
      widthPat = /(\d+\.?\d*)(px|%|em|rem|pt|in|cm|mm|ex|pc)/;
      widthMatch = widthPat.exec(viewportWidth);
      if (!widthMatch) {
        throw new Error('elementWidth must be a number or a CSS-parseable string (e.g. 30px, 3.5rem');
      }
      widthValue = Number(widthMatch[1]);
      widthUnit = widthMatch[2];
    }

    if (!(typeof totalDuration === 'number' &&
      typeof elementDuration === 'number')) {
      throw new Error('totalDuration and elementDuration must be in milliseconds');
    }

    unitPerMs = widthValue / totalDuration;
    elementWidth = unitPerMs * elementDuration;
    if (!widthUnit || widthUnit === 'px') {
      elementWidth = Math.floor(elementWidth);
    }
    return widthUnit ? elementWidth + widthUnit : elementWidth;
  }
});

lhTimeline.directive('lhTimelineViewport', function() {
  return {
    restrict: 'E'
  , replace: true
  , templateUrl: 'views/timeline.html'
  , transclude: true
  , priority: 1
  , link: function($scope, $element) {
      var scrollPort;

      function setupDomListeners() {
        angular.forEach($element.find('div'), function(div) {
          if (div.classList.contains('timeline_viewport')) {
            scrollPort = angular.element(div);
          }
        });
        scrollPort.css({overflow: 'scroll'});

        scrollPort.on('scroll', function() {
          $scope.$broadcast('viewportScrolled');
        });
      }

      setupDomListeners();

      return $scope;
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
  , transclude: 'element'
  , compile: function() {
      return function(scope, iElement, iAttrs, timelineController, linker) {
        var match
          , itemName
          , datasourceName
          , datasource
          , tempScope;

        match = iAttrs.lhTimelineRepeat.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/);
        if (!match) {
          throw new Error('Expected lhTimeline directive in the form of "item in timelineService" but got "' +
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
        linker(tempScope = scope.$new(), function(template) {
          var repeaterType;

          repeaterType = template.prop('localName');
        });

        function scrollHandler() {

        }
        scope.$on('viewportScrolled', scrollHandler);


      }
    }
  };
});
