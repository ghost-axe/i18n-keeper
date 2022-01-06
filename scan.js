#! /usr/bin/env node
const fs = require('fs')
const path = require('path')
const { program } = require('commander')

program.version('i18n-scan 1.0.7 Crafted by 鬼斧')
program
  .option('-d, --dir <type>', '扫描路径')
  .option('-f, --file <type>', 'json文件保存路径')
program.parse(process.argv)

const options = program.opts()
if (!options.dir) {
  console.log("\033[41;30m ERROR \033[0;31m 命令参数错误 未指定扫描路径 运行i18n-scan -h 查看用法\033[0m")
  process.exit()
}
if (!options.file) {
  console.log("\033[41;30m ERROR \033[0;31m 命令参数错误 未指定json文件保存路径 运行i18n-scan -h 查看用法\033[0m")
  process.exit()
}

let keyPaths = []
let lanJson = {}
let startTs = new Date().getTime()

function processDir(dir) {
  let files
  try {
    files = fs.readdirSync(dir)
  } catch(err) {
    return
  }
  files.forEach(file => {
    let filePath = path.join(dir, file)
    let stat = fs.statSync(dir + '/' + file)
    if (stat.isFile()) {
      processFile(filePath)
    } else if (stat.isDirectory()) {
      processDir(filePath)
    }
  })
}

function processFile(filePath) {
  console.log("\033[0;32m " + filePath + "\033[0m")
  let fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'})
  let reg = /\$t\('(.*?)'\)/g
  let matchResult
  while (matchResult = reg.exec(fileContent)) {
    keyPaths.push(matchResult[1])
  }
}

console.log('扫描文件中...');
processDir(options.dir)
keyPaths.forEach(keyPath => {
  let keys = keyPath.split('.')
  let obj = lanJson
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]
    if (i == keys.length - 1) {
      obj[key] = key
    } else {
      if (!obj[key]) {
        obj[key] = {}
      }
      obj = obj[key]
    }
  }
})
fs.writeFileSync(options.file, JSON.stringify(lanJson, null, '\t'), {
  encoding: 'utf-8'
})
let endTs = new Date().getTime()
let through = endTs - startTs
console.log("\n\033[42;30m DONE \033[0;32m " + "扫描完成，用时" + through + "ms\033[0m")