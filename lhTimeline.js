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
      throw new Error('durationToPixels(viewportWidth, visibleDuration, elementDuration, [bufferDuration])');
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

  $scope.threshold = $attrs.threshold || 0.2;


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
      var pixelsScrolled
        , lastScrollLeft
        , adapter
        , leftOffset
        , rightOffset
        , durationToPixels = $filter('durationToPixels')
        , pixelsToDuration = $filter('pixelsToDuration');

      function scrollViewBufferedSize() {
        var visibleDuration
          , viewportWidth
          , scrollViewWidth;


        visibleDuration = timelineController.duration();
        viewportWidth = $element.width();
        scrollViewWidth = durationToPixels(viewportWidth
          , visibleDuration, visibleDuration + (timelineController.buffer() * 2));
        return scrollViewWidth;
      }

      function thresholdPixels() {
        var threshold = timelineController.threshold || 0.2;
        return durationToPixels($element.width()
          , timelineController.duration()
          , threshold * timelineController.duration());
      }

      function buildAdapter() {
        var midnight
          , midnightTomorrow
          , pixelWidth
          , el;

        midnight = new Date();
        midnight.setHours(0);
        midnight.setMinutes(0);
        midnight.setSeconds(0);
        midnight.setMilliseconds(0);
        midnightTomorrow = new Date(midnight.getTime() + 86400000);

        pixelWidth = durationToPixels($element.width(), timelineController.duration(), 86400000);
        el = $element.find('.timeline_content_wrapper');
        el.width(pixelWidth);
        timelineController.startOfTime = midnight;
        timelineController.endOfTime = midnightTomorrow;
        return {
          start: midnight
        , end: midnightTomorrow
        , width: pixelWidth
        , element: el
        };

      }

      function updateDataBounds(pixelsScrolled) {
        var newStart
          , newEnd
          , deltaMs;

        deltaMs = pixelsToDuration($element.width()
          , timelineController.duration(), pixelsScrolled);
        newStart = new Date(timelineController.start().getTime() + deltaMs);
        newEnd = new Date(timelineController.end().getTime() + deltaMs);
        timelineController.setTimelineBounds(newStart, newEnd);
      }

      function scrollHandler() {
        var delta;

        delta = $element.scrollLeft() - lastScrollLeft;
        pixelsScrolled = pixelsScrolled + delta;

        if (Math.abs(pixelsScrolled) > thresholdPixels()) {
          updateDataBounds(pixelsScrolled);
          $scope.$broadcast('timelineScrolled', pixelsScrolled);
          pixelsScrolled = 0;
        }
        lastScrollLeft = $element.scrollLeft();
      }

      function setupElements() {
        leftOffset = 0;
        rightOffset = 0;
        adapter = buildAdapter();
        var startLeft = durationToPixels($element.width()
          , timelineController.duration()
          , timelineController.start() - adapter.start);

        $element.css({overflow: 'scroll', display: 'block'});
        $element.scrollLeft(startLeft);
      }

      setupElements();
      $element.on('scroll', scrollHandler);
      lastScrollLeft = $element.scrollLeft();
      pixelsScrolled = 0;
    }
  }
}).directive('lhTimelineChannel', function() {
  return {
    restrict: 'E'
  , transclude: true
  , replace: true
  , templateUrl: 'views/timeline_channel.html'
  }
}).directive('lhTimelineRepeat', function($injector, $window, $filter) {
  return {
    restrict: 'A'
  , priority: 1000
  , terminal: true
  , transclude: 'element'
  , require: '?^lhTimelineViewport'
  , compile: function() {
      return function(scope, iElement, iAttrs, timelineController, linker) {
        var datasource
          , adapter
          , match
          , datasourceName
          , loading
          , loadingFn
          , earliestLoaded
          , latestLoaded
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

          return {
            channel: channel
          , viewport: viewport
          , moveBackwards: function() {

            }
          , moveForwards: function() {

            }
          };
        }

        function scrollHandler() {
          loadingFn();
          fetch();
        }

        function resizeHandler() {

        }

        function reload() {
          loading = false;
          earliestLoaded = timelineController.endOfTime;
          latestLoaded = timelineController.startOfTime;
          fetch();
        }

        function fetch() {
          var bufferStart = timelineController.bufferStart()
            , bufferEnd = timelineController.bufferEnd()
            , fetchStart
            , fetchEnd;


          if (bufferStart < earliestLoaded) {
            fetchStart = earliestLoaded = bufferStart;
          } else {
            fetchStart = latestLoaded;
          }
          if (bufferEnd > latestLoaded) {
            fetchEnd = latestLoaded = bufferEnd;
          } else {
            fetchEnd = earliestLoaded;
          }

          if (fetchStart < fetchEnd) {
            datasource.get(fetchStart, fetchEnd, function(newItems) {
              console.log(newItems);
            });
          }
        }

        initialize();
        adapter = buildAdapter();
        scope.$on('timelineScrolled', scrollHandler);
        scope.$on('timelineResized', resizeHandler);
        scope.$watch(datasource.revision, reload);
        loadingFn = datasource.loading || function() {};
      }
    }
  };
});
