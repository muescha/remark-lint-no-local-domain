# remark-lint-no-local-domain

Warn for local domains in URLs in links, images, and definitions.

## Presets

This rule is not included in any default preset

## Example

##### `ok.md`

###### In

```markdown
[alpha](/link).

![charlie](/echo.png "foxtrot").
```

###### Out

No messages.

##### `not-ok.md`

###### In

```markdown
[alpha](http://domain.com).

![charlie](http://domain.com/echo.png "foxtrot").
```

###### Out

```text
1:1-1:9: Don’t use links without URL
3:1-3:11: Don’t use images without URL
```

## Install

[npm][https://docs.npmjs.com/cli/install]:

```shell
npm install remark-lint-no-local-domain
```

## Use

You probably want to use it on the CLI through a config file:

```diff
 …
 "remarkConfig": {
   "plugins": [
     …
     "lint",
+     ["remark-lint-no-local-domain", { domain: "mydomain.com" }],
     …
   ]
 }
 …
```

Or use it on the CLI directly

```shell
remark -u lint -u lint-url-no-domain=??? readme.md
```

Or use this on the API:

```diff
 var remark = require('remark')
 var report = require('vfile-reporter')

 remark()
   .use(require('remark-lint'))
+  .use(require('remark-lint-no-local-domain'), { domain: "mydomain.com" })
   .process('_Emphasis_ and **importance**', function (err, file) {
     console.error(report(err || file))
   })
```
