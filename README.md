# remark-lint-no-local-domain

Warn for local domains in URLs in links, images, and definitions.

## Presets

This rule is not included in any default preset

## Example

##### `ok.md`

###### In

```markdown
[alpha](/link).
[other link](http://example.com/mylink).

![charlie](/echo.png "foxtrot").

[bar]

[bar]: http://domain.com/more/text "Example Domain"
```

###### Out

No messages.

##### `not-ok.md`

###### In

```markdown
[alpha](http://domain.com/mylink).
[other link](http://example.com/mylink).

![charlie](http://domain.com/echo.png "foxtrot").

[bar]

[bar]: http://domain.com/more/text "Example Domain"
```

###### Out

```text
      1:1-1:34  warning  The link URL should only without host: '/mylink'                                       url-no-domain  remark-lint
      4:1-4:49  warning  The image URL should only without host: '/echo.png'                                    url-no-domain  remark-lint
      8:1-8:52  warning  The definition URL should only without host: '/more/text'                              url-no-domain  remark-lint
```

## Options

### `options.domain`

`domain := <RegExpString>`

The domain which should prohibited as a RegExp.

### `options.root`

`root := <undefined|true|false>`

With the following behavior:

     
| Option | Value | Description
|--------------------|-------------|----------|
| `OPTIONS.ROOT.ALL` | `undefined` | show all |
| `OPTIONS.ROOT.ONLY_ROOT` | `true` | use only root domains without a path |
| `OPTIONS.ROOT.NO_ROOT` | `false` use only root domains with a path |

### `options.linkified`

`linkified := <undefined|true|false>`

With the following behavior:

| Option | Value | Description
|--------------------|-------------|----------|
| `OPTIONS.LINKIFIED.ALL` |" `undefined` | show all |
| `OPTIONS.LINKIFIED.ONLY_LINKIFIED` | `true` check only linkified links |
| `OPTIONS.LINKIFIED.NO_LINKIFIED` | `false` check only not linkified links |

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
 const remark = require('remark')
 const report = require('vfile-reporter')

 remark()
   .use(require('remark-lint'))
+  .use(require('remark-lint-no-local-domain'), { domain: "mydomain.com" })
   .process('_Emphasis_ and **importance**', function (err, file) {
     console.error(report(err || file))
   })
```

You can use the predefined `OPTIONS` to avoid the boolean trap:
```diff
 const remark = require('remark')
 const report = require('vfile-reporter')
+const options = require("remark-lint-no-local-domain").OPTIONS

 remark()
   .use(require('remark-lint'))
+  .use(require('remark-lint-no-local-domain'), {
+       domain: "mydomain.com",
+       root: options.ROOT.NO_ROOT,
+       linkified: options.LINKIFIED.ALL
+  })
   .process('_Emphasis_ and **importance**', function (err, file) {
     console.error(report(err || file))
   })
```

