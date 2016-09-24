module.exports = function(grunt) {

	//Loading Plugin
	[
		'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
		'grunt-contrib-less',
		'grunt-contrib-uglify',
		'grunt-contrib-cssmin',
		'grunt-hashres',
		'grunt-lint-pattern'
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});

	//Setting Plugin
	grunt.initConfig({
		cafemocha: {
			all: {src:'qa/tests-*.js', options:{ui: 'tdd'}}
		},
		jshint: {
			app:['app.js', 'public/js/**/*.js', 'lib/**/*.js'],
			qa:['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js']
		},
		exec: {
			linkchecker:
				{cmd: 'linkchecker http://localhost:3000'}
		},
		less: {
			development: {
				options: {
					customFunctions: {
						static: function(lessObject, name) {
							return 'url("' + require('./lib/static.js').map(name.value) + '")';
						}
					}
				},
				files:{
					'public/css/style.css': 'less/main.less',
					'public/css/cart.css': 'less/cart.less'
				}
			}
		},
		uglify: {
			all: {
				files: {
					'public/js/meadowlark.min.js': ['public/js/**/*.js']
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/css/meadowlark.css': ['public/css/**/*.css', '!public/css/meadowlark*.css']
				}
			},
			minify: {
				src: 'public/css/meadowlark.css',
				dest: 'public/css/meadowlark.min.css'
			}
		},
		hashres: {
			options: {
				fileNameFormat: '${name}.${hash}.${ext}'
			},
			all: {
				src: [
					'public/js/meadowlark.min.js',
					'public/css/meadowlark.min.css',
				],
				dest: [
					'config.js'
				]
			}
		},

		lint_pattern: {
			view_statics: {
				options: {
					rules: [
						{
							pattern: /<link [^>]*href=["'](?!\{static )/,
							message: 'Un-mapped static resource found in <link>'
						},
						{
							pattern: /<script [^>]*src=["'](?!\{static )/,
							message: 'Un-mapped static resource found in <script>'
						},
						{
							pattern: /<img [^>]*href=["'](?!\{static )/,
							message: 'Un-mapped static resource found in <img>'
						},
					]
				},
				files: {
					src:[
						'views/**/*.handlebars'
					]
				}
			},
			css_statics: {
				options: {
					rules: [
						{
							patter: /url\(/,
							message: 'Un-mapped static found in LESS property.'
						}
					]
				},
				files: {
					src: [
						'less/**/*.less'
					]
				}
			}
		}

	});

	//Register Task
	// grunt.registerTask('default', ['cafemocha', 'jshint', 'exec', 'lint_pattern']);
	grunt.registerTask('default', ['exec', 'lint_pattern']);
	grunt.registerTask('static', ['less', 'cssmin', 'uglify', 'hashres']);
};