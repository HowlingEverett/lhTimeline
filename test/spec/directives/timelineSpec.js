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
      scope.channels = [
        {title:'Channel 1', type: 'audio'}
        , {title: 'Channel 2', type: 'location'}
        , {title: 'Channel 3', type: 'photo'}
      ];

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

//    it('should render sub-sections for each timeline channel', function() {
//      var channels;
//
//      channels = $(tmpl).find('div.timeline_channel');
//      expect(channels.length).toBe(3);
//    });
//
//    it('should pass channel data down to its contained channel directives', function() {
//      var channel;
//
//      // Grab what should be the first of three channels rendered using the lhTimelineChannel
//      // directive
//      channel = $(tmpl).find('div.timeline_channel h4').eq(0);
//      // Confirm it gets a title from the relevant channels object on the scope
//      expect(channel.text()).toEqual(scope.channels[0].title);
//    });

    it('should broadcast a scope event when the user scrolls the viewport', function() {
      var content, viewport;
      spyOn(scope, '$broadcast');
      expect(scope.$broadcast).not.toHaveBeenCalledWith('viewportScrolled');

      content = tmpl.find('.timeline_channels');
      viewport = tmpl.find('.timeline_viewport');
      content.css('width', '1000px');
      viewport.css('width', '200px');
      viewport.scrollLeft(800);
      viewport.triggerHandler('scroll');
      expect(scope.$broadcast).toHaveBeenCalledWith('viewportScrolled');
    });
  });

  describe('lhTimelineRepeat directive', function() {

    beforeEach(function() {
      scope.items = {get: function() {}};
    });

    it('Should expect a parameter in the form \'thing in thingService\'', function() {
      expect(function() {
        $compile('<lh-timeline-viewport><div lh-timeline-repeat="bad parameter"></div></lh-timeline-viewport>')(scope);
        scope.$digest();
      }).toThrow();

      expect(function() {
        $compile('<lh-timeline-viewport><div lh-timeline-repeat="item in items"></div></lh-timeline-viewport>')(scope);
        scope.$digest();
      }).not.toThrow();
    });

    it('Should accept the service as a variable on the scope', function() {
      // Mock timeline service on the scope
      expect(function() {
        scope.timelineService = { get: function() {} };
        $compile('<lh-timeline-viewport><div lh-timeline-repeat="item in timelineService"></div></lh-timeline-viewport>')(scope);
        scope.$digest();
      }).not.toThrow();
    });

    it('Should accept a service locatable by the injector', function() {
      expect(function() {
        $compile('<lh-timeline-viewport><div lh-timeline-repeat="item in timelineService"></div></lh-timeline-viewport>')(scope);
        scope.$digest();
      }).not.toThrow();
    });

    it('Should expect either a service or a scope object with a `get` function', function() {
      expect(function() {
        $compile('<lh-timeline-viewport><div lh-timeline-repeat="item in nonExistentService"></div></lh-timeline-viewport>')(scope);
        scope.$digest();
      }).toThrow();
    });

    it('Should expect the service to supply start and end times', function() {
      inject(function(MockTimeline, MockChannel) {

      });
    });
  });
});