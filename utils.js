"use strict"
const processMap = (map, mapper) => new Map(Object.entries(map).map(mapper))
const inverterMap = ([key, value]) => [value, key]
const converterMap = ([key, value]) => [key, invertMap(value)]
const invertMap = (map) => processMap(map, inverterMap)
const convertMap = (map) => processMap(map, converterMap)

const processObject = (map, mapper) => Object.assign({}, ...Object.entries(map).map(mapper))
const inverterObject = ([key, value]) => ({ [value]: key })
const converterObject = ([key, value]) => ({ [key]: invertObject(value) })

const invertObject = (map) => processObject(map, inverterObject)
const convertObject = (map) => processObject(map, converterObject)

module.exports = { convertMap, convertObject }