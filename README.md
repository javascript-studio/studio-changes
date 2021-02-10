<h1 align="center">
  Studio Changes
</h1>
<p align="center">
  📦 Generate a changelog as part of the <a href="https://docs.npmjs.com/cli/version">npm version command</a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@studio/changes">
    <img src="https://img.shields.io/npm/v/@studio/changes.svg" alt="npm Version">
  </a>
  <a href="https://semver.org">
    <img src="https://img.shields.io/:semver-%E2%9C%93-blue.svg" alt="SemVer">
  </a>
  <a href="https://github.com/mantoni/eslint_d.js/actions">
    <img src="https://github.com/mantoni/eslint_d.js/workflows/Build/badge.svg" alt="Build Status">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-brightgreen.svg" alt="License">
  </a>
</p>

## Usage

- Use `npm version [patch|minor|major]` to create a release
- Your editor will open with a generated `CHANGES.md` file
- When you're done writing the release notes, save and close the editor to
  continue
- To abort the release, remove the heading with the new version number

## Install

```bash
❯ npm install @studio/changes --save-dev
```

## Configure

```bash
❯ npx changes --init
```

This will add the following to your `package.json`:

```json
{
  "scripts": {
    "preversion": "npm test",
    "version": "changes",
    "postversion": "git push --follow-tags && npm publish"
  }
}
```

## Options

- `--help`, `-h`: Display a help message.
- `--commits`, `-c`: Generate links to commits using the given URL as base. If
  no URL is given it defaults to `${homepage}/commit` using the homepage
  configured in the `package.json`.
- `--footer`: Generate a footer with the git author and release date. The
  author name is taken from `$GIT_AUTHOR_NAME` and `$GIT_AUTHOR_EMAIL` is used
  to find the authors GitHub profile page.
- `--file`, `-f`: Specify the name of the changelog file. Defaults to
  `CHANGES.md`.
- `--init`: Add version lifecycle scripts to `package.json`. Can be combined
  with `--file` and `--commits` to configure the `changes` invocation.
- `--tag`: Use a custom git tag, supports simple replacement of `package.json`
  fields. Defaults to `v${version}`.

Configure your preferred editor with the `$EDITOR` environment variable.

## Preview next release

Preview the release notes for the next release by running:

```bash
❯ npx changes
```

![](https://javascript.studio/assets/changes-1.0.gif)

## License

MIT

<p align="center">Made with ❤️ on 🌍<p>

[1]: https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b
