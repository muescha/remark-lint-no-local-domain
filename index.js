/**
 * @author Michael Nietzold
 */

"use strict"
const { convertObject } = require("./utils") //.convertObject

const debug = require("debug")("remark-lint-no-local-domain")
const unified = require("unified")
const source = require("unist-util-source")
const rule = require("unified-lint-rule")
const visit = require("unist-util-visit")
const generated = require("unist-util-generated")
const stringify = require("remark-stringify")
const inspect = require("unist-util-inspect")
const chalk = require("chalk")

module.exports = rule("remark-lint:url-no-domain", noLocalDomain)

const OPTIONS = {
  ROOT: {
    ALL: undefined,
    ONLY_ROOT: true,
    NO_ROOT: false,
  },
  LINKIFIED: {
    ALL: undefined,
    ONLY_LINKIFIED: true,
    NO_LINKIFIED: false,
  }
}

const OPTIONS_INFO = convertObject(OPTIONS)

module.exports.OPTIONS = OPTIONS

function noLocalDomain(tree, file, options) {

  options = options || {}

  const debugCheck = debug.extend("check")
  const debugInfos = debug.extend("infos")

  // domains := string | string[]
  // maybe allow also as RegExp https://github.com/zslabs/remark-relative-links/pull/4/files
  let domain = options.domain

  domain = Array.isArray(domain) ? domain : [domain];

  const domains = domain.map( d => d.replace(".","\\.")).join("|")
  const domTest = new RegExp(`^http[s]?://(www\\.)?(${domains})[/]?`, 'i')

  //frontmatter fields ignored
  // /blog/2020-07-07-wordpress-source-beta/index.mdx
  // image: ./Gatsby-image.png

  debugCheck("")
  debugCheck(file.path)

  visit(tree, ["link", "image", "definition"], visitor)

  function visitor(node) {

    debugCheck("   check " + node.type.padEnd(10) + ": " + source(node, file))

    if (!generated(node) && node.url && domTest.test(node.url)) {
      debugInfos(chalk.red("   ----> " + node.type.padEnd(10) + ": " + source(node, file)))

      // exact position of domain text makes no sense because
      // in terminal it is auto-linkified
      //
      // let position = {
      //     start: node.children[0].position.start,
      //     end: node.children[0].position.end
      // }
      // let autoLink = node.position === node.children[0].position

      let isAutoLink = node.type === "link" && isLinkified(node)

      const domain = domTest.exec(node.url)[0]
      const newPath = node.url.replace(domTest, "/")
      const isRoot = newPath === "/"

      // root = <undefined|true|false>
      // - OPTIONS.ROOT.ALL undefined = show all
      // - OPTIONS.ROOT.ONLY_ROOT true = use only root domains without a path
      // - OPTIONS.ROOT.NO_ROOT false = use only domains with a path
      if ((options.root !== undefined) && (isRoot !== options.root)) {
        const info = OPTIONS_INFO.ROOT[options.root]
        debugInfos(chalk.yellow("   ----> " + node.type.padEnd(10) + ": " + `options.root: ${info} -> ignored: ${newPath}`))
        return
      }
      // linkified = <undefined|true|false>
      // - OPTIONS.LINKIFIED.ALL: undefined = check all
      // - OPTIONS.LINKIFIED.ONLY_LINKIFIED: true = check only linkified links
      // - OPTIONS.LINKIFIED.NO_LINKIFIED false = check only not linkified links
      if ((options.linkified !== undefined) && (isAutoLink !== options.linkified)) {
        const info = OPTIONS_INFO.LINKIFIED[options.linkified]
        debugInfos(chalk.yellow("   ----> " + node.type.padEnd(10) + ": " + `options.linkified: ${info} -> ignore linkified: ${source(node, file)}`))
        return
      }
      let message = file.message(`The ${node.type} URL should only without host: '${newPath}'`, node)
      let newNode = node
      const currentSourceCode = source(node, file)

      newNode.url = newPath
      const newText = unified().use(stringify).stringify(newNode)
      debugInfos(chalk.green("   ----> " + node.type.padEnd(10) + ": " + newText))

      let patchPosition = node.position
      message.fix = {
        range: [
          patchPosition.start.offset,
          patchPosition.end.offset
        ],
        text: newText,
        old: currentSourceCode
      }

      message.data = {
        domain: domain,
        patches: [{
          type: "text",
          position: patchPosition,
          from: currentSourceCode,
          to: newText
        }]
      }

      // add suggestions for
      // - LinkText
      // - LinkUrl
    }
  }
}

// TODO: better check
//   maybe if unist-util-source is equal the link?
//   not works because domain.com gets [domain.com](https://domain.com)
//   i have to do more magic
//   or if stringify is not equal original source code
// function isLinkified2(node, file){
//
//   return node.url === source(node, file)
// }
// unist-util-stringify-position changes undefined values to `1:1`

// function isLinkified2(node) {
//   const child = node.children && node.children[0]
//   return JSON.stringify(node.position) === JSON.stringify(child.position)
// }

// Linkified if the first child node has the same position as the parent node
function isLinkified(node) {
  const child = node.children && node.children[0]
  if (!child) {
    return true
  }
  if (generated(child)) {
    return true
  }
  let parentStart = node.position.start.offset
  let parentEnd = node.position.end.offset
  let childStart = child.position.start.offset
  let childEnd = child.position.end.offset
  return parentStart === childStart && parentEnd === childEnd
}
