# 环境准备
node ^8.9.3

mongo-server ^3.4.7

redis-server ^3.2.8

`npm install -g bower gulp`

# 安装
```
npm install --registry=https://registry.npm.taobao.org
bower install
```

# 配置
复制`.env.example`文件为`.env`

# 导入数据
mongorestore --gzip --archive=<数据库文件路径>

# 运行

## 开发环境

```
gulp serve
node server
```

## 生产环境

```
gulp build
```

Apache2或NGINX等Web Server，绑定dist目录
PM2等进程管理工具启动`node server`


