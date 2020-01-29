---
title: 如何串接上 TapPay 並完成第一筆交易!
categories: Payment Gateway
date: 2017-09-23 11:43:00
tags: [TapPay, Payment Gateway, nodejs]
header-img: /images/banner.jpg
catalog: true
---
這篇文章主要是說明如何使用 TapPay 這個服務
TapPay 是一家金流廠商，主要都是做線上金流，詳細就不多說
有興趣想要詳細了解可以去參考官網 https://www.tappaysdk.com

最近剛好被派去串接 TapPay 的服務，就順便把整個流程給記錄下來了
這邊會以 Web 服務為主去做範例，完整程式碼，請參考最下面

<!--more-->

## 環境設置

1. TapPay Portal 申請
    
    要拿到以下的值才有辦法作後續的付款
    * App Key (應用程式頁面)
    * App ID (應用程式頁面)
    * Partner Key (帳號資訊頁面)
    * Merchant ID (商家管理頁面)

2. 程式部分

	* 前端: HTML + Javascript + CSS
	* 後端: nodejs (v6)

3. 網域部分

	* 設置 /etc/hosts
    這邊要特別注意，要去 /etc/hots 底下設置
    跟在 TapPay Portal 所建立的 domain 一樣
    才有辦法 Get Prim，否則會一直出現 CORS 的問題
    待會在細部流程的時候會做介紹
	
4. 測試卡號

    測試卡號可以參考這裡
    https://docs.tappaysdk.com/tutorial/zh/reference.html#test-card
    card number 4242424242424242
    month 01
    year 23
    ccv 123



## 流程介紹

主要分成以下幾個步驟
* 前端

    1. 使用 TapPay SDK 設置好輸入卡號的表單
    2. 按下按鈕觸發 TapPay 的 GetPrime 方法
    3. 拿到 Prime
    4. 把 Prime 送到後端

* 後端

    1. 拿到前端送來的 Prime
    2. 把 Prime 加上其他所需參數送往 TapPay Server
    3. 完成付款!


## 程式撰寫 - 前端

根據最新的 SDK 發佈的方法, 可以直接在一個 element 底下把卡號輸入表單塞進去

### HTML

HTML 分成兩個部分
1. 建立好一個 div 準備等等被塞入輸入卡號表單
2. 建立好 trigger button 來觸發 Get Prime 方法

```html=
<div style="width: 480px; margin: 50px auto;">
    <label>CardView</label>

    <!-- 這是我們要塞表單的地方 -->
    <div id="cardview-container"></div>

    <!-- 這是我們要觸發 GetPrime 方法的地方 -->
    <button id="submit-button" onclick="onClick()">Get Prime</button>
</div>
```

### Javascript

Javascript 分成三個部分
1. 初始化金鑰
2. 植入輸入卡號表單
3. 觸發 getPrime 方法

```javascript=
// 設置好等等 GetPrime 所需要的金鑰
TPDirect.setupSDK(APP_ID, "APP_KEY", "sandbox")
				  
// 把 TapPay 內建輸入卡號的表單給植入到 div 中
TPDirect.card.setup('#cardview-container')

var submitButton = document.querySelector('#submit-button')

function onClick() {
    // 讓 button click 之後觸發 getPrime 方法
    TPDirect.card.getPrime(function (result) {
        if (result.status !== 0) {
            console.err('getPrime 錯誤')
            return
        }
        var prime = result.card.prime
        alert('getPrime 成功: ' + prime)
    })
}
```

沒錯！你沒看錯，不到 30 行
但是，這邊要注意到一個地方，如果你 Get Prime 之後沒有任何反應
打開開發者模式後卻看到了這個
getPrime 錯誤
題外話，如果並不使用 TPDirect.card.setup 版本的話
而是自己實作整個流程，則會看到 CORS 的紅字

這個代表你開發的網域和你在 TapPay Portal 上面所填寫的網域是不一樣的
這就是一開始在環境設置提到的 /etc/hosts 有關係

假設你未來可能要使用的網域是 example-tappay.yujack.com 的話
請到 /etc/hosts localhost 下面加上一段

```shell=
127.0.0.1 localhost
127.0.0.1 example-tappay.yujack.com
```

然後回到網頁上把 URL 從 
http://localhost:8080/ 改成 http://example-tappay.yujack.com:8080/
這樣 Get Prime 就會成功了！

不過要注意，如果你未來要用的網域是已經在用的話
在 /etc/hosts 底下是上去是沒有用的
所以切記用一個沒在用的網域做測試
否則 .. 你只好直接部署上去測試了

## 程式撰寫 - 後端

小弟我是習慣用 nodejs 撰寫後端伺服器
所以這邊會以 nodejs 去做付款的動作
前端 Get Prime 成功之後, 就要把這組 prime 送到後端了

### 建立 NodeJs server

