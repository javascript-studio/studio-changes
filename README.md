# Changes

Generate changes as part of `npm version [patch|minor|major]`.

Nice and easy module releases. Make the release tool and process a part of
your module.

## Usage

- Use the [npm version feature][1] to create a release
- Your editor will open with a generated `CHANGES.md` file
- When you're done writing the release notes, save and close the editor to
  continue
- To abort the release, remove the line with the new version number

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

Configure your preferred editor with the `$EDITOR` environment variable.

![](https://javascript.studio/assets/changes-1.0.gif)

## License

MIT

<div align="center">Made with ❤️ on 🌍</div>

[1]: https://docs.npmjs.com/cli/version
