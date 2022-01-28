#! /usr/bin/env node
const fs = require('fs')
const { baidu, youdao, google } = require('translation.js')
const { program } = require('commander')

program.version('i18n-translate 1.0.15 Crafted by 鬼斧')
program
  .option('-file, --language-file <type>', '原语言json文件路径')
  .option('-from, --from-language <type>', '原语言')
  .option('-to, --to-language <type>', '翻译的语言，多个语言用英文逗号分隔')
  .option('-api, --translate-api <type>', '翻译的Api，支持百度（baidu），有道（youdao），谷歌（google），默认百度翻译')
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

var transApi = baidu
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

if (options.translateApi) {
  if (options.translateApi === 'baidu') {
    console.log("\033[0;32m 已切换百度翻译\033[0m")
  } else if (options.translateApi === 'youdao') {
    transApi = youdao
    console.log("\033[0;32m 已切换有道翻译\033[0m")
  } else if (options.translateApi === 'google') {
    transApi = google
    console.log("\033[0;32m 已切换谷歌翻译\033[0m")
  } else {
    console.log("\033[43;30m WARN \033[0;33m 翻译的Api参数错误，将使用默认百度翻译 运行i18n-translate -h 查看用法\033[0m")
  }
}

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
    if (translating) {
      data[key] = transedData.shift()
    } else {
      if (srcLan === 'en') {
        transData.push(String(data[key]).toLowerCase())
      } else {
        transData.push(data[key])
      }
    }
  }
}

function stringCut (data) {
  let startIndex = 0
  let endIndex = data.length
  while(endIndex - startIndex > 1000) {
    let index = data.indexOf('\n', startIndex + 900)
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
        res = await transApi.translate({
          text: data,
          from: srcLan,
          to: lan
        })
      } catch(error) {
        console.log(error)
        // console.log("\033[0;31m" + data + "\033[0m")
        // console.log("\033[0;31m 翻译出错，请检查json文件是否包含特殊字符\033[0m")
        process.exit(1)
      }
      for (let item of res.result) {
        transedData.push(item)
      }
      await waitSeconds(0.1)
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

function waitSeconds(second) {
  return new Promise(resolve => {
    setTimeout(resolve, second * 1000)
  })
}

translate()
