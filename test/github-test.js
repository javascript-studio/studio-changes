/*eslint-env mocha*/
'use strict';

const https = require('https');
const EventEmitter = require('events');
const { assert, sinon } = require('@sinonjs/referee-sinon');
const github = require('../lib/github');

describe('github', () => {
  let clock;
  let request;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    request = new EventEmitter();
    request.end = sinon.fake();
    request.abort = sinon.fake();
    sinon.replace(https, 'request', sinon.fake.returns(request));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('searches user for given email', () => {
    const callback = sinon.fake();

    github.fetchUserHomepage('mail@maxantoni.de', callback);

    assert.calledOnceWith(https.request, {
      hostname: 'api.github.com',
      path: '/search/users?q=mail%40maxantoni.de&in=email',
      headers: { 'User-Agent': '@studio/changes' }
    });
  });

  it('yields error on timeout', () => {
    const callback = sinon.fake();

    github.fetchUserHomepage('mail@maxantoni.de', callback);
    clock.tick(5000);

    assert.calledOnce(request.abort);
    assert.calledOnce(callback);
    assert.calledWithMatch(callback, {
      code: 'E_TIMEOUT'
    });
  });

  function respond(json) {
    const response = new EventEmitter();
    response.setEncoding = () => {};
    response.headers = { 'content-type': 'application/json' };
    response.statusCode = 200;
    https.request.callback(response);
    response.emit('data', JSON.stringify(json));
    response.emit('end');
  }

  it('yields (null, null) if no results', () => {
    const callback = sinon.fake();

    github.fetchUserHomepage('mail@maxantoni.de', callback);
    respond({ items: [] });

    assert.calledOnce(callback);
    assert.calledWithMatch(callback, null, null);
  });

  it('yields (null, null) if more than one result', () => {
    const callback = sinon.fake();

    github.fetchUserHomepage('mail@maxantoni.de', callback);
    respond({ items: [{}, {}] });

    assert.calledOnce(callback);
    assert.calledWithMatch(callback, null, null);
  });

  it('yields (null, homepage) if exactly one result', () => {
    const html_url = 'https://github.com/mantoni';
    const callback = sinon.fake();

    github.fetchUserHomepage('mail@maxantoni.de', callback);
    respond({ items: [{ html_url }] });

    assert.calledOnce(callback);
    assert.calledWithMatch(callback, null, html_url);
  });
});
