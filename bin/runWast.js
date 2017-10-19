#!/usr/bin/env node
const ethUtil = require('ethereumjs-util')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')

const transcompiler = require('../index.js')
const Interface = require('../kernel/EVMimports')
const DebugInterface = require('../kernel/debugInterface')
const Environment = require('../kernel/environment.js')


main().then(function() {
  console.log('success')
}).catch(function(err) {
  console.log('error:', err)
})

async function main() {
  const code = process.argv[2]
  console.log('code:', code)
  const wasmCode = await transcompiler.evm2wasm(code, {
                      stackTrace: false,
                      inlineOps: true,
                      pprint: false,
                      wabt: true
                    })

  console.log('wasmCode:', wasmCode)
  runWasmCode(wasmCode)

}


function runWasmCode(wasmCode) {
  const mod = WebAssembly.Module(wasmCode)
  const wasmImports = wasmImportThingie()
  const instance = WebAssembly.Instance(mod, wasmImports)
  //const instance = WebAssembly.Instance(mod, {}) //  TypeError: WebAssembly Instantiation: Import #0 module="ethereum" error: module is not an object or function
  const val = instance.exports.main()
  console.log('val:', val)
  console.log(ethUtil.toBuffer(val).toString('hex'))
}


function wasmImportThingie() {

  class VM {
    constructor() {
      //this._environment = new Environment({state: this})
      this._environment = new Environment()
    }

    get environment () {
      return this._environment
    }

    get memory () {
      return this._instance.exports.memory.buffer
    }
  }


  const wasmVm = new VM();

  const interfaces = [Interface, DebugInterface]

  console.log('building wasm imports..')
  //const wasmImports = buildImports(this._vm, opts.interfaces)
  const wasmImports = buildImports(wasmVm, interfaces)

  function buildImports (api, imports = [Imports]) {
    return imports.reduce((obj, InterfaceConstuctor) => {
      obj[InterfaceConstuctor.name] = new InterfaceConstuctor(api).exports
      return obj
    }, {})
  }
  
  return wasmImports
}



