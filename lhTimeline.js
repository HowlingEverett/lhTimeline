(function() {
  'use strict';

  var lhTimeline = angular.module('lh.timeline', []);

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
      , ONE_MINUTE = 60000


    visibleMinutes = +$attrs.visibleMinutes || 10;

    function initialiseBounds() {
      var _midnight;

      _midnight = new Date();
      _midnight.setHours(0);
      _midnight.setMinutes(0);
      _midnight.setSeconds(0);
      _midnight.setMilliseconds(0);

      if ($attrs.end) {
        end = new Date($attrs.end);
      } else {
        end = new Date();
      }

      if ($attrs.start) {
        start = new Date($attrs.start);
      } else {
        start = new Date(end.getTime() - (visibleMinutes * ONE_MINUTE));
      }

      if ($attrs.startOfTime && $attrs.startOfTime instanceof Date) {
        $scope.startOfTime = new Date($attrs.startOfTime);
      } else {
        $scope.startOfTime = _midnight;
      }

      if ($attrs.endOfTime && $attrs.endOfTime instanceof Date) {
        $scope.endOfTime = new Date($attrs.endOfTime);
      } else {
        $scope.endOfTime = new Date($scope.startOfTime.getTime() + 86400000);
      }
    }

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

    initialiseBounds();
    
    $scope.$on('timelineWorldBoundsChanged', function () {
      initialiseBounds();
    });
    
    return $scope;
  });

  lhTimeline.directive('lhTimelineViewport', function() {
    return {
      restrict: 'E'
    , replace: true
    // , templateUrl: 'views/timeline.html'
    , template: '<div class="timeline">' +
      '<span class="timeline_title">{{title}}</span>' +
      '<div lh-timeline-scroll-view class="timeline_viewport">' +
      '  <div class="timeline_content_wrapper" ng-transclude></div>' +
      '</div>' +
    '</div>'
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

        function thresholdPixels() {
          var threshold = timelineController.threshold || 0.2;
          return durationToPixels($element.width()
            , timelineController.duration()
            , threshold * timelineController.duration());
        }

        function buildAdapter() {
          var pixelWidth
            , el;

          var totalDuration = timelineController.endOfTime -
            timelineController.startOfTime;

          pixelWidth = durationToPixels($element.width(), timelineController.duration(), totalDuration);
          el = $element.find('.timeline_content_wrapper');
          el.width(pixelWidth);
          el.css('min-height', '32px');
          return {
            start: timelineController.startOfTime
          , end: timelineController.endOfTime
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
          console.info('updating Timeline window:', newStart, 'to', newEnd);
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

        function resizeHandler() {
          var el
          , pixelWidth;

          pixelWidth = durationToPixels($element.width(), timelineController.duration(), timelineController.endOfTime - timelineController.startOfTime);
          el = $element.find('.timeline_content_wrapper');
          el.width(pixelWidth);
          $scope.$broadcast('timelineResized', pixelWidth);
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
        $element.on('resize', resizeHandler);
        $scope.$on('timelineWorldBoundsChanged', resizeHandler);
        lastScrollLeft = $element.scrollLeft();
        pixelsScrolled = 0;
      }
    }
  }).directive('lhTimelineChannel', function() {
    return {
      restrict: 'E'
    , transclude: true
    , replace: true
    , scope: {
        title: '@'
      , glyphicon: '@'
      , channel: '=?'
      }
    // , templateUrl: 'views/timeline_channel.html'
    , template: '<div class="timeline_channel">' +
        '<span class="channel_title">{{title}}</span>' +
        '<span class="glyphicon glyphicon_{{glyphicon}}"></span>' +
        '<div class="timeline_channel_content" ng-transclude />' +
      '</div>'
    }
  }).directive('lhTimelineRepeat', function($injector, $window, $filter) {
    return {
      restrict: 'A'
    , transclude: 'element'
    , require: '?^lhTimelineViewport'
    , scope: {
      channel: '=?'
    }
    , link: function(scope, iElement, iAttrs, timelineController, linker) {
        var datasource, adapter, match, datasourceName, loading, loadingFn
          , earliestLoaded, latestLoaded, repeats, contentIdentifiers, color
          , durationToPixels = $filter('durationToPixels');
        
        function getContentIdentifiers(attrString) {
          var identifiers = {};
          attrString.split(',').forEach(function (identifier) {
            var k, v, _ref;
            
            _ref = identifier.trim().split(':');
            k = _ref[0].trim();
            v = _ref[1].trim();
            identifiers[k] = v;
          });
          return identifiers;
        }
        
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

          contentIdentifiers = getContentIdentifiers(iAttrs.contentIdentifiers);
          color = iAttrs.color || "#5CB85C";
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
          channel.css('position', 'relative');

          return {
            channel: channel
          , viewport: viewport
          };
        }

        function scrollHandler() {
          loadingFn(true);
          fetch();
          scope.$apply();
        }

        function resizeHandler() {

        }

        function reload() {
          loading = false;
          earliestLoaded = timelineController.endOfTime;
          latestLoaded = timelineController.startOfTime;
          if (scope.repeats) {
            scope.repeats.forEach(function (repeat) {
              repeat.remove();
            });
          }
          scope.repeats = [];
          fetch();
        }

        function fetch() {
          var bufferStart = timelineController.bufferStart()
            , bufferEnd = timelineController.bufferEnd()
            , fetchStart
            , fetchEnd
            , earliest = earliestLoaded;


          if (bufferStart < earliestLoaded) {
            fetchStart = earliestLoaded = bufferStart;
          } else {
            fetchStart = latestLoaded;
          }
          if (bufferEnd > latestLoaded) {
            fetchEnd = latestLoaded = bufferEnd;
          } else {
            fetchEnd = earliest;
          }

          function fetchResult(err, newItems) {
            if (err) {
              throw new Error(err);
              return;
            }
            newItems.forEach(insert);
          }

          if (fetchStart < fetchEnd) {
            if (contentIdentifiers) {
              datasource.get(fetchStart, fetchEnd, contentIdentifiers, fetchResult);
            } else {
              datasource.get(fetchStart, fetchEnd, fetchResult);
            }
          }
        }

        function itemLeftOffset(itemData, viewport) {
          var offset = itemData.time - timelineController.startOfTime;
          return durationToPixels(viewport.width(), timelineController.duration(), offset);
        }

        function itemWidth(itemData, viewport) {
          if (!itemData.duration) {
            return adapter.channel.height();
          }

          return durationToPixels(viewport.width(), timelineController.duration()
            , itemData.duration);
        }

        function positionTimelineItem(itemScope, cloneElement, viewport) {
          var left
            , width;

          width = itemWidth(itemScope, viewport);
          left = itemLeftOffset(itemScope, viewport);
          cloneElement.width(width);
          cloneElement.css({left: left + 'px', position: 'absolute'
            , backgroundColor: color});
        }

        function insert(timelineItem) {
          var itemScope
            , itemProp
            , baseProps;

          baseProps = ['time', 'duration', 'type']
          itemScope = scope.$new();
          itemScope.extraOpts = {};
          for (itemProp in timelineItem) {
            if (timelineItem.hasOwnProperty(itemProp)) {
              if (baseProps.indexOf(itemProp) !== -1) {
                itemScope[itemProp] = timelineItem[itemProp];
              } else {
                itemScope.extraOpts[itemProp] = timelineItem[itemProp];
              }
            }
          }

          linker(itemScope, function(clone) {
            positionTimelineItem(itemScope, clone, adapter.viewport);
            adapter.channel.append(clone);
            scope.repeats.push(clone);
          });
        }

        initialize();
        adapter = buildAdapter();
        scope.$on('timelineScrolled', scrollHandler);
        scope.$on('timelineResized', resizeHandler);
        scope.$on('timelineWorldBoundsChanged', reload);
        loadingFn = datasource.loading || function() {};
      }
    }
  });
  
}());