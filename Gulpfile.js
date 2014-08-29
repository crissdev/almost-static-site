var gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    argv = require('yargs').argv,
    notifier = new require('node-notifier')();

// Require target specific configuration
var target = require('./config/' + (argv.target || 'dev') + '.js' )

function logErrorAndNotify(e) {
  notifier.notify({
    title:'Error on ' + e.plugin,
    message: e.message
  });
  gutil.log('Error running task', e.plugin, e.message);
  gutil.log(e.stack);
}

// Clean
gulp.task('clean', function() {
  return gulp.src(target.dirs.dist + '/**/*', {read: false, force:true})
  .pipe(clean());
});


// JSHint
var jshint = require('gulp-jshint');
gulp.task('lint', function() {
  return gulp.src(target.dirs.src + '/*.js')
  .pipe(jshint())
  .on('error', logErrorAndNotify)
  .pipe(jshint.reporter('default'));
});


// Browserify
var browserify = require('gulp-browserify');
gulp.task('browserify', ['lint'], function() {
  var stream = gulp.src([target.dirs.src + '/main.js'])
  .pipe(browserify())
  .on('error', logErrorAndNotify)
  .pipe(concat('main.js'))
  .on('error', logErrorAndNotify)
  .pipe(gulp.dest(target.dirs.dist))
  if ( target.server.enableLiveReload ) {
    stream.pipe(liveReload(liveReloadServer));
  }
});
gulp.task('watch', ['lint'], function() {
  gulp.watch([target.dirs.src + '/*.js', target.dirs.src + '/**/*.js'],[
    'lint',
    'browserify'
  ]);
});


// Views
gulp.task('views', function() {
  var stream = gulp.src(['**/*.html'], {cwd:target.dirs.src})
  .on('error', logErrorAndNotify)
  .pipe(gulp.dest(target.dirs.dist));
  if ( target.server.enableLiveReload ) {
    stream.pipe(liveReload(liveReloadServer));
  }
  return stream;
});
gulp.watch([target.dirs.src + '/index.html', target.dirs.src + '/views/**/*.html'], [
  'views'
]);


// SASS
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
// Styles task
gulp.task('styles', function() {
  var stream = gulp.src(target.dirs.src + '/css/main.scss')
  // The onerror handler prevents Gulp from crashing when you make a mistake in your SASS
  .pipe(sass({
    onError: logErrorAndNotify
  }))
  .pipe(autoprefixer("last 2 versions", "> 1%", "ie 8"))
  .pipe(gulp.dest(target.dirs.dist));
  if ( target.server.enableLiveReload ) {
    stream.pipe(liveReload(liveReloadServer));
  }
  return stream;
});
gulp.watch([target.dirs.src + '/**/*.scss'], [
  'styles'
]);


// Server
var liveReload = require('gulp-livereload'),
    liveReloadServer = require('tiny-lr')(),
    connectLiveReload = require('connect-livereload'),
    express = require('express');

var server = express();

// Setup

// Enable APP
if ( target.server.enableLiveReload ) {
  server.use(connectLiveReload({port: target.liveReloadPort}));
}
server.use(express.static(target.dirs.dist));

// Enable pushstate
server.all('/*', function(req, res) {
  res.sendFile('index.html', {
    root: target.dirs.dist
  });
});


// Start
gulp.task('server', ['build'], function() {
  server.listen(target.server.port);
  if ( target.server.enableLiveReload ) {
    liveReloadServer.listen(target.server.liveReloadPort);
  }
});


// API
var yaml = require('gulp-yaml');

gulp.task('yaml', function(done){
  var stream = gulp.src('api/**/*.yaml', {cwd:target.dirs.src})
  .pipe(yaml())
  .pipe(gulp.dest(target.dirs.api));
  if ( target.server.enableLiveReload ) {
    stream.pipe(liveReload(liveReloadServer));
  }
  return stream;
});

// Generic tasks
gulp.task('build', ['yaml', 'styles', 'views', 'browserify'])

// Target specific tasks
Object.keys(target.tasks).forEach(function(name){
  gulp.task(name, target.tasks[name]);
});


