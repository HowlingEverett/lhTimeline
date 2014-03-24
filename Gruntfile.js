'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    // Development server with LiveReload
    paths: {
      demo: require('./bower.json').demoPath || 'demo',
      dist: 'dist'
    },

    watch: {
      js: {
        files: [
          'lhTimeline.js',
          'lhServiceUtils.js',
          '<%= paths.demo %>/{,*/}*.js'
        ],
        tasks: ['newer:jshint:all']
      },
      jsTest: {
        files: [
          '<%= paths.demo %>/{,*/}*.js',
          'test/*.js',
          'test/spec/{,*/}*.js',
          'lhTimeline.js',
          'lhServiceUtils.js'
        ],
        tasks: ['newer:jshint:test', 'karma:unit']
      }
    },

    connect: {
      options: {
        port: 9010,
        hostname: 'localhost'
      },

      test: {
        options: {
          base: [
            '.tmp',
            'test',
            'src',
            '',
            '<%= paths.demo %>'
          ]
        }
      }
    },

    open: {
      dev: {
        path: 'http://localhost:<%= connect.options.port %>',
        app: 'Google Chrome'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish'),
        force: true
      },
      all: [
        'Gruntfile.js',
        '<%= paths.demo %>/{,*/}*.js'
      ],
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    'bowerInstall': {
      demo: {
        src: ['<%= paths.demo %>/index.html'],
        ignorePath: '<%= paths.demo %>/'
      }
    },

    // Karma options. Load Karma configuration from the karma.conf.js file
    karma: {
      options: {
        configFile: 'karma.conf.js',
        singleRun: true
      },
      unit: {
        browsers: ['PhantomJS']
      },
      nix: {
        browsers: ['Chrome', 'Firefox', 'Safari']
      },
      windows: {
        browsers: ['IE', 'Chrome', 'Firefox']
      }
    }
  });

  grunt.registerTask('serve', function() {
    grunt.task.run([
      'bowerInstall',
      'connect',
      'open:dev',
      'watch'
    ]);
  });
  
  grunt.registerTask('livetest', [
    'karma:unit',
    'watch'
  ]);
};