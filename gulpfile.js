const gulp = require("gulp");
const del = require("del");
const typescript = require("gulp-typescript");
const tslint = require("gulp-tslint");
const sourcemaps = require('gulp-sourcemaps');

const tscConfig = require("./tsconfig.json");

// clean the contents of the distribution directory
gulp.task("clean", function () {
    return del("dist/**/*");
});

// TypeScript compile
gulp.task("compile:sourcemaps", ["clean"], function () {
    return gulp
        .src(sourcests)
        .pipe(sourcemaps.init())
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest("dist/"));
});

gulp.task("compile", ["clean"], function () {
    return gulp
        .src(sourcests)
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(gulp.dest("dist/"));
});

// copy dependencies
gulp.task("copy:libs", ["clean"], function() {
    return gulp.src(dependencies,{base: "./"})
    .pipe(gulp.dest("dist"))
});

// copy static assets - i.e. non TypeScript compiled source
gulp.task("copy:assets", ["clean"], function() {
    return gulp.src(
        [
            "app*/*.css",
            "app*/*.html",
            "app.options/*.js",
            "icons/*.png",
            "i18n/*.json",
            "manifest.json",
            "index.*",
            "background.*",
            "systemjs.config.js"
        ],
        { base : "./" })
        .pipe(gulp.dest("dist"))
});

gulp.task("tslint", function() {
    return gulp.src(sourcests)
        .pipe(tslint({ formatter: "verbose" }))
        .pipe(tslint.report());
});

gulp.task("build:dev", ["tslint", "compile:sourcemaps", "copy:assets", "copy:libs"]);
gulp.task("build:prod", ["tslint", "compile", "copy:assets", "copy:libs"]);

gulp.task("default", ["build:dev"]);

const sourcests = ["app/*.ts","app.background/*.ts","*.ts"];

