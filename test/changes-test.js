/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const $ = require('child_process');
const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
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
    fs.readFileSync.withArgs('package.json').returns(JSON.stringify(json || {
      name: '@studio/changes',
      version: '1.0.0',
      author: 'Studio <support@javascript.studio>',
      homepage: 'https://github.com/javascript-studio/studio-changes'
    }));
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

  it('generates new changes file to default location', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (That Dude)\n\n\n');

    const state = changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception (That Dude)\n');
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log  --format=');
    assert.equals(state.changes_file, 'CHANGES.md');
  });

  it('generates new changes file to custom location', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (That Dude)\n\n\n');

    const state = changes.write({ changes_file: 'foo.txt' });

    assert.calledOnceWith(fs.writeFileSync, 'foo.txt',
      '# Changes\n\n## 1.0.0\n\n- Inception (That Dude)\n');
    assert.equals(state.changes_file, 'foo.txt');
  });

  it('removes package author', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n');
  });

  it('add commit log to existing changes file', () => {
    packageJson();
    const initial = '# Changes\n\n## 0.1.0\n\nSome foo.\n';
    setChanges(initial);
    setLog('» Inception (Studio)\n\n\n');

    const state = changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n\n## 0.1.0\n\nSome foo.\n');
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log v0.1.0..HEAD');
    assert.equals(state.previous, initial);
  });

  it('identifies previous commit with -beta suffix', () => {
    packageJson();
    setChanges('# Changes\n\n## 0.1.0-beta\n\nSome foo.\n');
    setLog('» Inception (Studio)\n\n\n');

    changes.write();

    assert.calledWithMatch($.execSync, 'git log v0.1.0-beta..HEAD');
  });

  it('adds body indented on new line', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\nFoo Bar Doo\n\n» Other (Dude)\n\n\n'
      + '» Third (Person)\n\nDoes\nstuff\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n'
      + '- Inception\n    >\n    > Foo Bar Doo\n    >\n'
      + '- Other (Dude)\n'
      + '- Third (Person)\n    >\n    > Does\n    > stuff\n    >\n');
  });

  it('keeps body with two paragraphs together', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\nFoo\n\nBar\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n'
      + '    >\n    > Foo\n    >\n    > Bar\n    >\n');
  });

  it('keeps body with three paragraphs together', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\nFoo\n\nBar\n\nDoo\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n'
      + '    >\n    > Foo\n    >\n    > Bar\n    >\n    > Doo\n    >\n');
  });

  it('properly indents lists', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n- Foo\n- Bar\n- Doo\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n'
      + '    >\n    > - Foo\n    > - Bar\n    > - Doo\n    >\n');
  });

  it('properly indents list with multiline entry', () => {
    packageJson();
    missingChanges();
    setLog('» Inception (Studio)\n\n- Foo\n  next line\n- Bar\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n'
      + '    >\n    > - Foo\n    >   next line\n    > - Bar\n    >\n');
  });

  it('fails if changes file has not the right format', () => {
    packageJson();
    setChanges('# Something else\n\n## 1.0.0\n\nFoo');

    changes.write();

    assert.calledOnceWith(console.error, 'Unexpected CHANGES.md file header');
    assert.calledOnceWith(process.exit, 1);
  });

  it('fails if version is already in changes file', () => {
    packageJson();
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');
    setLog('foo');

    changes.write();

    assert.calledWith(console.error,
      'Version 1.0.0 is already in CHANGES.md\n');
    assert.calledOnceWith(process.exit, 1);
  });

  it('shows outstanding changes if version is already in changes file', () => {
    packageJson();
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');
    setLog('» Up next (Studio)\n\n\n');

    changes.write();

    assert.calledWith(console.error, '# Changes for next release:\n');
    assert.calledWith(console.error, '- Up next\n');
  });

  it('does not show outstanding changes if no new commits where found', () => {
    packageJson();
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');
    setLog('');

    changes.write();

    assert.calledWith(console.error,
      'Version 1.0.0 is already in CHANGES.md\n');
    refute.calledWith(console.error, '# Changes for next release:\n');
  });

  it('works if changes file was checked out with CRLF', () => {
    packageJson();
    const initial = '# Changes\r\n\r\n## 0.0.1\r\n\r\n- Inception\r\n';
    setChanges(initial);
    setLog('» JavaScript (Studio)\n\nWhat else?\n\n\n');

    const state = changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md', '# Changes\r\n\r\n'
      + '## 1.0.0\r\n\r\n- JavaScript\r\n    >\r\n    > What else?\r\n\r\n'
      + '## 0.0.1\r\n\r\n- Inception\r\n');
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync, 'git log v0.0.1..HEAD');
    assert.equals(state.previous, initial);
  });

  it('fails if version is already in changes file with CRLF', () => {
    packageJson();
    setChanges('# Changes\r\n\r\n## 1.0.0\r\n\r\nFoo');
    setLog('foo');

    changes.write();

    assert.calledWith(console.error,
      'Version 1.0.0 is already in CHANGES.md\n');
    assert.calledOnceWith(process.exit, 1);
  });

  it('should support custom tag formats when updating a file', () => {
    packageJson();
    const initial = '# Changes\n\n## 0.1.0\n\nSome foo.\n';
    setChanges(initial);
    setLog('» Inception (Studio)\n\n\n');

    const state = changes.write({
      tag_format: '${name}@${version}'
    });

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n\n## 0.1.0\n\nSome foo.\n');
    assert.calledOnce($.execSync);
    assert.calledWithMatch($.execSync,
      'git log @studio/changes@0.1.0..HEAD');
    assert.equals(state.previous, initial);
  });

  it('works with "author" object', () => {
    packageJson({
      name: '@studio/changes',
      version: '1.0.0',
      author: {
        name: 'Studio',
        email: 'support@javascript.studio'
      }
    });
    missingChanges();
    setLog('» Inception (Studio)\n\n\n');

    changes.write();

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n');
  });

  it('adds commits with specified base', () => {
    packageJson();
    missingChanges();
    setLog('» [`cbac1d0`](https://javascript.studio/commit/'
      + 'cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)«  Message (Author)\n\n\n');

    changes.write({
      commits: 'https://javascript.studio/commit'
    });

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n'
      + '- [`cbac1d0`](https://javascript.studio/commit/'
      + 'cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)\n  Message (Author)\n');
    assert.calledWithMatch($.execSync,
      'git log  --format="» [\\`%h\\`](https://javascript.studio/commit/%H)'
      + '«  %s');
  });

  it('adds commits with base from package.json homepage + /commit', () => {
    packageJson();
    missingChanges();
    setLog('» [`cbac1d0`](https://github.com/javascript-studio/studio-changes/'
      + 'commit/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)«'
      + '  Message (Author)\n\n\n');

    changes.write({
      commits: true
    });

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n'
      + '- [`cbac1d0`](https://github.com/javascript-studio/studio-changes/'
      + 'commit/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)\n'
      + '  Message (Author)\n');
    assert.calledWithMatch($.execSync,
      'git log  --format="» [\\`%h\\`](https://github.com/javascript-studio/'
      + 'studio-changes/commit/%H)«  %s');
  });

  it('fails if --commits but missing "homepage" in package.json', () => {
    packageJson({
      name: '@studio/changes',
      version: '1.0.0'
    });

    changes.write({
      commits: true
    });

    assert.calledWith(console.error,
      '--commits option requires base URL or "homepage" in package.json\n');
    assert.calledOnceWith(process.exit, 1);
  });

  it('adds commits using base URL template', () => {
    packageJson();
    missingChanges();
    setLog('» [`cbac1d0`](https://github.com/javascript-studio/studio-changes/'
      + 'foo/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)«'
      + '  Message (Author)\n\n\n');

    changes.write({
      commits: '${homepage}/foo'
    });

    assert.calledOnceWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n'
      + '- [`cbac1d0`](https://github.com/javascript-studio/studio-changes/'
      + 'foo/cbac1d01d3e7c5d9ab1cf7cd9efee4cfc2988a85)\n'
      + '  Message (Author)\n');
    assert.calledWithMatch($.execSync,
      'git log  --format="» [\\`%h\\`](https://github.com/javascript-studio/'
      + 'studio-changes/foo/%H)«  %s');
  });

});