```javascript=
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const https = require('https');
const PORT = 8080

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use('/', express.static(__dirname + "/html")) //serve static content

app.post('/pay-by-prime', (req, res, next) => {
    // 必須要把程式實作在這邊
})

app.listen(PORT, () => {
    console.log('Connet your webiste in the http://localhost:8080/');
})
```

### 實作 Pay by Prime 

接下來要實作 pay-by-prime 的程式
要加到 app.post('/pay-by-prime') 裡面
這裡有兩個參數要注意
兩個都是在 TapPay Portal 上面申請帳號時會獲得的，程式如下

1. Partner Key (帳號資訊頁面)
2. Merchant ID (商家管理頁面)

另外就是 headers 裡面要特別帶 x-api-key 進去
否則會收到 access deny 的 response

可以參考 https://docs.tappaysdk.com/tutorial/zh/back.html#pay-by-prime-api
所需要帶的參數和 headers

```javascript=
const post_data = {
    // prime from front-end
    "prime": req.body.prime,
    "partner_key": "PARTNER_KEY",
    "merchant_id": "MERCHANT_ID",
    "amount": 1,
    "currency": "TWD",
    "details": "An apple and a pen.",
    "cardholder": {
        "phone_number": "+886923456789",
        "name": "yujack",
        "email": "example@gmail.com"
    },
    "instalment": 0,
    "remember": false
}

const post_options = {
    host: 'sandbox.tappaysdk.com',
    port: 443,
    path: '/tpc/payment/pay-by-prime',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // 這個參數必須要帶上去，否則不會過
        'x-api-key': 'PARTNER_KEY'
    }
}

const post_req = https.request(post_options, function(response) {
    response.setEncoding('utf8');
    response.on('data', function (body) {
        return res.json({
            result: JSON.parse(body)
        })
    });
});

post_req.write(JSON.stringify(post_data));
post_req.end();
```

實作完成後，開啟 nodejs server 
然後打上測試卡後就可以完成付款了！
打完收工！下班去！


### 前端補正

記得前端要補上把 prime 帶上來的程式
```javascript=
$.post('/pay-by-prime', {prime: prime}, function(data) {
    alert('付款成功' + JSON.stringify(data))
})
```

## 完整程式碼

### 資料夾結構

```python=
|
|--- app.js
|
|----html
|     |---index.html
```

### 前端
```html=
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <script text="text/javascript" src="https://js.tappaysdk.com/tpdirect/v2_2_1"></script>
    <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
    <title>Connect payment with TapPay</title>
</head>

<body>
    <div style="width: 480px; margin: 50px auto;">
        <label>CardView</label>
        <div id="cardview-container"></div>
        <button id="submit-button" onclick="onClick()">Get Prime</button>
        <pre id="result1"></pre>
        <pre id="result2"></pre>
    </div>
    <script>
        TPDirect.setupSDK(APP_ID, 'APP_KEY', 'sandbox')
        TPDirect.card.setup('#cardview-container')

        var submitButton = document.querySelector('#submit-button')
        var cardViewContainer = document.querySelector('#cardview-container')
        

        function onClick() {
            TPDirect.card.getPrime(function (result) {
                if (result.status !== 0) {
                    console.log('getPrime 錯誤')
                    return
                }
                alert('getPrime 成功')
                var prime = result.card.prime
                document.querySelector('#result1').innerHTML = JSON.stringify(result, null, 4)

                $.post('/pay-by-prime', {prime: prime}, function(data) {
                    alert('付款成功')
                    document.querySelector('#result2').innerHTML = JSON.stringify(data, null, 4)
                })
            })
        }
    </script>
</body>
</html>
```

### 後端

記得先執行以下 command
```shell=
npm install body-parser express
```

```javascript=
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const https = require('https');
const PORT = 8080

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use('/', express.static(__dirname + "/html")) //serve static content

app.post('/pay-by-prime', (req, res, next) => {
    const post_data = {
        "prime": req.body.prime,
        "partner_key": "PARTNER_KEY",
        "merchant_id": "MERCHANT_ID",
        "amount": 1,
        "currency": "TWD",
        "details": "An apple and a pen.",
        "cardholder": {
            "phone_number": "+886923456789",
            "name": "jack",
            "email": "example@gmail.com"
        },
        "remember": false
    }

    const post_options = {
        host: 'sandbox.tappaysdk.com',
        port: 443,
        path: '/tpc/payment/pay-by-prime',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'PARTNER_KEY'
        }
    }
    
    const post_req = https.request(post_options, function(response) {
        response.setEncoding('utf8');
        response.on('data', function (body) {
            return res.json({
                result: JSON.parse(body)
            })
        });
    });

    post_req.write(JSON.stringify(post_data));
    post_req.end();

})

app.listen(PORT, () => {
    console.log('Connet your webiste in the http://localhost:8080/');
})
```