let gulp = require('gulp'); // Ядро
let changed = require('gulp-changed'); // Позволяет пересобирать конкретный файл при изменениях, а не весь проект
let pug = require('gulp-pug'); // Компиляция pug в html
let sass = require('gulp-sass'); // Компиляция sass в css
let autoprefixer = require('gulp-autoprefixer'); // Добавляет вендорные префиксы в css
let sourcemaps = require('gulp-sourcemaps'); // Создаёт sourcemaps (нужен для того чтобы понимать расположение кода в исходниках)
let data = require('gulp-data'); // Позволяет использовать JSON файлы для хранения данных, данные могут быть вызваны в PUG в качестве объекта
let fs = require('fs'); // Необходимо для работы gulp-data с JSON
let babel = require('gulp-babel'); // Компиляция нового синтиксиса JS в старый
let concat = require('gulp-concat'); // Объеденяет несколько файлов в 1
let uglify = require('gulp-uglify'); // Минификация JS
let gulpif = require('gulp-if'); // Позволяет использовать if в pipe
let browserSync = require('browser-sync'); // Сервер
let svgSymbols = require('gulp-svg-symbols'); // Создание спрайта на основе svg
let spritesmith = require('gulp.spritesmith'); // Создание спрайта на основе png
let rename = require('gulp-rename'); // Позволяет переименовывать в pipe
let rev = require('gulp-rev'); // Переиминовует файлы (сброс кеша)
let revRewrite = require('gulp-rev-rewrite'); // Меняет пути в HTML (сброс кеша)
let del = require('del'); // Удаление папки / файла

let isProduction = process.env.NODE_ENV ? true : false;

// Сервер http://localhost:3000/
function serve() {
  return browserSync.init({
    server: {
      baseDir: './build',
    },
  });
}

// Копирование картинок
function copyImg() {
  return gulp
    .src('src/assets/img/**/*.*')
    .pipe(changed('src/assets/img/**/*.*'))
    .pipe(gulp.dest('build/assets/img'));
}

// Создание SVG спрайта
function spriteSvg() {
  return gulp
    .src('src/assets/icons/**/*.svg')
    .pipe(changed('src/assets/icons/**/*.svg'))
    .pipe(svgSymbols())
    .pipe(gulp.dest('build/assets/icons'));
}

// Создание PNG спрайта
function spritePng() {
  return gulp
    .src('src/assets/icons/**/*.png')
    .pipe(changed('src/assets/icons/**/*.png'))
    .pipe(
      spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css',
      })
    )
    .pipe(gulp.dest('build/assets/icons'));
}

// Копирование сторонних библиотек
function copyVendors() {
  return gulp
    .src('src/assets/vendors/**/*.*')
    .pipe(changed('src/assets/vendors/**/*.*'))
    .pipe(gulp.dest('build/assets/vendors'));
}

// Копирование шрифров
function copyFonts() {
  return gulp
    .src('src/assets/fonts/**/*.*')
    .pipe(changed('src/assets/fonts/**/*.*'))
    .pipe(gulp.dest('build/assets/fonts'));
}

// Копирование разных файлов типа favicon.ico в корень сайта
function copyRoot() {
  return gulp
    .src('src/assets/root/**/*.*')
    .pipe(changed('src/assets/root/**/*.*'))
    .pipe(gulp.dest('build'));
}

// Сборка общих скриптов (глобальные файлы + компоненты)
function jsApp() {
  return gulp
    .src(['src/assets/js/**/*.js', 'src/block/**/*.js'])
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(concat('app.js'))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulpif(!isProduction, sourcemaps.write('.')))
    .pipe(gulp.dest('build/assets'));
}

// Сборка JS для отдельных страниц
function jsPages() {
  return gulp
    .src('src/pages/**/*.js')
    .pipe(changed('src/pages/**/*.js'))
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(
      rename((path) => {
        path.basename = path.dirname;
        path.dirname = '';
      })
    )
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulpif(!isProduction, sourcemaps.write('.')))
    .pipe(gulp.dest('build/assets/pages'));
}

// Сборка общих стилей (глобальные файлы + компоненты)
function cssApp() {
  return gulp
    .src('src/assets/style/style.sass')
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(sass(gulpif(isProduction, { outputStyle: 'compressed' })))
    .pipe(autoprefixer())
    .pipe(concat('style.css'))
    .pipe(gulpif(!isProduction, sourcemaps.write('.')))
    .pipe(gulp.dest('build/assets'));
}

// Сборка CSS для отдельных страниц
function cssPages() {
  return gulp
    .src('src/pages/**/*.sass')
    .pipe(changed('src/pages/**/*.sass'))
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(
      rename((path) => {
        path.basename = path.dirname;
        path.dirname = '';
      })
    )
    .pipe(sass(gulpif(isProduction, { outputStyle: 'compressed' })))
    .pipe(autoprefixer())
    .pipe(gulpif(!isProduction, sourcemaps.write('.')))
    .pipe(gulp.dest('build/assets/pages'));
}

// Сборка HTML страниц.
function pagesHtml() {
  return gulp
    .src('src/pages/**/*.pug')
    .pipe(changed('src/**/*.pug'))
    .pipe(
      data(() => {
        return JSON.parse(fs.readFileSync('./src/data/data.json'));
      })
    )
    .pipe(pug({ pretty: true }))
    .pipe(rename({ dirname: '' }))
    .pipe(gulp.dest('build'));
}

// Отслежывание измений - запускает пересборку / копирование / обновляет страницу
function watch() {
  gulp.watch('src/assets/img/**/*.*', copyImg);
  gulp.watch('src/assets/icons/**/*.svg', spriteSvg);
  gulp.watch('src/assets/icons/**/*.png', spritePng);
  gulp.watch('src/assets/vendors/**/*.*', copyVendors);
  gulp.watch('src/assets/fonts', copyFonts);
  gulp.watch('src/assets/root', copyRoot);
  gulp.watch('src/assets/js', jsApp);
  gulp.watch('src/block/**/*.js', jsApp);
  gulp.watch('src/pages/**/*.js', jsPages);
  gulp.watch('src/block/**/*.sass', cssApp);
  gulp.watch('src/assets/style/**/*.sass', cssApp);
  gulp.watch('src/pages/**/*.sass', cssPages);
  gulp.watch('src/**/*.pug', pagesHtml);
  gulp.watch('src').on('change', browserSync.reload);
}

// Переиминовует css|js файлы (сброс кеша для продакшена)
function rewriteAssets() {
  return gulp
    .src(['build/assets/**/*.+(css|js)'], { base: './build' })
    .pipe(rev())
    .pipe(gulp.dest('build'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('build/assets'));
}

// Переиминовует пути css|js в html файлах (сброс кеша для продакшена)
function rewriteHtml() {
  let manifest = gulp.src('build/assets/rev-manifest.json');
  return gulp
    .src('build/*.html')
    .pipe(revRewrite({ manifest }))
    .pipe(gulp.dest('build'));
}

// Удаление папки "build" при запуске gulp
function clean() {
  return del(['build']);
}

let tasks = [
  copyImg,
  spriteSvg,
  spritePng,
  copyVendors,
  copyFonts,
  copyRoot,
  jsApp,
  jsPages,
  cssApp,
  cssPages,
  pagesHtml,
];

// Таски в зависимомти от того, прод или разработка
let build = isProduction
  ? gulp.series(clean, tasks, rewriteAssets, rewriteHtml, serve)
  : gulp.series(clean, tasks, gulp.parallel(watch, serve));

exports.default = build;
