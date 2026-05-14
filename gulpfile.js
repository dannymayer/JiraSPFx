'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(/^Warning - \[sass\]/gi);

build.initialize(require('gulp'));
