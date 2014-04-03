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
    , TEN_MINUTES = 600000
    , ONE_MINUTE = 60000;

  end = $attrs.end || new Date(); // Defaults to 'now' if not set
  start = $attrs.start || new Date(end.getTime() - TEN_MINUTES); // Defaults to 10min ago

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
        var match
          , datasourceName
          , datasource
          , buffer
          , viewport
          , channel
          , wrapper
          , adapter
          , tempScope
          , isLoading
          , loadingFn
          , pending
          , durationToPixels
          , earliestLoaded
          , latestLoaded
          , lastScrollPosition
          , pxScrolled;

        durationToPixels = $filter('durationToPixels');

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

        function channelWidth() {
          var contentDuration
            , elementWidth;

          contentDuration = timelineController.duration() +
            (timelineController.buffer() * 2);
          elementWidth = $filter('durationToPixels')(viewport.width(),
            timelineController.duration(), contentDuration);

          return elementWidth;
        }

        function bufferPixels() {
          return durationToPixels(viewport.width()
            , timelineController.duration(), timelineController.buffer());
        }

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

        function loadThreshold() {
          return viewport.width() * Math.max(0.1, +iAttrs.threshold || 0.1);
        }

        function scrollWidth(elem) {
          return elem[0].scrollWidth || elem[0].document.documentElement.scrollWidth;
        }
        adapter = null;

        linker(tempScope = scope.$new(), function(template) {
          var repeaterType
            , startPadding
            , endPadding;

          repeaterType = template.prop('localName');
          viewport = getViewport();
          channel = getChannel();

          function padding(position) {
            var result;

            result = angular.element('<div class="timeline_padding_' + position + '" />');
            result.paddingWidth = result.width;
            return result;
          }

          function createPadding(padding, channel, direction) {
            channel[direction](padding);
            return {
              paddingWidth: function() {
                return padding.paddingWidth.apply(padding, arguments);
              }
            }
          }

          function setupPaddingStyles() {
            channel.wrap(angular.element('<div class="timeline_channel_content_wrapper"/>'));
            wrapper = channel.parent();
            startPadding = createPadding(padding('before'), channel, 'before');
            endPadding = createPadding(padding('after'), channel, 'after');
            wrapper.children().css({display: 'inline-block', 'min-height': '1px'});
          }

          setupPaddingStyles();

          tempScope.$destroy();
          adapter = {
            viewport: viewport
          , channel: channel
          , beforePadding: startPadding.paddingWidth
          , afterPadding: endPadding.paddingWidth
          , latestDataPos: function() {
              return scrollWidth(viewport) - endPadding.paddingWidth();
            }
          , earliestDataPos: function() {
              return startPadding.paddingWidth();
            }
          };
          return adapter;
        });

        // Pending is an array of captured scroll events booleans.
        // A true value means scrolling forwards in time, false means
        // scrolling backwards in time.
        pending = [];
        buffer = [];
        // Flag representing whether the directive has pending requests
        // to the datasource service.
        isLoading = false;
        loadingFn = datasource.loading || function() {};
        viewport = adapter.viewport;
        channel = adapter.channel;

        /*
        Removes elements from start time to end time from the event buffer
         */
        function removeFromBuffer(start, stop) {
          var toRemove
            , i
            , item;

          toRemove = start;
          i = 0;
          while(toRemove < stop) {
            item = buffer[i];
            item.scope.$destroy();
            item.element.remove();
            i += 1;
            toRemove = buffer.timestamp;
          }

          return buffer.splice(start, stop - start);
        }

        function reload() {
          removeFromBuffer(0, buffer.length);
          pending = [];
          channel.width(channelWidth());
          channel.css({position: 'relative'});
          viewport.scrollLeft(bufferPixels());
          lastScrollPosition = viewport.scrollLeft();
          earliestLoaded = null;
          latestLoaded = null;
          pxScrolled = 0;
          return adjustBuffer(false);
        }

        function shouldLoadBefore() {
          return adapter.earliestDataPos() > earliestVisiblePos() - loadThreshold();
        }

        function shouldLoadAfter() {
          return adapter.latestDataPos() < latestVisiblePos() + loadThreshold();
        }

        function timeDeltaScrolled(lastScrollPos, newScrollPos) {
          var scrollDelta;
          scrollDelta = newScrollPos - lastScrollPos;

          return $filter('pixelsToDuration')(viewport.width()
            , timelineController.duration(), scrollDelta);
        }

        function clipBefore() {

        }

        function clipAfter() {

        }

        function earliestVisiblePos() {
          return viewport.scrollLeft();
        }

        function latestVisiblePos() {
          return viewport.scrollLeft() + viewport.width();
        }

        function scrollHandler() {
          var msScrolled;

          pxScrolled = pxScrolled + (viewport.scrollLeft() - lastScrollPosition);
          msScrolled = timeDeltaScrolled(lastScrollPosition, viewport.scrollLeft());

          lastScrollPosition = viewport.scrollLeft();
          timelineController.adjustTimelineWindow(msScrolled);

          if (!$rootScope.$$phase && !isLoading) {
            adjustBuffer(true);
          }
        }

        function resizeHandler() {

        }

        scope.$on('timelineScrolled', scrollHandler);
        scope.$on('timelineResized', resizeHandler);
        
        // Refresh the whole screen if the datasource changes and updates
        // its revision property. Maybe overkill? Merge changes?
        scope.$watch(datasource.revision, reload);

        function generateItemScope(itemData) {
          var itemScope
            , prop;

          itemScope = scope.$new();
          for (prop in itemData) {
            if (itemData.hasOwnProperty(prop)) {
              itemScope[prop] = itemData[prop];
            }
          }

          return itemScope;
        }

        function insertIndex(item) {
          var i;
          for (i = 0; i < buffer.length; i++) {
            if (buffer[i].scope.start > item.start) {
              break;
            }
          }
          return i;
        }

        function sizeTimelineEvent(startTime, endTime, element) {
          var duration;
          duration = endTime - startTime;
          element.css('display', 'block');
          element.width(durationToPixels(viewport.width()
            , timelineController.duration(), duration));
          return element;
        }

        function positionTimelineEvent(startTime, element) {
          var offsetDuration
            , offsetPixels;
          offsetDuration = startTime - timelineController.bufferStart();
          offsetPixels = durationToPixels(viewport.width()
            , timelineController.duration(), offsetDuration);
          element.css({'left': offsetPixels + 'px', position: 'absolute'});
          return element;
        }

        function insert(item) {
          var itemScope
            , index
            , toBeAppended
            , wrapper;

          itemScope = generateItemScope(item);
          index = insertIndex(item);
          toBeAppended = index > 0;
          wrapper = {
            scope: itemScope
          };

          linker(itemScope, function(clone) {
            clone = sizeTimelineEvent(itemScope.start, itemScope.end, clone);
            clone = positionTimelineEvent(itemScope.start, clone);
            wrapper.element = clone;

            if (toBeAppended) {
              if (index === buffer.length) {
                channel.append(clone);
                buffer.push(wrapper);
              } else {
                buffer[index].element.after(clone);
                buffer.splice(index, 0, wrapper);
              }
            } else {
              channel.prepend(clone);
              buffer.unshift(wrapper);
            }
          });

          return {
            appended: toBeAppended
          , wrapper: wrapper
          };
        }

        /*
        Each time we scroll we enqueue the captured event as a fetch
        call in our pending queue. finalize() will reduce this queue
        in order until it's empty
         */
        function enqueueFetch(scrollingForwards, scrolling) {
          if (!isLoading) {
            isLoading = true;
            loadingFn(true);
          }
          // Kick off the fetch/finalize calls if we are adding to
          // an empty queue. If the queue has content, then we are
          // already doing this.
          if (pending.push(scrollingForwards) === 1) {
            return fetch(scrolling);
          }
        }

        function fetchForwards(scrolling) {
          if (buffer.length && !shouldLoadAfter()) {
            return finalize(scrolling);
          }

          return datasource.get(latestLoaded || timelineController.bufferStart(), timelineController.bufferEnd()
          , function(events) {
            var newItems = [];
            // Clip off earlier items
            clipBefore();

            events.forEach(function(evt) {
              newItems.push(insert(evt));
            });

            latestLoaded = timelineController.bufferEnd();
            return finalize(scrolling, newItems);
          });
        }

        function fetchBackwards(scrolling) {

          if (buffer.length && !shouldLoadBefore()) {
            return finalize(scrolling);
          }

          return datasource.get(earliestLoaded || timelineController.bufferEnd(), timelineController.bufferStart(), function(events) {
            var newItems = [];
            // Clip off later items
            clipAfter();

            events.forEach(function(evt) {
              newItems.unshift(evt);
            });

            earliestLoaded = timelineController.bufferStart();
            return finalize(scrolling, newItems);
          });
        }

        /*
        Fetch does the actual work of getting new data from the
        datasource service, by calling its get function
        The get function should have the signature get(start, end, cb)
         */
        function fetch(scrolling) {
          var scrollingForwards;

          // Grab the front element in the pending queue
          scrollingForwards = pending[0];

          // We load forwards or backward in time based on the scroll direction
          if (scrollingForwards) {
            fetchForwards(scrolling);
          } else {
            fetchBackwards(scrolling);
          }
        }

        /*
        Finalize processes items loaded by a call to fetch and adjusts
        the buffer for of timeline events accordingly. If there are
        still pending scroll events, finalize will call fetch again -
        these two functions call each other until the pending stack
        is empty.
         */
        function finalize(scrolling, newItems) {
          return adjustBuffer(scrolling, newItems, function() {
            pending.shift();
            if (pending.length === 0) {
              isLoading = false;
              return loadingFn(false);
            } else {
              return fetch(scrolling);
            }
          });
        }
        
        function adjustAdapterWidth(pxScrolled) {
          var scrollingBack;

          if (pxScrolled === 0) {
            return;
          }

          // Positive pixels means scrolling forwards, negative backwards
          scrollingBack = pxScrolled < 0;
          pxScrolled = Math.abs(pxScrolled);
          channel.width(channel.width() + pxScrolled);

          if (scrollingBack) {
//            adapter.beforePadding(Math.min(adapter.beforePadding() - pxScrolled, 0));
//            adapter.afterPadding(adapter.afterPadding() + pxScrolled);
//            viewport.scrollLeft(viewport.scrollLeft() + pxScrolled);
          } else {
//            adapter.beforePadding(adapter.beforePadding() + pxScrolled);
//            adapter.afterPadding(Math.min(adapter.afterPadding() - pxScrolled, 0));
//            viewport.scrollLeft(viewport.scrollLeft() - pxScrolled);
          }

          // reset pxScrolled to 0 once we've applied it to the adapter padding
          pxScrolled = 0;
        }
        
        function adjustBuffer(scrolling, newItems, finalize) {
          function doAdjustment() {
            if (shouldLoadAfter()) {
              enqueueFetch(true, scrolling);
            }
            if (shouldLoadBefore()) {
              enqueueFetch(false, scrolling);
            }
            
            if (finalize) {
              return finalize();
            }
          }

          if (newItems) {
            adjustAdapterWidth(pxScrolled);
            pxScrolled = 0;
            return doAdjustment();
          } else {
            return doAdjustment();
          }
        }

      }
    }
  };
});
