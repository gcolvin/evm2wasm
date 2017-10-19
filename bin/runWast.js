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
  //const code = process.argv[2]
  const code = Buffer.from(process.argv[2], 'hex')
  console.log('code:', code.toString('hex'))
  const wasmCode = await transcompiler.evm2wasm(code, {
                      stackTrace: true,
                      inlineOps: true,
                      pprint: false,
                      wabt: true
                    })

  console.log('wasmCode:', wasmCode)
  runWasmCode(wasmCode)

}


function runWasmCode(wasmCode) {
  const mod = WebAssembly.Module(wasmCode)
  let wasmVm = createVM()
  let wasmImports = wasmImportThingie(wasmVm)
  //const instance = WebAssembly.Instance(mod, {}) //  TypeError: WebAssembly Instantiation: Import #0 module="ethereum" error: module is not an object or function
  const instance = WebAssembly.Instance(mod, wasmImports)
  wasmVm.wasmInstance = instance
  
  instance.exports.main()
}



function createVM() {
  class VM {
    constructor() {
      //this._environment = new Environment({state: this})
      this._environment = new Environment()
    }
    
    set wasmInstance (inst) {
      this._instance = inst
    }

    get environment () {
      return this._environment
    }

    get memory () {
      //console.log('wasmImportThingie get memory()')
      return this._instance.exports.memory.buffer
    }
  }

  const wasmVm = new VM();
  return wasmVm
}


function wasmImportThingie(wasmVm) {

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



