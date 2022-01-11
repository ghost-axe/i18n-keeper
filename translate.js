#! /usr/bin/env node
const fs = require('fs')
const { baidu } = require('translation.js')
const { program } = require('commander')

program.version('i18n-translate 1.0.13 Crafted by 鬼斧')
program
  .option('-file, --language-file <type>', '原语言json文件路径')
  .option('-from, --from-language <type>', '原语言')
  .option('-to, --to-language <type>', '翻译的语言，多个语言用英文逗号分隔')
program.parse(process.argv)

const options = program.opts()
if (!options.languageFile) {
  console.log("\033[41;30m ERROR \033[0;31m 命令参数错误 未指定原语言json文件路径 运行i18n-translate -h 查看用法\033[0m")
  process.exit()
}
if (!options.fromLanguage) {
  console.log("\033[41;30m ERROR \033[0;31m 命令参数错误 未指定原语言 运行i18n-translate -h 查看用法\033[0m")
  process.exit()
}
if (!options.toLanguage) {
  console.log("\033[41;30m ERROR \033[0;31m 命令参数错误 未指定翻译的语言 运行i18n-translate -h 查看用法\033[0m")
  process.exit()
}

var lanFile = options.languageFile
var srcLan = options.fromLanguage
var lanList = options.toLanguage.split(',')
var translating = false
var transData = []
var transedData = []
var SrcData = {}
var stringData = ''
var box = []
var startTs = new Date().getTime()

function translate () {
  SrcData = JSON.parse(fs.readFileSync(lanFile))

  console.log('翻译开始...')
  start()

  translating = true
  stringData = transData.join('\n')
  stringCut(stringData)

  doTrans()
}

function start () {
  let keys = Object.keys(SrcData)
  keys.sort()
  for (let i = 0; i < keys.length; i++) {
    travelObj(SrcData, keys[i])
  }
}

function travelObj (data, key) {
  if (data[key] instanceof Object) {
    let keys = Object.keys(data[key])
    keys.sort()
    for (let i = 0; i < keys.length; i++) {
      travelObj(data[key], keys[i])
    }
  } else {
    transData.push(data[key])
    if (translating) {
      data[key] = transedData.shift()
    }
  }
}

function stringCut (data) {
  let startIndex = 0
  let endIndex = data.length
  while(endIndex - startIndex > 1800) {
    let index = data.indexOf('\n', startIndex + 1700)
    box.push(data.substring(startIndex, index))
    startIndex = index + 1
  }
  box.push(data.substring(startIndex, endIndex))
}

async function doTrans () {
  for (let lan of lanList) {
    transedData = []
    for (let data of box) {
      let res
      try {
        res = await baidu.translate({
          text: data,
          from: srcLan,
          to: lan
        })
      } catch(error) {
        console.log("\033[0;31m" + data + "\033[0m")
        console.log("\033[0;31m 翻译出错，请检查json文件是否包含特殊字符\033[0m")
        process.exit(1)
      }
      for (let item of res.result) {
        transedData.push(item)
      }
    }
    start()
    let disData = JSON.stringify(SrcData, null, '\t')
    fs.writeFileSync(`./${lan}.json`, disData, 'utf8')
    console.log(`./${lan}.json`)
  }
  let endTs = new Date().getTime()
  let through = endTs - startTs
  console.log("\n\033[42;30m DONE \033[0;32m " + "翻译完成，用时" + through + "ms\033[0m")
}

translate()