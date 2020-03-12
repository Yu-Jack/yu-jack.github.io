---
title: Node.js 如何實現 zero downtime 更新呢?
categories: NodeJs
date: 2020-03-09 10:33:54
tags: [nodejs, DevOps, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

工作久了，一定都會面臨到一個問題  
就是 Zero Downtime 更新 (零停機更新)  
簡單來說就是『我希望更新的時候，不會影響正在使用的客戶』  
這邊就紀錄如何去實現這需求  

相信寫過 node.js 的人會知道  
在啟用伺服器的時候，如果重新修改程式要更新的時候，其實正在使用的客戶也會跟著斷線  
那究竟要如何達到 zero downtime 更新呢?  
我們來看看以下的 Cases，左邊是模擬伺服器，右邊則是模擬客戶端  

## Case 1

在左邊可以看到，如果我要更新 a.js 的程式內容  
我必須要先按下 Ctrl + C 把 node.js 取消掉然後重新下 node a.js 才可以  
但取消的同時，右邊的客戶就會中斷，沒辦法繼續發送請求  
<video width="100%" controls><source src="/images/nodejs/case-01.mp4" type="video/mp4"></video>

## Case 2

接下來就有一個 pm2 誕生的時候  
pm2 是一個管理 Node.js process 的工具，很多 production 環境也有在使用這一套  
當  Node.js 出現錯誤的時候，pm2 會幫忙重啟 Node.js  
但如果沒用正確，依舊會導致客戶端中斷連線的可能性  
下面使用 pm2 把 Node.js 啟動，我使用 `pm2 start a.js`  
然後我要重新啟動 a.js 的時候，我使用了 `pm2 restart a.js`，依舊造成客戶斷線  
<video width="100%" controls><source src="/images/nodejs/case-02.mp4" type="video/mp4"></video>

## Case 3-1

接著就有透過 [cluster](https://nodejs.org/api/cluster.html#cluster_cluster) 去解決這問題  
這個東西出現是為了解決 Node.js 沒辦法最大化利用電腦多核心的缺點  
假設電腦有四核心，透過 cluster 可以一次啟用 4 個 Node.js 的 process  
能接受的 request 量就會比只有 1 個 process 的時候還要更多  
在 pm2 裡面，是透過 `pm2 start a.js -i max` 的方式啟用最大核心數  
然後當程式修改的時候，可以透過 `pm2 reload a.js` 讓程式重起，但不會影響客戶斷線  
<video width="100%" controls><source src="/images/nodejs/case-03-01.mp4" type="video/mp4"></video>

## Case 3-2

但！就是這個但是  
萬一我們只有一個核心，也就是說只有一個 Node.js process 的時候  
我們去重新啟用的時候，依舊會發生讓客戶斷線的問題  

<video width="100%" controls><source src="/images/nodejs/case-03-02.mp4" type="video/mp4"></video>

## 中場補充  

要繼續往以下的 case 之前，要介紹在 http module 中有一個 close 的 function  
當呼叫 `server.close(() => {console.log("server is closed")})`  
express 會等到請求處理完事件後才會關閉  

### 中場補充 case 01

先來看第一個 case，左邊是我們的 server，右邊是我們客戶端  
我在 server 添加一個路由 `/close`，當 match 這個 get close 的時候，就會呼叫 close  

* 流程是這樣
當客戶呼叫 server 一個要等待兩秒的 api 時 (模擬高密集 CPU)  
我另外去呼叫 `/close` 是不會把目前使用者的請求中斷的  
而是會等到使用者 response 拿到後，才會關閉 server  
關閉後左邊 server 就會觸發 callback 印出 `server is closed`  

<video width="100%" controls><source src="/images/nodejs/case-00-01.mp4" type="video/mp4"></video>

### 中場補充 case 02

剛剛的 case 是模擬高密集型 CPU  
接下來就會有一個疑問，network 的也會等到請求結束後才會關閉嗎?  
答案是：沒錯！  

左邊是我們的 server，中間是我們客戶端，右邊是另一個 api server  

* 流程是這樣
當客戶呼叫 server 時，此台 server 去呼叫 api server  
這台 api server 也是要處理兩秒的時間  
然後另外去呼叫 `/close` 是不會把目前使用者的請求中斷的  
而是會等到使用者 response 拿到後，才會關閉 server  
關閉後左邊 server 就會觸發 callback 印出 `server is closed`  

<video width="100%" controls><source src="/images/nodejs/case-00-02.mp4" type="video/mp4"></video>


## Case 4

pm2 cluster 之後就接著出現 graceful relaod  
透過[ pm2 官網的教程](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/)  
把下列這段程式碼加到程式裡面，詳細針對 `SIGINT` 的說明可以看[ pm2 的 explanation-signals-flow](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/#explanation-signals-flow)
然後再利用剛剛中場講到的 `server.close()` 的特性去等待處理完畢  
但總會有處理太久的狀況，此時也只能忍痛強制用 `process.exit()` 跳開  
此 case 就是一邊修改 server，修改完成後就直接更新  
可以看到右邊客戶端，拿到的結果也會跟著變，但卻不會造成客戶斷線！  
透過這種方式可以接近 zero downtime 更新  
```javascript
process.on('SIGINT', () => {
  console.log("start closing")
  server.close(() => {
    // Stop after 10 secs
    setTimeout(() => {
      process.exit();
    }, 10000);
  });
});
```
<video width="100%" controls><source src="/images/nodejs/case-04.mp4" type="video/mp4"></video>

## Case 5

但為何說接近呢？
如果你的 Node.js 請求處理的時間，大於 setTimeout 的 10 秒的話，還是會造成客戶斷線  
但如果請求處理時間，全部都會遠小於這個時間，那就是真的 zero downtime 更新了  
那為了不要讓影片太久，我會把所有時間都調短  
請求處理: 5s  
客戶 timeout: 6s  
強迫程式關閉: 2s (setTimeout 的時間)  
pm2 option --kill-timeout: 3s  
這邊要特別記住，pm2 啟用的時候的 kill timeout 也需要設置 (不設置的話預設是 1.6s)  
如果不設置，最終還是以 pm2 kill timeout 為主，如果強迫程式關閉的時間，大於這個 kill timeout  
那麼強迫程式關閉的時間就形同虛設，因為最終還是會吃 kill timeout 的時間  
讓我們來看看以下的例子吧！(這個例子就沒有特別設置 kill timeout 而是用預設的)  

<video width="100%" controls><source src="/images/nodejs/case-05.mp4" type="video/mp4"></video>

## 後記

影片中的程式碼，放在附錄可以自行去測試  
但記得要安裝 pm2 才可以使用  

要達到 zero downtime 不是一件很簡單的事情  
還有的是透過 load balancer 後面接了兩台機器  
然後每一台機器輪流更新，這樣也能達到 zero downtime 更新  

## 附錄 - 程式碼

```javascript=
// a.js
const http = require("http");
const express = require("express")
const app = express()

app.use(express.static(__dirname + "/public"))
app.post("/test", (req, res) => {
  let counter = 0;
  
  for (let i = 0; i < 100000000; i++) {
    counter+=1
  }
  res.json({
    counter
  })
})
const server = http.createServer(app)
server.listen(3000, function() {
  console.log("server is up")
})


process.on('SIGINT', () => {
  console.log("start closing")
  server.close(() => {
    // Stop after 10 secs
    setTimeout(() => {
      process.exit();
    }, 10000);
  });

  // Force close server after 15 secs
  setTimeout((e) => {
    console.log('Forcing server close !!!', e);
    process.exit(1);
  }, 15000);
});
```

```javascript=
// b.js
const axios = require("axios")

async function main () {
    for (let i = 0; i < 5000; i++ ) {
        let data = await axios.post("http://localhost:3000/test", {}, {
            timeout: 10 * 1000
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