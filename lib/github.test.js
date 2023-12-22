'use strict';

const https = require('https');
const EventEmitter = require('events');
const { assert, sinon, match } = require('@sinonjs/referee-sinon');
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
    github.fetchUserHomepage('mail@maxantoni.de');

    assert.calledOnceWith(https.request, {
      hostname: 'api.github.com',
      path: '/search/users?q=mail%40maxantoni.de&in=email',
      headers: { 'User-Agent': '@studio/changes' }
    });
  });

  it('yields error on timeout', async () => {
    const promise = github.fetchUserHomepage('mail@maxantoni.de');
    clock.tick(5000);

    assert.calledOnce(request.abort);
    await assert.rejects(
      promise,
      match({
        code: 'E_TIMEOUT'
      })
    );
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

  it('resolves to null if no results', async () => {
    const promise = github.fetchUserHomepage('mail@maxantoni.de');
    respond({ items: [] });

    await assert.resolves(promise, null);
  });

  it('resolves to null if more than one result', async () => {
    const promise = github.fetchUserHomepage('mail@maxantoni.de');
    respond({ items: [{}, {}] });

    await assert.resolves(promise, null);
  });

  it('resolves to homepage if exactly one result', async () => {
    const html_url = 'https://github.com/mantoni';

    const promise = github.fetchUserHomepage('mail@maxantoni.de');
    respond({ items: [{ html_url }] });

    await assert.resolves(promise, html_url);
  });
});
