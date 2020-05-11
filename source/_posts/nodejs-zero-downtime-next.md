---
title: 續篇 - Node.js & Mongodb zero downtime 更新
categories: NodeJs
date: 2020-05-11 10:33:54
tags: [nodejs, DevOps, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

上次提到了, 關於在 http module 裡面的 close function
當呼叫 `server.close(() => {console.log("server is closed")})`  
express 會等到請求處理完事件後才會關閉  

但那次我們單純只提到了伺服器的部分  
那麼當我的伺服器跟資料庫連動的時候, 也是一樣的狀況嗎?  

這篇將會 demo 如何在伺服器與資料庫連線的同時, 做到 zero downtime 更新  
另外, 這篇是使用 mongodb 以及 mongoose 套件進行 demo  

## 前提注意  

mongoose 使用版本為 5.9.13, mongodb 使用版本為 3.6.2  
在筆者測試的時候, 發現有一個參數 `useUnifiedTopology` 有沒有設定是會影響此次的結果  
在這個 zero downtime 的測試中, `useUnifiedTopology` 的參數是 false  
若改成 true, 此次測試皆會失敗, 也就無法達成 zero downtime update 的目的  

但在 mongoose v5.9.13 的文件裡面, 針對 `useUnifiedTopology` 的參數, 是希望改成 true  
原因是他們重寫了如何處理監控伺服器的程式碼還有機制  
所以才會導致設定之後會失敗, 詳細可以看看看這邊 [Server Discovery And Monitoring](https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring.rst)  

> [原文](https://mongoosejs.com/docs/deprecations.html#useunifiedtopology)  
> Mongoose 5.7 uses MongoDB driver 3.3.x, which introduced a significant refactor  
> of how it handles monitoring all the servers in a replica set or sharded cluster.  
> In MongoDB parlance, this is known as server discovery and monitoring.  

除此之外, 設定為 true 之後, `autoReconnect` `reconnectTries` `reconnectInterval` 這幾個選項也不會支援  
詳細可以看 [mongoose connection options](https://mongoosejs.com/docs/connections.html#options)  
在下面就有針對 `useUnifiedTopology: true` 的去解釋可以用哪些參數  
以及 `useUnifiedTopology: false` 的去解釋又有哪些參數可以使用  

另外筆者把 mongoose 版本改成 v4.13.20 後, 因為沒了建議上要加 `useUnifiedTopology` 的規則, 使用上就都會正常  

## Case 1

在使用 mongoose 的時候, 其實裡面也能拿到跟 DB 連線的 connection  
在 mongoose 連線之後, 可以透過此方法 `const db = mongoose.connection` 取得 connection  
既然拿得到 connection, 那麼我們也有方式可以關閉的  
可以透過 `db.close(() => {console.log("db is closed")})`  

有沒有發現這跟 server close function 也是很類似的用法  
但在 mongoose 裡面, 是不是會有等待當前程式執行完之後, 才關閉 db 連線的作用呢?  

我們先撰寫一個簡單的 api, 使用者呼叫 api 後  
伺服器會等待五秒後到資料庫取得資料, 並回傳給使用者  
但我們同時開放一個 api, 呼叫的時候可以關閉 db 連線  
我們就是要趁在等待的五秒的之中, 去呼叫關閉 db 連線的 api  
以此去實驗, 在使用者取得資料之前, 這個 db 連線會不會就這樣被關閉  

以下為 DEMO 影片成果  
最左邊為伺服器, 中間為使用者呼叫 API, 最右邊為呼叫關閉 db 連線的 API  
<video width="100%" controls><source src="/images/nodejs-mongoose/demo-02.mp4" type="video/mp4"></video>  

但若我們改成直接呼叫關閉的 API 會發現他是能馬上直接關閉的  
這也證明這個連線是有在被『等待』  
<video width="100%" controls><source src="/images/nodejs-mongoose/demo-01.mp4" type="video/mp4"></video>  

## Case 2  

測試完以上的案例後, 可以結合上次提到的 pm2 試試看整個 combo  
使用情境也是一樣, 使用者呼叫 api 後  
伺服器會等待五秒後才到資料庫取得資料, 並回傳給使用者  
但這裡, 我們就不開放一個新的 api 去讓使用者呼叫去關閉 db 連線  

這裡我們會跟上次一樣, 把 `db.close()` 加到 pm2 指定的 graceful reload 的 function 裡面  
大致樣子會變成以下這個樣子  

```javascript
db.close(() => {
    console.log("db connection is closed");
    server.close(() => {
        console.log("server is closed");
        // Stop after 10 secs
        setTimeout(() => {
            process.exit();
        }, 10000);
    });
})
```

以下為 DEMO 影片成果  
<video width="100%" controls><source src="/images/nodejs-mongoose/demo-03.mp4" type="video/mp4"></video>  

## 後記

影片中的程式碼，放在附錄可以自行去測試  
但記得要安裝 pm2 和 mongodb 才可以使用  
至於要如何在 v5.9.13 之後版本而且 `useUnifiedTopolog: true` 的狀態達成 zero dowmtime 目的  
就留給下次研究了  

## 附錄
```javascript
// a.js
const http = require("http");
const express = require("express")
const app = express()
const mongoose = require("mongoose")

mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
});
const db = mongoose.connection
const Cat = mongoose.model('Cat', { name: String });

app.use(express.static(__dirname + "/public"))
app.post("/test", async (req, res) => {
  let counter = 0;

  for (let i = 0; i < 10000; i++) {
    counter+=1
  }
  let startTime = new Date();
  while (new Date().getTime() - startTime.getTime() < 2000) {

  }

  let allCats = await Cat.find({}, {name: 1});
  res.json({
    counter,
    allCats
  })
})
app.get("/db-close", async (req, res) => {
    db.close(() => {
      res.send("db close")
    })
})

const server = http.createServer(app)
server.listen(3000, function() {
  console.log("server is up")
})


process.on('SIGINT', () => {
  console.log("start closing")
  db.close(() => {
    server.close(() => {
      // Stop after 10 secs
      setTimeout(() => {
        process.exit();
      }, 10000);
    });
  })
});
```

```javascript
// b.js
const axios = require("axios")

async function main () {
    for (let i = 0; i < 1000; i++ ) {
        let data = await axios.post("http://localhost:3000/test", {}, {
            timeout: 1 * 10000
        }).then((response) => {
            return response.data
        })
        console.log(i)
        console.log(data)
    }
    console.log("done")
}

main()

```