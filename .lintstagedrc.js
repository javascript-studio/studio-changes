'use strict';

const withRelatedTests = require('@studio/related-tests');

module.exports = {
  '*.js': ['eslint --fix', withRelatedTests('mocha')],
  '*.{js,json,md}': 'prettier --write'
};
