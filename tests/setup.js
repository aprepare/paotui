/**
 * Setup file: intercept require('wx-server-sdk') so cloud functions
 * load our mock instead of the real SDK.
 */
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mockPath = path.resolve(__dirname, 'mocks/wx-server-sdk.js')

// Patch Node's require resolution so that any require('wx-server-sdk')
// resolves to our mock file.
const Module = createRequire(import.meta.url)('module')
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'wx-server-sdk') {
    return mockPath
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}
