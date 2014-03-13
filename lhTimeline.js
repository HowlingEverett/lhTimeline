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

lhTimeline.controller('TimelineController', function($scope, $attrs) {
  var start
    , end;

  end = $attrs.end || new Date(); // Defaults to 'now' if not set
  start = $attrs.start || new Date(end.getTime() - 600000); // Defaults to 10min ago

  $scope.buffer = function() {
    var bufferMinutes;
    bufferMinutes = +$attrs.bufferMinutes || 5;
    return bufferMinutes * 60000 * 2; // Buffer is bufferMinutes in milliseconds
                                      // doubled, since the buffer should apply either
                                      // side
  };

  $scope.duration = function() {
    return end - start;
  };

  $scope.start = function () {
    return start;
  };

  $scope.end = function () {
    return end;
  };

  $scope.setTimelineBounds = function(startTime, endTime) {
    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      throw new Error('Start and End must be Date instances');
    }

    if (startTime >= endTime) {
      throw new Error('End time must be greater than the start.');
    }

    start = startTime;
    end = endTime;
  };

  return $scope;
});

lhTimeline.directive('lhTimelineViewport', function() {
  return {
    restrict: 'E'
  , replace: true
  , templateUrl: 'views/timeline.html'
  , transclude: true
  , priority: 1
  , controller: 'TimelineController'
  };
}).directive('lhTimelineScrollView', function($filter) {
  return {
    restrict: 'A'
  , require: '^lhTimelineViewport'
  , link: function($scope, $element, $attrs, timelineController) {

      function scrollViewBufferedSize() {
        var durationToPixels
          , visibleDuration
          , viewportWidth
          , scrollViewWidth;

        durationToPixels = $filter('durationToPixels');
        visibleDuration = timelineController.duration();
        viewportWidth = $element.parent().css('width');
        scrollViewWidth = durationToPixels(viewportWidth
          , visibleDuration, visibleDuration + timelineController.buffer());
        return scrollViewWidth;
      }

      $element.css({overflow: 'scroll', display: 'block'});
      $element.on('scroll', function() {
        $scope.$broadcast('timelineScrolled', $element.prop('scrollLeft'), $element.prop('scrollTop'));
      });
      $element.parent().on('resize', function() {
        $element.css('width', scrollViewBufferedSize());
        $scope.$broadcast('timelineResized', $element.prop('width'), $element.prop('height'));
      });
    }
  }
}).directive('lhTimelineChannel', function() {
  return {
    restrict: 'E'
  , transclude: true
  , templateUrl: 'views/timeline_channel.html'
  }
}).directive('lhTimelineRepeat', function($injector, $window, durationToPixelsFilter) {
  return {
    restrict: 'A'
  , priority: 1000
  , transclude: 'element'
  , require: '?^lhTimelineViewport'
  , compile: function() {
      return function(scope, iElement, iAttrs, timelineController, linker) {
        var match
          , itemName
          , datasourceName
          , datasource
          , tempScope
          , buffer
          , bufferPadding
          , adapter
          , viewport
          , durationToPixels = durationToPixelsFilter;

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

        // User can set the buffer size as a variable on the container
        buffer = Math.max(timelineController.buffer() || 0, 5);
        bufferPadding = function() {

        };

        function scrollWidth(elem) {
          return elem[0].scrollWidth || elem[0].document.documentElement.scrollWidth;
        }
        adapter = null;

        // The transcluder's linker function call
        linker(tempScope = scope.$new(), function(template) {
          var repeaterType;

          repeaterType = template.prop('localName');

        });

        function scrollHandler(event) {

        }

        function resizeHandler(event) {

        }

        scope.$on('viewportScrolled', scrollHandler);
        scope.$on('viewportResized', resizeHandler);
      }
    }
  };
});
