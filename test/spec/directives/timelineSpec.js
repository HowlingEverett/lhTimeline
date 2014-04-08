'use strict';

angular.module('lh.mocks', []).service('timelineService', function() {
  return {
    get: function() {}
  };
});



describe('lhTimeline module', function() {
  var $compile
    , scope;

  beforeEach(module('lh.timeline'));
  beforeEach(module('lh.mocks'));
  beforeEach(module('views/timeline.html', 'views/timeline_channel.html'));

  describe('durationToPixels filter', function() {
    var durationToPixels;

    beforeEach(inject(function($injector) {
      durationToPixels = $injector.get('durationToPixelsFilter');
    }));

    it('should expect three or four arguments', function() {
      expect(function() {
        durationToPixels();
      }).toThrow();

      expect(function() {
        durationToPixels(300, 1234, 123);
        durationToPixels(300, 1234, 123, 1234);
      }).not.toThrow();
    });

    it('should expect container width with a parseable format', function() {
      expect(function() {
        durationToPixels(300, 1, 1);
        durationToPixels('300px', 1, 1);
        durationToPixels('30%', 1, 1);
        durationToPixels('5em', 1, 1);
        durationToPixels('12.8rem', 1, 1);
      }).not.toThrow();

      expect(function() {
        durationToPixels('50crap', 1, 1);
      }).toThrow();

      expect(function() {
        durationToPixels('bollocks', 1, 1);
      }).toThrow();
    });

    it('should expect total duration and element duration as numbers', function() {
      expect(function() {
        durationToPixels('3000px', 1, 1);
      }).not.toThrow();

      expect(function() {
        durationToPixels('300', 'dog', 1);
      }).toThrow();

      expect(function() {
        durationToPixels('300', 1, 'no');
      }).toThrow();
    });

    it('should return a width for an element scaled to the timeline viewport', function() {
      var viewportWidth = 1000
        , timelineDuration = 600000 // 10 minutes
        , elementDuration = 60000   // 1 minute
        , elementWidth;

      elementWidth = durationToPixels(viewportWidth, timelineDuration, elementDuration);
      expect(elementWidth).toEqual(100);
    });

    it('should return pixel values floored to the closest whole pixel', function() {
      var viewportWidth = 1111
        , timelineDuration = 600000 // 10 minutes
        , elementDuration = 60000   // 1 minute
        , elementWidth;

      elementWidth = durationToPixels(viewportWidth, timelineDuration, elementDuration);
      expect(elementWidth).toEqual(111);

      viewportWidth = '1111px';
      elementWidth = durationToPixels(viewportWidth, timelineDuration, elementDuration);
      expect(elementWidth).toEqual('111px');
    });

    it('should not floor rem, em, or % values', function() {
      var viewportWidth = '18.5rem'
        , timelineDuration = 600000 // 10 minutes
        , elementDuration = 60000   // 1 minute
        , elementWidth;

      elementWidth = durationToPixels(viewportWidth, timelineDuration, elementDuration);
      expect(elementWidth).toEqual('1.85rem');

      viewportWidth = '93%';
      elementWidth = durationToPixels(viewportWidth, timelineDuration, elementDuration);
      expect(elementWidth).toEqual('9.3%');
    });

    it('should return an element width in the same unit as the viewport width', function() {
      expect(Number(durationToPixels(100, 1, 1))).toBeTruthy();
      expect(durationToPixels('100px', 1, 1).match(/px/)).toBeTruthy();
      expect(durationToPixels('30%', 1, 1).match(/%/)).toBeTruthy();
      expect(durationToPixels('100pt', 1, 1).match(/pt/)).toBeTruthy();
      expect(durationToPixels('10.0em', 1, 1).match(/em/)).toBeTruthy();
      expect(durationToPixels('10.0rem', 1, 1).match(/rem/)).toBeTruthy();
    });
  });

  beforeEach(inject(function(_$compile_, $rootScope) {
    $compile = _$compile_;
    scope = $rootScope.$new();
  }));

  describe('lhTimelineChannel directive', function() {
    var tmpl;

    beforeEach(function() {
      scope.channel = {
        title: 'Test channel 1'
      , glyphicon: 'headphones'
      , type: 'audio'
      };

      tmpl = $compile('<lh-timeline-channel></lh-timeline-channel>')(scope);
      scope.$digest();
    });

    it('should have a title and icon class', function() {
      var title
        , icon;

      title = tmpl.find('span.channel_title').text();
      expect(title).toBe(scope.channel.title);
      icon = tmpl.find('span.glyphicon');
      expect(icon.hasClass('glyphicon-headphones')).toBe(true);
    });
  });

  describe('lhTimelineViewport directive', function() {
    var tmpl;

    beforeEach(function() {
      scope.title = 'Test timeline';

      tmpl = $compile('<lh-timeline-viewport><div class="timeline_channels"></div></lh-timeline-viewport>')(scope);
      scope.$digest();
    });

    it('should render the basic timeline viewport', function() {
      var heading
        , prevTitle;

      // Our directive should render a timeline title based on the title in
      // its scope.
      heading = tmpl.find('span.timeline_title');
      expect(heading.eq(0).text()).toBe(scope.title);

      prevTitle = scope.title;
      scope.$apply(function() {
        scope.title = 'test timeline 2';
      });
      heading = tmpl.find('span.timeline_title');
      expect(heading.eq(0).text()).toBe(scope.title);
      expect(heading.eq(0).text()).not.toBe(prevTitle);

      // The directive should replace itself with a div.timeline
      expect(tmpl.prop('tagName').toLowerCase()).toBe('div');
      expect(tmpl.hasClass('timeline')).toBe(true);
    });

    it('should broadcast a scope event when the user scrolls the viewport', function() {
      var content, viewport;
      spyOn(scope, '$broadcast');
      expect(scope.$broadcast).not.toHaveBeenCalled();
      content = tmpl.find('.timeline_channels');
      viewport = tmpl.find('.timeline_viewport');
      content.css('width', '1000px');
      viewport.css('width', '200px');

      viewport.scrollLeft(800);
      viewport.triggerHandler('scroll');
      expect(scope.$broadcast).toHaveBeenCalledWith('timelineScrolled', 0, 0);
    });
  });

  describe('lhTimelineScrollView directive', function() {
    var $compile
      , $scope
      , viewport
      , scrollView;

    beforeEach(inject(function(_$compile_, $rootScope) {
      $compile = _$compile_;
      $scope = $rootScope.$new();
      $scope.title = 'test timeline';
      viewport = $compile('<lh-timeline-viewport><div class="content">Test</div></lh-timeline-viewport>')($scope);
      $scope.$digest();
      viewport.css({width: '800px'});
      viewport.trigger('resize');
      scrollView = viewport.find('div.timeline_viewport');
    }));

    it('should be sized larger than the viewport based on the buffer', function() {
      var viewportWidth
        , scrollViewWidth;

      viewportWidth = viewport.width();
      scrollViewWidth = scrollView.width();
      expect(scrollViewWidth).toBeGreaterThan(viewportWidth);
      // Default buffer is 5 minutes either side, so we end up with
      // double the width in this default case.
      expect(scrollViewWidth).toEqual(1600);

      viewport = $compile('<lh-timeline-viewport buffer-minutes="2">Test 2</lh-timeline-viewport>')($scope);
      $scope.$digest();
      scrollView = viewport.find('div.timeline_viewport');
      viewport.css({width: '800px'});
      viewport.trigger('resize');
      expect(scrollView.width()).toEqual(1120);
    });

    it('should resize itself when the viewport resizes', function() {
      // Starting size
      expect(scrollView.width()).toEqual(1600);

      viewport.css({width: '1200px'});
      viewport.trigger('resize');
      expect(scrollView.width()).toEqual(2400);
    });
  });

  describe('TimelineController', function() {
    var $scope
      , $controller;

    beforeEach(inject(function($rootScope, _$controller_) {
      $controller = _$controller_;
      $scope = $rootScope.$new();
      $controller('TimelineController', {$scope: $scope, $attrs: {}
        , $element: angular.element('<div />')});
    }));

    it('should add start and end Dates to the scope', function() {
      expect($scope.start() instanceof Date).toBeTruthy();
      expect($scope.end() instanceof Date).toBeTruthy();
    });

    it('should have a method for setting getStart and end dates', function() {
      var start = new Date(2014, 2, 5, 9)
        , end = new Date(2014, 2, 5, 9, 15);

      expect($scope.start()).not.toEqual(start);
      expect($scope.end()).not.toEqual(end);

      $scope.setTimelineBounds(start, end);
      expect($scope.start()).toEqual(start);
      expect($scope.end()).toEqual(end);
    });

    it('should expect Date objects for the getStart and end dates', function() {
      expect(function() {
        $scope.setTimelineBounds(1, 'no');
      }).toThrow();
    });

    it('should not allow the start to be the same or later than end', function() {
      expect(function() {
        var start = new Date(2014, 2, 5, 9, 15)
          , end = new Date(2014, 2, 5, 9);
        $scope.setTimelineBounds(start, end);
      }).toThrow();

      expect(function() {
        var start = new Date(2014, 2, 5, 9)
          , end = new Date(2014, 2, 5, 9);
        $scope.setTimelineBounds(start, end);
      }).toThrow();
    });

    it('should calculate the duration of the visible timeline', function() {
      var start = new Date(2014, 2, 5, 9)
        , end = new Date(2014, 2, 5, 9, 15)
        , duration;

      $scope.setTimelineBounds(start, end);
      duration = $scope.duration();
      expect(duration).toEqual(900000);
    });

    it('should add a buffer value in milliseconds to the scope', function() {
      expect($scope.buffer).toBeDefined();
      expect($scope.buffer()).toEqual(300000);
    });

    it('should allow the user to specify the buffer in minutes', function() {
      $controller('TimelineController', {$scope: $scope, $attrs: {bufferMinutes: '2'}
        , $element: angular.element('<div />')});
      expect($scope.buffer()).toEqual(120000);
    });

    it('should provide access to the $element it is instantiated with', function() {
      expect($scope.viewport).toBeDefined();
      expect(angular.isElement($scope.viewport())).toBeTruthy();
    });
  });

  describe('lhTimelineRepeat directive', function() {
    var tmpl
      , durationToPixels
      , datasource
      , viewport
      , channel
      , called; // We want to track the loadingFn callback, for some reason my spy is not working. Asynchronous? Not really

    beforeEach(function() {
      inject(function($filter) {
        durationToPixels = $filter('durationToPixels');
        datasource = {
          get: function() {}
        , loading: function() {
            called = true;
          }
        , revision: 0
        };
        scope.datasource = datasource;
        tmpl = $compile('<lh-timeline-viewport visible-minutes="10" threshold="0.3"><lh-timeline-channel><div lh-timeline-repeat="item in datasource">{{title}}</div></lh-timeline-channel></lh-timeline-viewport>')(scope);
        scope.$digest();
        $('body').height(800).append(tmpl);
        viewport = tmpl.find('.timeline_viewport');
        channel = tmpl.find('.timeline_channel_content');
        viewport.css({width: '800px', height: '30px'});
        channel.css({width: '3000px', height: '30px'});
        called = false;
      });
    });

    afterEach(function() {
      tmpl.remove();
    });

    it('should create a wrapper and padding elements', function() {
      var wrapper
        , beforePadding
        , afterPadding;

      wrapper = tmpl.find('.timeline_repeat_wrapper');
      expect(wrapper.children().length).toBe(3);
      beforePadding = wrapper.children().eq(0);
      afterPadding = wrapper.children().eq(2);
      expect(beforePadding.length).toBe(1);
      expect(beforePadding.prop('tagName').toLocaleLowerCase()).toEqual('div');
      expect(beforePadding.hasClass('timeline_repeat_padding')).toBeTruthy();
      expect(beforePadding.hasClass('before')).toBeTruthy();
      expect(afterPadding.length).toBe(1);
      expect(afterPadding.prop('tagName').toLocaleLowerCase()).toEqual('div');
      expect(afterPadding.hasClass('timeline_repeat_padding')).toBeTruthy();
      expect(afterPadding.hasClass('after')).toBeTruthy();
    });

    it('should have a scroll threshold which triggers loading when scrolling a certain distance', function() {
      var scrollPixels
        , belowThreshold;

      expect(called).toBeFalsy();

      scrollPixels = durationToPixels(viewport.width(), 600000, 240000);
      belowThreshold = scrollPixels / 2;
      viewport.scrollLeft(belowThreshold);
      viewport.triggerHandler('scroll');
      expect(called).toBeFalsy();

      viewport.scrollLeft(scrollPixels);
      viewport.triggerHandler('scroll');
      expect(called).toBeTruthy();
    });

    it('should reset the scroll threshold each time it is triggered', function() {
      var scrollPixels;

      expect(called).toBeFalsy();

      scrollPixels = durationToPixels(viewport.width(), 600000, 240000);
      viewport.scrollLeft(scrollPixels);
      viewport.triggerHandler('scroll');
      expect(called).toBeTruthy();

      called = false;
      viewport.scrollLeft(scrollPixels * 2);
      viewport.triggerHandler('scroll');
      expect(called).toBeTruthy();
    });

    it('should add equivalent padding to the beginning when scrolling right past the threshold', function() {
      var scrollPixels
        , startPadding;

      startPadding = tmpl.find('.timeline_repeat_padding.before');
      scrollPixels = durationToPixels(viewport.width(), 600000, 240000);

      expect(startPadding.width()).toEqual(0);
      viewport.scrollLeft(scrollPixels);
      viewport.triggerHandler('scroll');
      expect(startPadding.width()).toEqual(scrollPixels);
    });

    it('should add equivalent padding to the end when scrolling left past the threshold', function() {
      var scrollPixels
        , endPadding;

      endPadding = tmpl.find('.timeline_repeat_padding.after');
      scrollPixels = durationToPixels(viewport.width(), 600000, 240000);

      expect(endPadding.width()).toEqual(0);
      viewport.scrollLeft(scrollPixels);
      viewport.triggerHandler('scroll');
      expect(endPadding.width()).toEqual(scrollPixels);
    });
  });
});