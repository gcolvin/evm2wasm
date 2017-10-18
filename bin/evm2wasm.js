#!/usr/bin/env node
const transcompiler = require('../index.js')

transcompiler.evm2wasm(new Buffer(process.argv[2], 'hex'))
