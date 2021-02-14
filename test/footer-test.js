'use strict';

const $ = require('child_process');
const { assert, sinon } = require('@sinonjs/referee-sinon');
const github = require('../lib/github');
const footer = require('../lib/footer');

function today() {
  return new Date().toISOString().split('T')[0];
}

describe('footer', () => {
  beforeEach(() => {
    delete process.env.GIT_AUTHOR_NAME;
    delete process.env.GIT_AUTHOR_EMAIL;
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.GIT_AUTHOR_NAME;
    delete process.env.GIT_AUTHOR_EMAIL;
  });

  it('generates footer without author', async () => {
    sinon.replace($, 'execSync', sinon.fake.throws(new Error()));

    const foot = await footer.generate();

    assert.equals(foot, `_Released on ${today()}._`);
  });

  it('generates footer with author from environment variable and without link', async () => {
    sinon.replace($, 'execSync', sinon.fake.throws(new Error()));
    process.env.GIT_AUTHOR_NAME = 'Maximilian Antoni';

    const foot = await footer.generate();

    assert.equals(foot, `_Released by Maximilian Antoni on ${today()}._`);
  });

  it('generates footer with author from git config and without link', async () => {
    sinon.replace(
      $,
      'execSync',
      sinon.fake((cmd) => {
        if (cmd === 'git config --get user.name') {
          return 'Maximilian Antoni\n';
        }
        throw new Error();
      })
    );

    const foot = await footer.generate();

    assert.calledTwice($.execSync);
    assert.calledWith($.execSync, 'git config --get user.name');
    assert.calledWith($.execSync, 'git config --get user.email');
    assert.equals(foot, `_Released by Maximilian Antoni on ${today()}._`);
  });

  it('generates footer with author from environment variable and github homepage link', async () => {
    sinon.replace(
      github,
      'fetchUserHomepage',
      sinon.fake.resolves('https://github.com/mantoni')
    );
    sinon.replace(
      $,
      'execSync',
      sinon.fake((cmd) => {
        if (cmd === 'git config --get user.name') {
          return 'Maximilian Antoni\n';
        }
        return 'mail@maxantoni.de\n';
      })
    );

    const foot = await footer.generate();

    assert.calledOnceWith(github.fetchUserHomepage, 'mail@maxantoni.de');
    assert.equals(
      foot,
      '_Released by [Maximilian Antoni](https://github.com/mantoni) on ' +
        `${today()}._`
    );
  });

  it('generates footer with author from git config and github homepage link', async () => {
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
