'use strict';

const fs = require('fs');
const $ = require('child_process');
const { assert, refute, match, sinon } = require('@sinonjs/referee-sinon');
const footer = require('../lib/footer');
const changes = require('..');

describe('changes', () => {
  beforeEach(() => {
    sinon.stub(fs, 'readFileSync');
    sinon.stub(fs, 'writeFileSync');
    sinon.stub($, 'execSync');
    sinon.stub(process, 'exit');
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  function packageJson(json) {
    fs.readFileSync.withArgs('package.json').returns(
      JSON.stringify(
        json || {
          name: '@studio/changes',
          version: '1.0.0',
          author: 'Studio <support@javascript.studio>',
          homepage: 'https://github.com/javascript-studio/studio-changes'
        }
      )
    );
  }

  function missingChanges() {
    fs.readFileSync.withArgs('CHANGES.md').throws(new Error());
  }

  function setChanges(str) {
    fs.readFileSync.withArgs('CHANGES.md').returns(str);
  }

  function setLog(log) {
    $.execSync.returns(log);
  }

  it('generates new changes file to default location', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (That Dude)\n\n\n');

    const state = await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception (That Dude)\n'
    );
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log  --format=');
    assert.equals(state.changes_file, 'CHANGES.md');
  });

  it('generates new changes file to custom location', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (That Dude)\n\n\n');

    const state = await changes.write({ changes_file: 'foo.txt' });

    assert.calledOnceWith(
      fs.writeFileSync,
      'foo.txt',
      '# Changes\n\n## 1.0.0\n\n- Inception (That Dude)\n'
    );
    assert.equals(state.changes_file, 'foo.txt');
  });

  it('removes package author', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n\n');

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n'
    );
  });

  async function verifyAuthorRemoval(author) {
    packageJson({ name: '@studio/changes', version: '1.0.0', author });
    missingChanges();
    setLog('» Inception (Studio)\n\n\n');

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n'
    );
  }

  it('removes package author (with homepage)', async () => {
    await verifyAuthorRemoval('Studio (https://javascript.studio)');
  });

  it('removes package author (without email or homepage)', async () => {
    await verifyAuthorRemoval('Studio');
  });

  it('removes package author (with email and homepage)', async () => {
    await verifyAuthorRemoval(
      'Studio <support@javascript.studio> (https://javascript.studio)'
    );
  });

  it('removes package author (with homepage and email)', async () => {
    await verifyAuthorRemoval(
      'Studio (https://javascript.studio) <support@javascript.studio>'
    );
  });

  it('removes package author (with object)', async () => {
    await verifyAuthorRemoval({
      name: 'Studio',
      email: 'support@javascript.studio'
    });
  });

  it('add commit log to existing changes file', async () => {
    packageJson();
    const initial = '# Changes\n\n## 0.1.0\n\nSome foo.\n';
    setChanges(initial);
    setLog('» Inception (Studio)\n\n\n');

    const state = await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n\n## 0.1.0\n\nSome foo.\n'
    );
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log v0.1.0..HEAD');
    assert.equals(state.previous, initial);
  });

  it('identifies previous commit with -beta suffix', async () => {
    packageJson();
    setChanges('# Changes\n\n## 0.1.0-beta\n\nSome foo.\n');
    setLog('» Inception (Studio)\n\n\n');

    await changes.write();

    assert.calledWithMatch($.execSync, 'git log v0.1.0-beta..HEAD');
  });

  it('adds `-- my-module` to git log command', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception\n\n\n');

    await changes.write({ dir: 'my-module' });

    assert.calledWith($.execSync, match(/ -- my-module$/));
  });

  it('adds body indented on new line', async () => {
    packageJson();
    missingChanges();
    setLog(
      '» Inception (Studio)\n\nFoo Bar Doo\n\n» Other (Dude)\n\n\n' +
        '» Third (Person)\n\nDoes\nstuff\n\n'
    );

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n' +
        '- Inception\n    >\n    > Foo Bar Doo\n    >\n' +
        '- Other (Dude)\n' +
        '- Third (Person)\n    >\n    > Does\n    > stuff\n    >\n'
    );
  });

  it('keeps body with two paragraphs together', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\nFoo\n\nBar\n\n');

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n' +
        '    >\n    > Foo\n    >\n    > Bar\n    >\n'
    );
  });

  it('keeps body with three paragraphs together', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\nFoo\n\nBar\n\nDoo\n\n');

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n' +
        '    >\n    > Foo\n    >\n    > Bar\n    >\n    > Doo\n    >\n'
    );
  });

  it('properly indents lists', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n- Foo\n- Bar\n- Doo\n\n');

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n' +
        '    >\n    > - Foo\n    > - Bar\n    > - Doo\n    >\n'
    );
  });

  it('properly indents list with multiline entry', async () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n- Foo\n  next line\n- Bar\n\n');

    await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n' +
        '    >\n    > - Foo\n    >   next line\n    > - Bar\n    >\n'
    );
  });

  it('fails if changes file has not the right format', async () => {
    packageJson();
    setChanges('# Something else\n\n## 1.0.0\n\nFoo');

    await changes.write();

    assert.calledOnceWith(console.error, 'Unexpected CHANGES.md file header');
    assert.calledOnceWith(process.exit, 1);
  });

  it('fails if version is already in changes file', async () => {
    packageJson();
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');
    setLog('foo');

    await changes.write();

    assert.calledWith(
      console.error,
      'Version 1.0.0 is already in CHANGES.md\n'
    );
    assert.calledOnceWith(process.exit, 1);
  });

  it('shows outstanding changes if version is already in changes file', async () => {
    packageJson();
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');
    setLog('» Up next (Studio)\n\n\n');

    await changes.write();

    assert.calledWith(console.error, '# Changes for next release:\n');
    assert.calledWith(console.error, '- Up next\n');
  });

  it('does not show outstanding changes if no new commits where found', async () => {
    packageJson();
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');
    setLog('');

    await changes.write();

    assert.calledWith(
      console.error,
      'Version 1.0.0 is already in CHANGES.md\n'
    );
    refute.calledWith(console.error, '# Changes for next release:\n');
  });

  it('works if changes file was checked out with CRLF', async () => {
    packageJson();
    const initial = '# Changes\r\n\r\n## 0.0.1\r\n\r\n- Inception\r\n';
    setChanges(initial);
    setLog('» JavaScript (Studio)\n\nWhat else?\n\n\n');

    const state = await changes.write();

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\r\n\r\n' +
        '## 1.0.0\r\n\r\n- JavaScript\r\n    >\r\n    > What else?\r\n\r\n' +
        '## 0.0.1\r\n\r\n- Inception\r\n'
    );
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log v0.0.1..HEAD');
    assert.equals(state.previous, initial);
  });

  it('fails if version is already in changes file with CRLF', async () => {
    packageJson();
    setChanges('# Changes\r\n\r\n## 1.0.0\r\n\r\nFoo');
    setLog('foo');

    await changes.write();

    assert.calledWith(
      console.error,
      'Version 1.0.0 is already in CHANGES.md\n'
    );
    assert.calledOnceWith(process.exit, 1);
  });

  it('should support custom tag formats when updating a file', async () => {
    packageJson();
    const initial = '# Changes\n\n## 0.1.0\n\nSome foo.\n';
    setChanges(initial);
    setLog('» Inception (Studio)\n\n\n');

    const state = await changes.write({
      tag_format: '${name}@${version}'
    });

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n\n## 0.1.0\n\nSome foo.\n'
    );
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log @studio/changes@0.1.0..HEAD');
    assert.equals(state.previous, initial);
  });

  it('adds commits with specified base', async () => {
    packageJson();
    missingChanges();
    setLog(
      '» [`cbac1d0`](https://javascript.studio/commit/' +
        'cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)«  Message (Author)\n\n\n'
    );

    await changes.write({
      commits: 'https://javascript.studio/commit'
    });

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n' +
        '- [`cbac1d0`](https://javascript.studio/commit/' +
        'cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)\n  Message (Author)\n'
    );
    assert.calledWithMatch(
      $.execSync,
      'git log  --format="» [\\`%h\\`](https://javascript.studio/commit/%H)' +
        '«  %s'
    );
  });

  it('adds commits with base from package.json homepage + /commit', async () => {
    packageJson();
    missingChanges();
    setLog(
      '» [`cbac1d0`](https://github.com/javascript-studio/studio-changes/' +
        'commit/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)«' +
        '  Message (Author)\n\n\n'
    );

    await changes.write({
      commits: true
    });

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n' +
        '- [`cbac1d0`](https://github.com/javascript-studio/studio-changes/' +
        'commit/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)\n' +
        '  Message (Author)\n'
    );
    assert.calledWithMatch(
      $.execSync,
      'git log  --format="» [\\`%h\\`](https://github.com/javascript-studio/' +
        'studio-changes/commit/%H)«  %s'
    );
  });

  it('resolves base from package.json "repository" field', async () => {
    packageJson({
      name: '@studio/changes',
      version: '1.0.0',
      repository: {
        type: 'git',
        url: 'https://github.com/javascript-studio/studio-changes.git'
      }
    });
    missingChanges();
    setLog('» Test');

    await changes.write({
      commits: true
    });

    assert.calledWithMatch(
      $.execSync,
      'git log  --format="» [\\`%h\\`](https://github.com/javascript-studio/' +
        'studio-changes/commit/%H)«  %s'
    );
  });

  it(`ignores package.json "repository" field and uses "homepage" instead if not
      type "git"`, async () => {
    packageJson({
      name: '@studio/changes',
      version: '1.0.0',
      repository: {
        type: 'foo',
        url: 'https://github.com/mantoni/eslint_d.js.git'
      },
      homepage: 'https://github.com/javascript-studio/studio-changes'
    });
    missingChanges();
    setLog('» Test');

    await changes.write({
      commits: true
    });

    assert.calledWithMatch(
      $.execSync,
      'git log  --format="» [\\`%h\\`](https://github.com/javascript-studio/' +
        'studio-changes/commit/%H)«  %s'
    );
  });

  it('fails if repository info cannot be parsed', async () => {
    packageJson({
      name: '@studio/changes',
      version: '1.0.0',
      repository: {
        type: 'git',
        url: 'https://foo.com/mantoni/eslint_d.js.git'
      }
    });
    missingChanges();
    setLog('» Test');

    await changes.write({
      commits: true
    });

    assert.calledWith(
      console.error,
      'Failed to parse "repository" from package.json\n'
    );
    assert.calledOnceWith(process.exit, 1);
  });

  it(`fails if --commits but missing "repository" and "homepage" in
      package.json`, async () => {
    packageJson({
      name: '@studio/changes',
      version: '1.0.0'
    });

    await changes.write({
      commits: true
    });

    assert.calledWith(
      console.error,
      '--commits option requires base URL, ' +
        '"repository" or "homepage" in package.json\n'
    );
    assert.calledOnceWith(process.exit, 1);
  });

  it('adds commits using base URL template', async () => {
    packageJson();
    missingChanges();
    setLog(
      '» [`cbac1d0`](https://github.com/javascript-studio/studio-changes/' +
        'foo/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)«' +
        '  Message (Author)\n\n\n'
    );

    await changes.write({
      commits: '${homepage}/foo'
    });

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n' +
        '- [`cbac1d0`](https://github.com/javascript-studio/studio-changes/' +
        'foo/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)\n' +
        '  Message (Author)\n'
    );
    assert.calledWithMatch(
      $.execSync,
      'git log  --format="» [\\`%h\\`](https://github.com/javascript-studio/' +
        'studio-changes/foo/%H)«  %s'
    );
  });

  it('generates footer', async () => {
    sinon.replace(footer, 'generate', sinon.fake.resolves('**The footer**'));
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n\n');

    await changes.write({ footer: true });

    assert.calledOnceWith(
      fs.writeFileSync,
      'CHANGES.md',
      `# Changes\n\n## 1.0.0\n\n- Inception\n\n**The footer**\n`
    );
  });
});
