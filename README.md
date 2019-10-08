# deploy.js的介绍与使用
## 目的
减少H5项目在开发调试过程中频繁编译打包后再使用ftp工具部署至服务器的手动过程，提高工作效率。
## 安装
1. `git clone https://github.com/hello-jun/deploy.git` 拉取deploy.js，放置在项目根目录下;
2. 安装 ssh2 、moment 		
>`yarn add ssh2 moment `

## 使用
### 步骤1：
打开deploy.js，根据项目，进行手动配置，配置参数如下：
```js
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
const basePath = '/home'//项目部署目录
const bakDirName = baseDir + '.bak' + moment(new Date()).format('YYYY-M-D-HH:mm:ss')//备份文件名
const buildPath = path.resolve('./build')//本地项目编译后的文件目录
/*********************************************************************************/
/**********************************配置结束***************************************/
/*********************************************************************************/

```
### 步骤2：
1. 与create-react-app 或者 vue cli 等脚手架一起使用。	
	- 打开 `package.json`文件，在 `scripts`中添加：
		```js
			"postbuild": "yarn run deploy",
   	 	"deploy": "node ./deploy.js",
		```
	- 运行 `yarn build` 在构建完成后会自动触发 `postbuild` 进行部署
2. 单独使用
	执行
   ```bash
    node ./deploy.js
   ```
	需要注意node寻找路径的问题
	
## 运行结果示例
使用`scripts`触发时，运行yarn build以后，会自动触发生命周期钩子 `postbuild`，进行部署。此过程会先在本地构建打包项目至配置的`buildPath`目录，然后在远程服务器`xxx.xxx.xxx.xxx`的` /home`中将`my_app`备份为`my_app.bak2019-10-8-23:06:27`，最后将本地`buildPath`目录文件全部上传到`/home/my_app`,完成部署。

``` bash
$ yarn run deploy
$ node ./deploy.js
--------deploy config--------------
服务器host:           xxx.xxx.xxx.xxx
项目文件夹:            my_app
项目部署以及备份目录:    /home
备份后的文件夹名:       my_app.bak2019-10-8-23:06:27
--------deploy start--------------
cmd::mkdir -p /home/my_app/static
exit

cmd::mkdir -p /home/my_app/static/css
exit

cmd::mkdir -p /home/my_app/static/js
exit

cmd::mkdir -p /home/my_app/static/media
exit

upload /home/my_app/asset-manifest.json
upload /home/my_app/favicon.ico
upload /home/my_app/index.html
upload /home/my_app/logo192.png
upload /home/my_app/logo512.png
upload /home/my_app/manifest.json
upload /home/my_app/precache-manifest.20dc8cb74286fd491ca0a9fc9b07234a.js
upload /home/my_app/robots.txt
upload /home/my_app/service-worker.js
upload /home/my_app/static/css/main.2cce8147.chunk.css
upload /home/my_app/static/css/main.2cce8147.chunk.css.map
upload /home/my_app/static/js/2.222d1515.chunk.js
upload /home/my_app/static/js/2.222d1515.chunk.js.map
upload /home/my_app/static/js/main.0782b2ff.chunk.js
upload /home/my_app/static/js/main.0782b2ff.chunk.js.map
upload /home/my_app/static/js/runtime~main.077bb605.js
upload /home/my_app/static/js/runtime~main.077bb605.js.map
upload /home/my_app/static/media/logo.5d5d9eef.svg
--------deploy end--------------

Done in 16.58s.
```
