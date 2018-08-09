# Studio Changes

📦 Generate a changelog as part of the [npm version command][1].

## Usage

- Use `npm version [patch|minor|major]` to create a release
- Your editor will open with a generated `CHANGES.md` file
- When you're done writing the release notes, save and close the editor to
  continue
- To abort the release, remove the heading with the new version number

## Install

```bash
$ npm install @studio/changes --save-dev
```

## Configure

Add this to your `package.json`:

```json
{
  "scripts": {
    "preversion": "npm test",
    "version": "changes",
    "postversion": "git push --follow-tags && npm publish"
  },
  "devDependencies": {
    "@studio/changes": "^1.0.0"
  }
}
```

The scripts can also be added with `changes --init`, if they do not exist yet:

```bash
$ node_modules/.bin/changes --init
```

Or with [npx][2]:

```bash
$ npx changes --init
```

If the "version" script already exists, this has no effect. Existing file
indentation style will be preserved.

## Options

- `--help`, `-h`: Display a help message.
- `--commits`, `-c`: Generate links to commits using the given URL as base. If
  no URL is given it defaults to `${homepage}/commit` using the homepage
  configured in the `package.json`.
- `--file`, `-f`: Specify the name of the changelog file. Defaults to
  `CHANGES.md`.
- `--init`: Add version lifecycle scripts to `package.json`. Can be combined
  with `--file` and `--commits` to configure the `changes` invocation.
- `--tag`: Use a custom git tag, supports simple replacement of `package.json`
  fields. Defaults to `v${version}`.

Configure your preferred editor with the `$EDITOR` environment variable.

## Preview changes for next release

If the current version in your `package.json` is already in the changelog, the
`changes` command aborts and shows the unreleased commits. Preview the release
notes for the next release like this:

```bash
$ node_modules/.bin/changes
```

Or with `npx`:

```bash
$ npx changes
```

![](https://javascript.studio/assets/changes-1.0.gif)

## License

MIT

<div align="center">Made with ❤️ on 🌍</div>

[1]: https://docs.npmjs.com/cli/version
[2]: https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b
