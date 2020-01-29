---
title: Express 對靜態檔案做了什麼? 為什麼會被 cache 住呢?
categories: NodeJs
date: 2017-12-11 22:39:00
tags: [nodejs, express]
header-img: /images/banner.jpg
catalog: true
---

## 前言

最近突然有一個想法開始研究起瀏覽器端的 Cache 方法
加上小弟常用 nodejs + express 去寫前後端
於是開始研究起 express 裡面有一個 middleware 怎麼做起瀏覽器 cache 這件事

<!-- more -->

## 介紹

在 express 裡面有一個 function 叫做 `express.static()`
這個是一個 middleware，最常被用在要讀取一些靜態檔案上面
以這個寫法來說 `app.use(express.static(__dirname + './public'))`
是指向 `public` 這個資校夾裡面，假設裡面有一個檔案叫做 `index.html` 的話，並且伺服器的 port 是 8080
那麼在網址列輸入 `http://localhost:8080/index.html` 這樣就可以讀到這個檔案了

## 追朔源頭

那我的疑問來了，我打開 Chrome Inspect 的 Network Tab 去看了一下他的 Response Headers
發現一件很奇怪的事情，我明明什麼都沒有設定，卻出現幾個有關 Cache 的 Headers

1. Accept-Ranges
2. Cache-Control
3. ETag
4. Last-Modified

![](https://i.imgur.com/3O0nBTh.png)


> 有關 Cache 的一些機制和理論就不多作介紹
> 這裡單純就爬一下 Source Code，看看 express 對靜態檔案做了什麼

### express

在 express source code 中，發現他是用了另一個 library `server-static`
於在就再來看看 `server-static` 做了什麼

```javascript=
exports.static = require('serve-static');
```


### serve-static

我只列出關鍵幾行，其他行主要都是設置參數用而已

從第一行可以看出，把 `serverStatic` 這個 function 給 export 出來了
再往下看會發現有一個 `send` function 把 `path` 傳了進去
然後在最後面，`stream.pipe(res)` 對 response 做了一些更動

於是再往下找找看 `send()` 這個是什麼東西

```javascript=
module.exports = serveStatic;

var send = require('send')

function serveStatic (root, options) {
    // Some codes ....

    var stream = send(req, path, opts)
    // Some codes ....

    // pipe
    stream.pipe(res)
}
```

### send -- send

根據上一段程式最後一段 (12行)，他 call 了一個 `pipe` 的 function
`pipe` function 裡面去 call `this.sendFile(path)`
`this.sendFile` 裡面又去 call `self.send(path, stat)`
然後在 `send` 這個 fucntion 裡面出現關鍵的 `function` -- `this.setHeader`
看來 response headers 就是在這邊被更改了

```javascript=

module.exports = send

// 這邊回傳給到 server-static 去 call
// 也就是上一段程式碼的第 8 行，然後在第 
function send (req, path, options) {
  return new SendStream(req, path, options)
}

SendStream.prototype.pipe = function pipe (res) {
    this.sendFile(path)
}

SendStream.prototype.sendFile = function sendFile (path) {
// 這個等等 demo 截圖會看到，所以先留著
  debug('stat "%s"', path)
  self.send(path, stat)
}


SendStream.prototype.send = function send (path, stat) {
  // 這個等等 demo 截圖會看到，所以先留著
  debug('pipe "%s"', path)

  // set header fields
  this.setHeader(path, stat)
}
```

### send -- setHeader

找到了對 header 做更動的地方後，以第 11 ~ 20 行中間這段 Code 來說
去設置了 Cache-Control 的內容，依照整個邏輯下如果沒有特別設置，那麼 header 會長以下這樣

`Cache-Control: public, max-age=0`


```javascript=
SendStream.prototype.setHeader = function setHeader (path, stat) {
  var res = this.res

  this.emit('headers', res, path, stat)

  if (this._acceptRanges && !res.getHeader('Accept-Ranges')) {
    debug('accept ranges')
    res.setHeader('Accept-Ranges', 'bytes')
  }

  if (this._cacheControl && !res.getHeader('Cache-Control')) {
    var cacheControl = 'public, max-age=' + Math.floor(this._maxage / 1000)

    if (this._immutable) {
      cacheControl += ', immutable'
    }

    debug('cache-control %s', cacheControl)
    res.setHeader('Cache-Control', cacheControl)
  }

  if (this._lastModified && !res.getHeader('Last-Modified')) {
    var modified = stat.mtime.toUTCString()
    debug('modified %s', modified)
    res.setHeader('Last-Modified', modified)
  }

  if (this._etag && !res.getHeader('ETag')) {
    var val = etag(stat)
    debug('etag %s', val)
    res.setHeader('ETag', val)
  }
}
```

## DEMO

另外提供另個方法可以追回去 (我是懶得寫程式直接看 source code XD)
安裝完環境之後要跑 server 的時候，可以這樣下

`DEBUG=* node server.js`

從圖片中可以發現，那些 log message 是一樣的 

![](https://i.imgur.com/mhj2YxB.png)



## 後記

一直以來以為是 express 的做法讓檔案可以 cache 住
原來一直都是默默無名的 opensouce library 在幫助 express 啊 
希望這篇有稍微幫助到對 express 處理 static files 有疑慮的人
