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
  
  describe('lhTimelineViewport directive', function() {
    it('should render the basic timeline viewport', function() {
      var tmpl
        , heading
        , prevTitle;

      // Our directive should render a timeline title based on the title in
      // its scope.
      scope.title = 'Test Timeline';
      tmpl = $compile('<lh-timeline-viewport></lh-timeline-viewport>')(scope);
      scope.$digest();
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
      var tmpl
        , channels;

      scope.title = 'Test timeline';
      scope.channels = [
        {title:'Channel 1'}
        , {title: 'Channel 2'}
        , {title: 'Channel 3'}
      ];

      tmpl = $compile('<lh-timeline-viewport></lh-timeline-viewport>')(scope);
      scope.$digest();
      channels = $(tmpl).find('div.timeline_channel');
      expect(channels.length).toBe(3);
    });
  });

  describe('lhTimelineChannel directive', function() {

  });

  describe('lhTimeline directive', function() {

  });
});