'use strict';

describe('lhTimeline directive', function() {
  var $compile
    , scope;

  beforeEach(module('lh.timeline'));
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
      };

      tmpl = $compile('<lhTimelineRepeat-channel></lhTimelineRepeat-channel>')(scope);
      scope.$digest();
    });

    it('should have a title and icon class', function() {
      var title
        , icon;

      title = $(tmpl).find('h4').text();
      expect(title).toBe(scope.channel.title);
      icon = $(tmpl).find('span.glyphicon');
      expect(icon.hasClass('glyphicon-headphones')).toBe(true);
    });
  });

  describe('lhTimelineViewport directive', function() {
    var tmpl;

    beforeEach(function() {
      scope.title = 'Test timeline';
      scope.channels = [
        {title:'Channel 1'}
        , {title: 'Channel 2'}
        , {title: 'Channel 3'}
      ];

      tmpl = $compile('<lhTimelineRepeat-viewport></lhTimelineRepeat-viewport>')(scope);
      scope.$digest();
    });

    it('should render the basic timeline viewport', function() {
      var heading
        , prevTitle;

      // Our directive should render a timeline title based on the title in
      // its scope.
      heading = $(tmpl).find('h2.timeline_title');
      expect(heading.eq(0).text()).toBe(scope.title);

      prevTitle = scope.title;
      scope.$apply(function() {
        scope.title = 'test timeline 2';
      });
      heading = $(tmpl).find('h2.timeline_title');
      expect(heading.eq(0).text()).toBe(scope.title);
      expect(heading.eq(0).text()).not.toBe(prevTitle);

      // The directive should replace itself with a div.timeline
      expect($(tmpl).prop('tagName').toLowerCase()).toBe('div');
      expect($(tmpl).hasClass('timeline')).toBe(true);
    });

    it('should render sub-sections for each timeline channel', function() {
      var channels;

      channels = $(tmpl).find('div.timeline_channel');
      expect(channels.length).toBe(3);
    });

    it('should pass channel data down to its contained channel directives', function() {
      var channel;

      // Grab what should be the first of three channels rendered using the lhTimelineChannel
      // directive
      channel = $(tmpl).find('div.timeline_channel h4').eq(0);
      // Confirm it gets a title from the relevant channels object on the scope
      expect(channel.text()).toEqual(scope.channels[0].title);
    });

    it('should broadcast a scope event when the user scrolls the viewport', function() {
      spyOn(scope, '$broadcast');
      tmpl.appendTo('body');
      expect(scope.$broadcast).not.toHaveBeenCalledWith('viewportScrolled');
      tmpl.css({overflow: 'scroll', 'width': '200px'});
      tmpl.find('ul').css('width', '1000px');
      tmpl.scrollLeft(800);
      tmpl.triggerHandler('scroll');
      expect(scope.$broadcast).toHaveBeenCalledWith('viewportScrolled');
    });


  });

  describe('lhTimelineRepeat directive', function() {

  });
});