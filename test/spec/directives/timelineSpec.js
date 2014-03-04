'use strict';

angular.module('lh.mocks', []).service('timelineService', function() {
  return {
    get: function() {}
  };
});

describe('lhTimeline directive', function() {
  var $compile
    , scope;

  beforeEach(module('lh.timeline'));
  beforeEach(module('lh.mocks'));
  beforeEach(module('views/timeline.html', 'views/timeline_channel.html'));

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
        $compile('<div lh-timeline-repeat="bad parameter"></div>')(scope);
        scope.$digest();
      }).toThrow();

      expect(function() {
        $compile('<div lh-timeline-repeat="item in items"></div>')(scope);
        scope.$digest();
      }).not.toThrow();
    });

    it('Should accept the service as a variable on the scope', function() {
      // Mock timeline service on the scope
      expect(function() {
        scope.timelineService = { get: function() {} };
        $compile('<div lh-timeline-repeat="item in timelineService"></div>')(scope);
        scope.$digest();
      }).not.toThrow();
    });

    it('Should accept a service locatable by the injector', function() {
      expect(function() {
        $compile('<div lh-timeline-repeat="item in timelineService"></div>')(scope);
        scope.$digest();
      }).not.toThrow();
    });

    it('Should expect either a service or a scope object with a `get` function', function() {
      expect(function() {
        $compile('<div lh-timeline-repeat="item in nonExistentService"></div>')(scope);
        scope.$digest();
      }).toThrow();
    });
  });
});