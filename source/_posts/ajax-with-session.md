---
title: 前後端分離下之使用 session
categories: NodeJs
date: 2019-06-02 12:13:07
tags: [nodejs, session, cookie, cors, credential]
header-img: /images/banner.jpg
catalog: true
---

這邊主要在介紹當前後端架構上完全分離 (連 domain 都分離) 狀況下
要如何達到使用 session 的方法

知道 CORS 是什麼的人且想直接知道怎麼做可以直接跳到[重點筆記](#重點筆記)

<!-- more -->

## 前言

以往我們前後端程式是寫在一起時，都是透過後端程式去 render (渲染) 一個頁面  
而在前端頁面做請求的時候，請求都會帶著 cookie 到 server 上去判別是否屬於為同一個人  
但當我們在前後端完全分離的狀況下，該怎麼去達到這件事情呢?

## CORS

瀏覽器有一個限制，當這個 request 請求起始的地方跟 endpoint 不一致得時候會造成所謂 CORS 的問題  
舉例來說，假設網站架設在 https://www.example.com 底下，但是你的 API Server 是在 https://www.example1.com 的話  
這樣網站 POST 到 API Server 的請求就會被阻擋 (這時 request 是從 html 頁面發起)  

因為這個限制，API Server 往往要在 Header 上加上以下幾個東西去符合瀏覽器的規範

1. Access-Control-Allow-Headers
2. Access-Control-Allow-Origin
3. Access-Control-Allow-Methods

透過設置這三個 header 的參數，就可以讓前端合法的使用 API Server 了
所以按照剛剛的邏輯去加上 Header 會這樣加  
Access-Control-Allow-Headers: *  
Access-Control-Allow-Origin: https://www.example.com  
Access-Control-Allow-Methods: POST  

然而在使用前後端分離的架構下，身份驗證以及授權就相對上就變得比較難一點  
雖然解法上還可以使用 JWT 去解決這個問題，但這篇文章主要會鎖定在用 sessino 的方式去解決

題外話，有一種方式也可以繞過 CORS，就是以 Proxy Server 的方式去實作
以下用著名的 Vue cli 為圖解
![](/images/vue-cli-proxy.png)

## XHR Credential  

當加上以上三個 CORS 的規範後  
會發現在發出 request 的時候，是不會帶入 cookie 去給 server 做驗證  
![](https://imgur.com/ATihx4F.png)

這時候就可以透過 xhr 裡面的 credential 去設定  
當把這個欄位設定成 true 的時候，request 就會夾帶 cookie 到 server 去  
![](https://i.imgur.com/neAHW1c.png)

## 詳細操作說明  

提到前後端完全分離的話，那我們就要準備兩個 server 
一台 server 專門是讀取靜態 html 的 server  
一台 server 專門是處理 API 的 server  

### html server

透過 Node.js 快速建立一個可以讀取靜態檔案的 server

```javascript
const express = require('express');
const app = express();
app.use(express.static("./public"));
app.listen(8888);
```

而 `public/index.html` 的內容為

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <script>
    let ajax = new XMLHttpRequest();
    ajax.open('POST', 'http://localhost:7777/test');
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.onload = function() {
        if (ajax.status === 200) {
            alert('Received ' + ajax.responseText);
        }
    };
    ajax.send(JSON.stringify({
        data: "hi from html"
    }));
    </script>
</body>
</html>
```

### api server

另一台主要當作 api server  
主要就印出 session id 來觀看每一次的 request 是不是同一個人

```javascript
const express = require('express');
const app = express();
const session = require('express-session')
var sess = {
  secret: 'keyboard cat',
  cookie: {},
  resave: true,
  saveUninitialized: false,
}

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session(sess))
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Accept, Content-Type, Cookie")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS, PATCH")
    next();
})
app.post('/test', (req, res) => {
    console.log(req.sessionID);
    req.session.a = "hi"
    res.json({a: 1})
})

app.listen(7777, () => {
    console.log('start');
});
```

### 實作

透過執行以上的兩個 server 程式，寫後近到 http://localhost:8080 之後  
按下幾次重整，可以看到 api server 印出來的 session 每一次都是不同個  
![](https://imgur.com/s8uwa99.png)

接下來就是要透過 xhr 的 credential 去設定
在 ajax 送出之前要加上 `ajax.withCredentials = true;` 這樣才可以把 Cookie 夾帶上去  
但會發現瀏覽器卻爆出另一個錯誤訊息  
`The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode is 'include'`  
![](https://imgur.com/B4OEBSz.png)
這是前後端必須要同步都使用 credentials 才可以用  
於是在後端 server 加上 `Access-Control-Allow-Credentials: true`

但再度重整之後又發現新的錯誤！
`The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`
![](https://imgur.com/HBreO9s.png)

其實這也是限制的一種，當使用到 credentials 的時候，後端必須多限制只有一個 domain 能使用  
 `Access-Control-Allow-Origin: http://localhost:8888`  
這樣設定之後按幾次重整就會發現 session id 是一致的了
![](https://imgur.com/DY6aSrr.png)

## 重點筆記

### 後端必須加上以下的 headers

1. Access-Control-Allow-Headers: *
2. Access-Control-Allow-Origin: http://localhost:8888
    > 只能指定一個 domain，不能用 * 字號
3. Access-Control-Allow-Methods: *
4. Access-Control-Allow-Credentials: true

1, 3 兩點根據需要使用的 method 和 headers 再去客製化  
以資安來說建議不寫上 `*`，寫上有使用的就可以了

### 前端則是必須在 xhr 上面加上

1. xhr.withCredentials = true

## 後記  

以上為簡單介紹如何在前後分離架構下依舊可以使用 session 的方式  
而文章有提到 JWT，那是另一種驗證及授權方式，有機會再來談談這個技術實作的方式  