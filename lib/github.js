/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const { promisify } = require('util');
const request = promisify(require('@studio/json-request'));

exports.fetchUserHomepage = async function (email) {
  const json = await request({
    hostname: 'api.github.com',
    path: `/search/users?q=${encodeURIComponent(email)}&in=email`,
    headers: {
      'User-Agent': '@studio/changes'
    },
    timeout: 5000
  });

  if (json.items && json.items.length === 1) {
    return json.items[0].html_url;
  }
  return null;
};
