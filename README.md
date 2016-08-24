# JavaScript Studio Changes

Generate changes as part of `npm version [patch|minor|major]`.

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
  }
}
```

## Usage

- Use the [npm version feature][1] as usual
- You editor will open with a generated `CHANGES.md` file
- Save and close the editor to continue
- Remove the line with the next version number to abort

[1]: https://docs.npmjs.com/cli/version
