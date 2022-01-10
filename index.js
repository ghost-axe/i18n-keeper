#! /usr/bin/env node
const fs = require('fs')
const express = require('express')
const { program } = require('commander')
const app = express()
var port = 8678

program.version('i18n-server 1.0.12 Crafted by 鬼斧')
program
  .option('-f, --file <type>', '多语言json文件路径')
  .option('-p, --port <type>', '监听端口')
program.parse(process.argv)

const options = program.opts()
if (!options.file) {
  console.log("\033[41;30m ERROR \033[0;31m 命令参数错误 未指定多语言json文件名 运行i18n-server -h 查看用法\033[0m")
  process.exit()
}
if (options.port) {
  port = options.port
}

var lanJson = {}
var timer = null
let fileName = options.file
let fileExist = fs.existsSync(fileName)

if (fileExist) {
  let text = fs.readFileSync('./zh-cn.json')
  lanJson = JSON.parse(String(text))
}

var allowCors = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Credentials','true')
  next()
}
app.use(allowCors)

app.get('/', async function(req, res) {
  let keyPath = req.query.keyPath
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
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(saveJson, 2000);
  let resObj = {
    code: 20000,
    msg: 'success',
    staus: 200
  }
  res.json(resObj)
})

app.listen(port, () => {
  console.log(`i18n server is running at http://localhost:${port}`)
})

function saveJson() {
  fs.writeFileSync(fileName, JSON.stringify(lanJson, null, '\t'), {
    encoding: 'utf-8'
  })
}