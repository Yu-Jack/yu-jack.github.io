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

## 後記

影片中的程式碼，放在附錄可以自行去測試  
但記得要安裝 pm2 才可以使用  