const dependencies = [
        "node_modules/core-js/client/shim.min.js",
        "node_modules/zone.js/dist/zone.js",
        "node_modules/reflect-metadata/Reflect.js",
        "node_modules/systemjs/dist/system.src.js",
        "node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js",
        "node_modules/@angular/core/bundles/core.umd.js",
        "node_modules/@angular/platform-browser/bundles/platform-browser.umd.js",
        "node_modules/@angular/http/bundles/http.umd.js",
        "node_modules/@angular/compiler/bundles/compiler.umd.js",
        "node_modules/@angular/common/bundles/common.umd.js",
        "node_modules/rxjs/Subject.js",
        "node_modules/rxjs/Observable.js",
        "node_modules/rxjs/add/Observable/interval.js",
        "node_modules/rxjs/add/Observable/bindCallback.js",
        "node_modules/rxjs/add/operator/map.js",
        "node_modules/rxjs/add/Observable/of.js",
        "node_modules/rxjs/add/operator/concatMap.js",
        "node_modules/rxjs/add/operator/timeout.js",
        "node_modules/rxjs/Observable.js",
        "node_modules/rxjs/Subscriber.js",
        "node_modules/rxjs/Subscription.js",
        "node_modules/rxjs/SubjectSubscription.js",
        "node_modules/rxjs/symbol/rxSubscriber.js",
        "node_modules/rxjs/util/throwError.js",
        "node_modules/rxjs/util/ObjectUnsubscribedError.js",
        "node_modules/rxjs/util/root.js",
        "node_modules/rxjs/symbol/observable.js",
        "node_modules/rxjs/util/toSubscriber.js",
        "node_modules/rxjs/operator/toPromise.js",
        "node_modules/rxjs/observable/PromiseObservable.js",
        "node_modules/rxjs/observable/interval.js",
        "node_modules/rxjs/observable/bindCallback.js",
        "node_modules/rxjs/operator/map.js",
        "node_modules/rxjs/observable/of.js",
        "node_modules/rxjs/operator/concatMap.js",
        "node_modules/rxjs/operator/timeout.js",
        "node_modules/rxjs/util/isFunction.js",
        "node_modules/rxjs/Observer.js",
        "node_modules/rxjs/util/isArray.js",
        "node_modules/rxjs/util/isObject.js",
        "node_modules/rxjs/util/tryCatch.js",
        "node_modules/rxjs/util/errorObject.js",
        "node_modules/rxjs/util/isDate.js",
        "node_modules/rxjs/scheduler/async.js",
        "node_modules/rxjs/operator/mergeMap.js",
        "node_modules/rxjs/observable/ArrayObservable.js",
        "node_modules/rxjs/observable/BoundCallbackObservable.js",
        "node_modules/rxjs/observable/IntervalObservable.js",
        "node_modules/rxjs/util/UnsubscriptionError.js",
        "node_modules/rxjs/util/isNumeric.js",
        "node_modules/rxjs/AsyncSubject.js",
        "node_modules/rxjs/observable/ScalarObservable.js",
        "node_modules/rxjs/observable/EmptyObservable.js",
        "node_modules/rxjs/util/isScheduler.js",
        "node_modules/rxjs/util/subscribeToResult.js",
        "node_modules/rxjs/OuterSubscriber.js",
        "node_modules/rxjs/scheduler/AsyncScheduler.js",
        "node_modules/rxjs/symbol/iterator.js",
        "node_modules/rxjs/InnerSubscriber.js",
        "node_modules/rxjs/scheduler/FutureAction.js",
        "node_modules/rxjs/scheduler/QueueScheduler.js",
        "node_modules/rxjs/util/isPromise.js",
        "node_modules/rxjs/scheduler/QueueAction.js",
        "node_modules/@angular/forms/bundles/forms.umd.js",
        "node_modules/ng2-translate/ng2-translate.js",
        "node_modules/rxjs/add/Observable/fromEventPattern.js",
        "node_modules/@angular/router/bundles/router.umd.js",
        "node_modules/ng2-translate/src/translate.pipe.js",
        "node_modules/ng2-translate/src/translate.service.js",
        "node_modules/ng2-translate/src/translate.parser.js",
        "node_modules/rxjs/add/operator/mergeMap.js",
        "node_modules/rxjs/add/operator/mergeAll.js",
        "node_modules/rxjs/add/operator/reduce.js",
        "node_modules/rxjs/add/operator/every.js",
        "node_modules/rxjs/add/operator/from.js",
        "node_modules/rxjs/add/operator/first.js",
        "node_modules/rxjs/add/operator/catch.js",
        "node_modules/rxjs/add/operator/concatAll.js",
        "node_modules/rxjs/add/operator/last.js",
        "node_modules/rxjs/add/operator/toPromise.js",
        "node_modules/rxjs/add/operator/share.js",
        "node_modules/rxjs/add/operator/merge.js",
        "node_modules/rxjs/add/operator/toArray.js",
        "node_modules/rxjs/operator/concatAll.js",
        "node_modules/rxjs/operator/every.js",
        "node_modules/rxjs/operator/first.js",
        "node_modules/rxjs/operator/catch.js",
        "node_modules/rxjs/operator/last.js",
        "node_modules/rxjs/operator/mergeAll.js",
        "node_modules/rxjs/operator/merge.js",
        "node_modules/rxjs/operator/share.js",
        "node_modules/rxjs/operator/reduce.js",
        "node_modules/rxjs/operator/toArray.js",
        "node_modules/rxjs/util/EmptyError.js",
        "node_modules/rxjs/observable/from.js",
        "node_modules/rxjs/observable/fromPromise.js",
        "node_modules/rxjs/BehaviorSubject.js",
        "node_modules/rxjs/observable/forkJoin.js",
        "node_modules/rxjs/observable/fromEventPattern.js",
        "node_modules/rxjs/operator/multicast.js",
        "node_modules/@angular/core/src/facade/lang.js",
        "node_modules/rxjs/observable/from.js",
        "node_modules/rxjs/observable/fromPromise.js",
        "node_modules/rxjs/BehaviorSubject.js",
        "node_modules/rxjs/observable/forkJoin.js",
        "observable/fromEventPattern.js",
        "node_modules/rxjs/operator/multicast.js",
        "node_modules/rxjs/observable/FromObservable.js",
        "node_modules/rxjs/observable/ForkJoinObservable.js",
        "node_modules/rxjs/observable/FromEventPatternObservable.js",
        "node_modules/rxjs/observable/ConnectableObservable.js",
        "node_modules/rxjs/observable/IteratorObservable.js",
        "node_modules/rxjs/observable/ArrayLikeObservable.js",
        "node_modules/rxjs/operator/observeOn.js",
        "node_modules/rxjs/Notification.js",

        "node_modules/rxjs/bundles/Rx.js",
        "node_modules/angular2/bundles/angular2.dev.js",
        "node_modules/angular2/bundles/router.dev.js"
];