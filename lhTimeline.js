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
      throw new Error('durationToPixels(viewportWidth, totalDuration, elementDuration, [bufferDuration])');
    }

    widthValue = Number(viewportWidth);

    if (widthValue === 0) {
      return 0;
    }

    if (!widthValue) {
      widthPat = /(\d+\.?\d*)(px|%|em|rem|pt|in|cm|mm|ex|pc)/;
      widthMatch = widthPat.exec(viewportWidth);
      if (!widthMatch) {
        throw new Error('viewportWidth must be a number or a CSS-parseable string (e.g. 30px, 3.5rem');
      }
      widthValue = Number(widthMatch[1]);
      widthUnit = widthMatch[2];
    }

    if (!(typeof totalDuration === 'number' &&
      typeof elementDuration === 'number')) {
      throw new Error('totalDuration and viewportDuration must be in milliseconds');
    }

    unitPerMs = widthValue / totalDuration;
    elementWidth = unitPerMs * elementDuration;
    if (!widthUnit || widthUnit === 'px') {
      elementWidth = Math.floor(elementWidth);
    }
    return widthUnit ? elementWidth + widthUnit : elementWidth;
  }
}).filter('pixelsToDuration', function() {
  return function(viewportWidth, totalDuration, elementWidth) {
    var widthPat
      , widthMatch
      , widthValue
      , widthUnit
      , elementWidthValue
      , elementWidthUnit
      , elementToViewportRatio
      , elementDuration;

    if (arguments.length !== 3) {
      throw new Error('pixelsToDuration(viewportWidth, totalDuration, elementWidth)');
    }

    widthPat = /(\d+\.?\d*)(px|%|em|rem|pt|in|cm|mm|ex|pc)/;

    widthValue = Number(viewportWidth);

    if (widthValue === 0) {
      return 0;
    }

    if (!widthValue) {
      widthMatch = widthPat.exec(viewportWidth);
      if (!widthMatch) {
        throw new Error('viewportWidth must be a number or a CSS-parseable string (e.g. 30px, 3.5rem');
      }
      widthValue = Number(widthMatch[1]);
      widthUnit = widthMatch[2];
    }
    elementWidthValue = Number(elementWidth);
    if (elementWidthValue === 0) {
      return 0;
    }
    if (!elementWidthValue) {
      widthMatch = widthPat.exec(elementWidth);
      if (!widthMatch) {
        throw new Error('elementWidth must be a number or a CSS-parseable string (e.g. 30px, 3.5rem');
      }
      elementWidthValue = Number(widthMatch[1]);
      elementWidthUnit = Number(widthMatch[2]);

      if (elementWidthUnit !== widthUnit) {
        throw new Error('element and viewport width must use the same CSS unit (sorry!)');
      }
    }

    if (typeof totalDuration !== 'number') {
      throw new Error('totalDuration must be in milliseconds');
    }

    elementToViewportRatio = elementWidthValue / widthValue;
    elementDuration = elementToViewportRatio * totalDuration;
    return elementDuration;
  }
});

lhTimeline.controller('TimelineController', function($scope, $element, $attrs) {
  var start
    , end
    , visibleMinutes
    , TEN_MINUTES = 600000
    , ONE_MINUTE = 60000;

  end = $attrs.end || new Date(); // Defaults to 'now' if not set
  start = $attrs.start || new Date(end.getTime() - TEN_MINUTES); // Defaults to 10min ago
  visibleMinutes = $attrs.visibleMinutes || 10;

  $scope.buffer = function() {
    var bufferMinutes;
    bufferMinutes = +$attrs.bufferMinutes || 5;
    return bufferMinutes * ONE_MINUTE; // Buffer is bufferMinutes in milliseconds
  };

  $scope.duration = function() {
    return end - start;
  };

  $scope.start = function() {
    return start;
  };

  $scope.end = function() {
    return end;
  };

  $scope.bufferStart = function() {
    return new Date(start.getTime() - $scope.buffer());
  };

  $scope.bufferEnd = function() {
    return new Date(end.getTime() + $scope.buffer());
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

  $scope.adjustTimelineWindow = function(msAdjustment) {
    start = new Date(start.getTime() + msAdjustment);
    end = new Date(end.getTime() + msAdjustment);
  };

  $scope.viewport = function() {
    return $element.find('.timeline_viewport');
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
          , visibleDuration, visibleDuration + (timelineController.buffer() * 2));
        return scrollViewWidth;
      }

      $element.css({overflow: 'scroll', display: 'block'});
      $element.on('scroll', function() {
        $scope.$broadcast('timelineScrolled', $element.prop('scrollLeft')
          , $element.prop('scrollTop'));
      });
      $element.parent().on('resize', function() {
        $element.css('width', scrollViewBufferedSize());
        $scope.$broadcast('timelineResized', $element.prop('width')
          , $element.prop('height'));
      });
    }
  }
}).directive('lhTimelineChannel', function() {
  return {
    restrict: 'E'
  , transclude: true
  , replace: true
  , templateUrl: 'views/timeline_channel.html'
  }
}).directive('lhTimelineRepeat', function($injector, $window, $filter, $rootScope, $timeout) {
  return {
    restrict: 'A'
  , priority: 1000
  , terminal: true
  , transclude: 'element'
  , require: '?^lhTimelineViewport'
  , compile: function() {
      return function(scope, iElement, iAttrs, timelineController, linker) {
        var datasource
          , wrapper
          , adapter
          , match
          , datasourceName
          , loading
          , loadingFn
          , pixelsScrolled
          , lastScrollLeft
          , durationToPixels = $filter('durationToPixels');

        function initialize() {
          match = iAttrs.lhTimelineRepeat.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/);
          if (!match) {
            throw new Error('Expected lhTimeline directive in the form of "item in timelineService" but got "' +
              iAttrs.lhTimeline + '"');
          }
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
        }

        function buildAdapter() {
          var channel
            , viewport;

          function getViewport() {
            return timelineController.viewport() || $window;
          }

          function getChannel() {
            var ch;
            ch = iElement.parent();
            if (ch && ch.hasClass('timeline_channel_content')) {
              return ch;
            }
            return getViewport();
          }

          channel = getChannel();
          viewport = getViewport();

          channel.wrap('<div class="timeline_repeat_wrapper" />');
          channel.before('<div class="timeline_repeat_padding before" />');
          channel.after('<div class="timeline_repeat_padding after" />');

          return {
            channel: channel
          , viewport: viewport
          , moveBackwards: function() {

            }
          , moveForwards: function() {

            }
          };
        }

        function readjustVisibleTime() {

        }

        function thresholdPixels() {
          var threshold = iAttrs.threshold || 0.2;
          return durationToPixels(adapter.viewport.width()
            , timelineController.duration()
            , threshold * timelineController.duration());
        }

        function scrollHandler() {
          var delta;

          delta = adapter.viewport.scrollLeft() - lastScrollLeft;
          pixelsScrolled = pixelsScrolled + delta;

          if (pixelsScrolled > thresholdPixels()) {
            loadingFn();
            pixelsScrolled = 0;
          }
          lastScrollLeft = adapter.viewport.scrollLeft();
        }

        function reload() {
          pixelsScrolled = 0;
          lastScrollLeft = 0;
        }

        initialize();
        scope.$on('timelineScrolled', scrollHandler);
        scope.$watch(datasource.revision, reload);
        adapter = buildAdapter();
        loadingFn = datasource.loading || function() {};
      }
    }
  };
});
