/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const request = require('@studio/json-request');

exports.fetchUserHomepage = function (email, callback) {
  request(
    {
      hostname: 'api.github.com',
      path: `/search/users?q=${encodeURIComponent(email)}&in=email`,
      headers: {
        'User-Agent': '@studio/changes'
      },
      timeout: 5000
    },
    (err, json) => {
      if (err) {
        callback(err, json);
        return;
      }
      if (json.items && json.items.length === 1) {
        callback(null, json.items[0].html_url);
      } else {
        callback(null, null);
      }
    }
  );
};
