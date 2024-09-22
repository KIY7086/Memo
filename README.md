# KIY7086/Memo
一个由React.js构建的Web备忘录<br>

## 功能：
1.localstorage存储备忘录数据<br>
2.菜单栏多备忘录切换<br>
3.Markdown支持<br>
4.原生HTML支持<br>
5.备忘录Tag<br>

## 未来会支持的功能
1.备忘录数据导出<br>
2.设置面板<br>
3.WebDav云同步<br>
4.服务器加密云同步<br>

## 配置环境
本项目依赖`Node.js`，确保你已经安装了Node.js<br>
<br>
克隆本仓库
```
git clone https://github.com/KIY7086/Memo.git && cd Memo
```
安装依赖的NPM包
```
yarn // 使用yarn安装
```
如果yarn未安装，请使用corepack安装yarn
```
npm install -g corepack
corepack enable
```

## 调试和构建
使用Vite启动项目
```
npm run dev
```
使用Vite编译项目（编译结果在dist目录下）
```
npm run build
```
