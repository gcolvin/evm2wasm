#!/usr/bin/node --experimental-modules
const ethUtil = require('ethereumjs-util')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const tempWasm = fs.readFileSync(process.argv[2])
const mod = WebAssembly.Module(tempWasm)
const instance = WebAssembly.Instance(mod)
const val = instance.exports.main()
console.log(ethUtil.toBuffer(val).toString('hex'))

