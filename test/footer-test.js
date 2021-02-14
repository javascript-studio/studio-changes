'use strict';

const { assert, sinon } = require('@sinonjs/referee-sinon');
const github = require('../lib/github');
const footer = require('../lib/footer');

function today() {
  return new Date().toISOString().split('T')[0];
}

describe('footer', () => {
  before(() => {
    delete process.env.GIT_AUTHOR_NAME;
    delete process.env.GIT_AUTHOR_EMAIL;
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.GIT_AUTHOR_NAME;
    delete process.env.GIT_AUTHOR_EMAIL;
  });

  it('generates footer without author', async () => {
    const foot = await footer.generate();

    assert.equals(foot, `_Released on ${today()}._`);
  });

  it('generates footer with author author without link', async () => {
    process.env.GIT_AUTHOR_NAME = 'Maximilian Antoni';

    const foot = await footer.generate();

    assert.equals(foot, `_Released by Maximilian Antoni on ${today()}._`);
  });

  it('generates footer with author author with github homepage link', async () => {
    sinon.replace(
      github,
      'fetchUserHomepage',
      sinon.fake.resolves('https://github.com/mantoni')
    );
    process.env.GIT_AUTHOR_NAME = 'Maximilian Antoni';
    process.env.GIT_AUTHOR_EMAIL = 'mail@maxantoni.de';

    const foot = await footer.generate();

    assert.calledOnceWith(github.fetchUserHomepage, 'mail@maxantoni.de');
    assert.equals(
      foot,
      '_Released by [Maximilian Antoni](https://github.com/mantoni) on ' +
        `${today()}._`
    );
  });

  it('fails if github homepage link can not be retrieved', async () => {
    const error = new Error('Oh noes!');
    sinon.replace(github, 'fetchUserHomepage', sinon.fake.rejects(error));
    process.env.GIT_AUTHOR_NAME = 'Maximilian Antoni';
    process.env.GIT_AUTHOR_EMAIL = 'mail@maxantoni.de';

    const promise = footer.generate();

    await assert.rejects(promise, error);
  });
});
