// generated on 2016-11-24 using generator-ddiy 0.2.2
const gulp            = require('gulp');
const gutil           = require('gulp-util');
var reqDir = require('require-dir'), tasks = reqDir('tasks/'); 
var env = gutil.env.env || 'development';

gulp.task('info', ()=>{
  gutil.log(env);
})












