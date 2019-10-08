const path = require('path')
const moment = require('moment')
const util = require('util')
const events = require('events')
const Client = require('ssh2').Client
const fs = require('fs')
/*********************************************************************************/
/******************************请手动配置以下内容*********************************/
/*********************************************************************************/
/**
 * 远程服务器配置
 * @type {{password: string, port: number, host: string, username: string}}
 */
const server = {
  host: 'xxx.xxx.xxx.xxx',  //主机ip
  port: 22,                //SSH 连接端口
  username: 'xxxx',        //用户名
  password: 'xxxxxxx',     //用户登录密码
}
const baseDir = 'my_app'//项目目录
const basePath = '/home/h5'//项目部署目录
const bakDirName = baseDir + '.bak' + moment(new Date()).format('YYYY-M-D-HH:mm:ss')//备份文件名
const buildPath = path.resolve('./build')//本地项目编译后的文件目录
/*********************************************************************************/
/**********************************配置结束***************************************/
/*********************************************************************************/

function doConnect(server, then) {
  const conn = new Client()
  conn.on('ready', function () {
    then && then(conn)
  }).on('error', function (err) {
    console.error('connect error!', err)
  }).on('close', function () {
    conn.end()
  }).connect(server)
}

function doShell(server, cmd, then) {
  doConnect(server, function (conn) {
    conn.shell(function (err, stream) {
      if (err) throw err
      else {
        let buf = ''
        stream.on('close', function () {
          conn.end()
          then && then(err, buf)
        }).on('data', function (data) {
          buf = buf + data
        }).stderr.on('data', function (data) {
          console.log('stderr: ' + data)
        })
        stream.end(cmd)
      }
    })
  })
}

function doGetFileAndDirList(localDir, dirs, files) {
  const dir = fs.readdirSync(localDir)
  for (let i = 0; i < dir.length; i++) {
    const p = path.join(localDir, dir[i])
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      dirs.push(p)
      doGetFileAndDirList(p, dirs, files)
    }
    else {
      files.push(p)
    }
  }
}

function Control() {
  events.EventEmitter.call(this)
}

util.inherits(Control, events.EventEmitter)

const control = new Control()

control.on('doNext', function (todos, then) {
  if (todos.length > 0) {
    const func = todos.shift()
    func(function (err, result) {
      if (err) {
        then(err)
        throw err
      }
      else {
        control.emit('doNext', todos, then)
      }
    })
  }
  else {
    then(null)
  }
})

function doUploadFile(server, localPath, remotePath, then) {
  doConnect(server, function (conn) {
    conn.sftp(function (err, sftp) {
      if (err) {
        then(err)
      }
      else {
        sftp.fastPut(localPath, remotePath, function (err, result) {
          conn.end()
          then(err, result)
        })
      }
    })
  })
}

function doUploadDir(server, localDir, remoteDir, then) {
  let dirs = []
  let files = []
  doGetFileAndDirList(localDir, dirs, files)

  // 创建远程目录
  let todoDir = []
  dirs.forEach(function (dir) {
    todoDir.push(function (done) {
      const to = path.join(remoteDir, dir.slice(localDir.length + 1)).replace(/[\\]/g, '/')
      const cmd = 'mkdir -p ' + to + '\r\nexit\r\n'
      console.log(`cmd::${cmd}`)
      doShell(server, cmd, done)
    })// end of push
  })

  // 上传文件
  let todoFile = []
  files.forEach(function (file) {
    todoFile.push(function (done) {
      const to = path.join(remoteDir, file.slice(localDir.length + 1)).replace(/[\\]/g, '/')
      console.log('upload ' + to)
      doUploadFile(server, file, to, done)
    })
  })
  control.emit('doNext', todoDir, function (err) {
    if (err) {
      throw err
    }
    else {
      control.emit('doNext', todoFile, then)
    }
  })
}

console.log('--------deploy config--------------')
console.log(`服务器host:            ${server.host}`)
console.log(`项目文件夹:            ${baseDir}`)
console.log(`项目部署以及备份目录:  ${basePath}`)
console.log(`备份后的文件夹名:      ${bakDirName}`)
console.log('--------deploy start--------------')

doShell(server, `mv ${basePath}/${baseDir} ${basePath}/${bakDirName}\nexit\n`)

doUploadDir(server, buildPath, `${basePath}/${baseDir}`, () => console.log('--------deploy end--------------'))

