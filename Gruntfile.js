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
          '<%= paths.demo %>/{,*/}*.js'
        ],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: true
        }
      },
      jsTest: {
        files: [
          '<%= paths.demo %>/{,*/}*.js',
          'test/spec/{,*/}*.js'
        ],
        tasks: ['newer:jshint:test', 'karma:unit']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= paths.demo %>/index.html',
          '.tmp/styles/{,*/}*.css'
        ]
      }
    },

    connect: {
      options: {
        port: 9000,
        hostname: 'localhost',
        livereload: 35729
      },

      livereload: {
        options: {
          base: [
            '.tmp',
            '<%= paths.demo %>'
          ]
        }
      },

      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
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

  grunt.registerTask('demo', function() {
    grunt.task.run([
      'bowerInstall',
      'connect:livereload',
      'open:dev',
      'watch'
    ]);
  });
};