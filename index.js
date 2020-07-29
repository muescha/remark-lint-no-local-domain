/**
 * @author Michael Nietzold
 */

"use strict"
var debug = require("debug")("remark-lint-no-local-domain")
var unified = require("unified")
var source = require("unist-util-source")
var rule = require("unified-lint-rule")
var visit = require("unist-util-visit")
var generated = require("unist-util-generated")
var stringify = require("remark-stringify")
var inspect = require("unist-util-inspect")
var chalk = require("chalk")

module.exports = rule("remark-lint:url-no-domain", noLocalDomain)

function noLocalDomain(tree, file, options) {

  options = options || {}

  var debugCheck = debug.extend("check")
  var debugInfos = debug.extend("infos")

  // let domTest = /^http[s]*:\/\/[www.]*(gatsbyjs\.org|agilitycms\.com)[/]?/
  let domTest = /^http[s]*:\/\/[www.]*gatsbyjs\.org[/]?/i

  //fronmatter fields
  // /blog/2020-07-07-wordpress-source-beta/index.mdx
  // image: ./Gatsby-Wapuus.png

  debugCheck("")
  debugCheck(file.path)

  visit(tree, ["link", "image", "definition"], visitor)

  function visitor(node) {

    debugCheck("   check " + node.type.padEnd(10) + ": " + source(node, file))

    if (!generated(node) && node.url && domTest.test(node.url)) {
      debugInfos(chalk.red("   ----> " + node.type.padEnd(10) + ": " + source(node, file)))

      // exact position of domain text makes no sense because of
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
      // - undefined = show all
      // - true = use only root domains without a path
      // - false = use only root domains with a path
      if ((options.root !== undefined) && (isRoot !== options.root)) {
        debugInfos(chalk.grey("   ----> " + node.type.padEnd(10) + ": " + `LocalLinks: ${options.root} -> ignored: ${newPath}`))
        return
      }
      // linkified = <undefined|true|false>
      // - undefined = check all
      // - true = check only linkified links
      // - false = check only not linkified links
      if ((options.linkified !== undefined) && (isAutoLink !== options.linkified)) {
        debugInfos(chalk.grey("   ----> " + node.type.padEnd(10) + ": " + `linified: ${options.linkified} -> ignore linified: ${source(node, file)}`))
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
