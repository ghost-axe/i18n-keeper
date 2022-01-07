#! /usr/bin/env node
const fs = require('fs')
const path = require('path')
const { program } = require('commander')

program.version('i18n-scan 1.0.9 Crafted by 鬼斧')
program
  .option('-d, --dir <type>', '扫描路径 多个路径用英文逗号分隔')
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

let scanDirs = options.dir.split(',')
let ignoreDirs = ['node_modules', '.git']
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
      let extName = path.extname(filePath)
      if (extName == '.vue') {
        processFile(filePath)
      }
    } else if (stat.isDirectory()) {
      if (ignoreDirs.indexOf(file) == -1) {
        processDir(filePath)
      }
    }
  })
}

function processFile(filePath) {
  console.log("\033[0;32m " + filePath + "\033[0m")
  let fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'})
  let reg1 = /\$t\('(.*?)'\)/g
  let reg2 = /\$t\("(.*?)"\)/g
  let matchResult
  while (matchResult = reg1.exec(fileContent)) {
    keyPaths.push(matchResult[1])
  }
  while (matchResult = reg2.exec(fileContent)) {
    keyPaths.push(matchResult[1])
  }
}

console.log('扫描文件中...');
scanDirs.forEach(dir => {
  processDir(dir)
})
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