---
title: Single Sign On 實作方式介紹 (iframe & cookie)
categories: Security
date: 2020-04-06 10:05:21
tags: [Security, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

SSO 是 Sinsgle Sign On, 也就是單點登入  
簡單來說就是『我希望我在一個地方登入後, 在其他地方都不用再重新登入』  
透過實現 SSO 可以達到以下幾個好處  

1. 使用者只需要紀錄一套帳號密碼就可以在其他地方登入  
2. 開發新的系統時, 不需要重新實作登入系統, 直接用 SSO 機制就可以完成登入系統  

談論到 SSO 就會有 OAuth 出現  
但要注意的是, SSO 和 OAuth 是兩種不同的概念  
最重要的差別在於有沒有**第三方系統干涉**  

使用場景看看以下的例子  
SSO: 在公司內部系統上, 想要登入一次, 其他內部系統就不用登入也可以操作  
OAuth: 在電商平台 A, B 上, 我不想要重新註冊, 於是我直接用 Google 登入  
當然 OAuth 不止還有這樣的功能, 但這篇暫時不提  

那麼要如何實現 SSO 呢?  
實現 SSO 的概念有很多種做法, 相信有人會聽過用 CAS 去實作  
但這篇暫時還不會探討到 CAS 的實作方式  

而是先以 domain 的切入點去做講解  
我們先列舉不同情境, 而不同情境有不同實現方式  

## 同一個 second level domain

可以利用 cookie 的機制  
把 cookie 寫入到 second level domain 上  
這樣其他 third level domain 都可以同時存取到這個 cookie  

舉個例子來說  
在 test1.example.com 登入後, 把 cookie 寫入到 example.com  
屆時再 http://test2.example.com 也可以存取 example.com 的 cookie  
代表說 http://test2.example.com 也享有剛剛在 http://test1.example.com 登入後權利  

這種情況就很單純, 很適合用在應用都是在同一個網域下的狀況  
但現實情況通常不會這麼單純, 所以就會有不同 domain 的情況出現  

## 不同個 second or top level domain

這裡實作分成就有很多種方式了  
像是可以把 cookie 寫入到各個 domain 去  
又或是可以用 CAS or Oath 去實作  

### 把 Cookie 寫入到多個 domain 

這個方法說來弔詭  
我們先來說說 cookie 的機制, cookie 在 domain A 寫入的時候  
domain A 是不能寫入到其他 domain B, C 之類的地方  

假設在 http://test.example1.com 登入, 此時我能把 cookie 寫入到 example1.com  
但我卻不能把 cookie 寫入到 http://test1.example2.com  
所以我們會需要利用其他方式去寫入 http://test1.example2.com 的 cookie  

以下方式在 Chrome 80 **以後**必須要 https 才可以, 但 firefox 74 版本是可以用 http 的

第一種是利用 Get 的方式去發, 但設置 Cookie 時會需要 SameSite=None; Secure  
原因是 Chrome 在 80 版本之後對第三方 Cookie 有做限制, 可參考此[文章](https://medium.com/@azure820529/chrome-80-%E5%BE%8C%E9%87%9D%E5%B0%8D%E7%AC%AC%E4%B8%89%E6%96%B9-cookie-%E7%9A%84%E8%A6%8F%E5%89%87%E8%AA%BF%E6%95%B4-default-samesite-lax-aaba0bc785a3)

例如在 http://test.example.com 底下, 去發一個 get request 到 test.example1.com  
request 可以用以下方式去發  
```html
<img src="https://test.example1.com?cookieValue=123"/>
```
而在 http://test.example1.com 接收到 request 的時候, 就要把 cookie 給寫入  
```
// chrome + https
"Set-Header": "cookieValue=123; SameSite=None; Secure"

// firefox + http
"Set-Header": "cookieValue=123;" // SameSite 預設為 None, 但 firefox 可以不用 Secure
```

第二種方式可以利用 iframe  
但 iframe 會需要允許被嵌入,  iframe src 是 https://test.example1.com/iframe  
然後 iframe 裡面的內容為下, 發過去 request 之後, 由伺服器去 set-cookie  

set-cookie 的方式如同上面的設置方式
```html
<img src="https://test.example1.com?cookieValue=123"/>
```
從以上兩種方式可以發現, 如果要在"很多個"網域設置這種流程, 會是一件非常大的功  
因為你如果在 N 個 domain 要設置 cookie, 你就必須設置 N 個 iframe / img  去觸發 Request  
而刪除 cookie 的時候, 也需要一個 domain 慢慢刪除, 是一件非常麻煩的事情  

這裏 DEMO 一下 iframe 那種方式呈現的結果, 先介紹一下流程  
總共有兩個網站, 一個是 http://test1.example.com:2000 另一個是 https://d698d280.ngrok.io/  
目標就是要讓 http://test1.example.com:2000 的 cookie 也能夠註冊到 https://d698d280.ngrok.io/  

1. 首先到 https://d698d280.ngrok.io/ 這裡面是沒有任何一個 cookie
2. 接著進入到 http://test1.example.com:2000 會給我一個 cookie
    ```javascript
    res.setHeader("Set-Cookie", "a=this_is_test1.example.com;")
    ```
3. 接著我在 http://test1.example.com:2000 用以下 script 開啟一個 iframe  
    iframe src 為 https://d698d280.ngrok.io/ iframe  
    ```javascript
    var iframe = document.createElement("iframe")
    iframe.src = "https://d698d280.ngrok.io/iframe"
    document.body.append(iframe)
    ```
4. iframe 裡面會有一個接收 postMessage 的 function
    ```javascript
    window.addEventListener("message", function(event) {
        var img = document.createElement("img")
        img.src = "https://d698d280.ngrok.io?a=" + event.data.cookie
        document.body.append(img)
    })
    ```
5. 接著由 http://test1.example.com:2000 發送 postMessage
    並把 cookie this_is_test1.example.com 給 iframe
    ```javascript
    iframe.contentWindow.postMessage({cookie: document.cookie}, "https://d698d280.ngrok.io/iframe")
    ```
6. 當 iframe 裡面接收到 postMessage 之後 (第 4 步的 function), 會開啟一個圖片  
    帶著 query_string https://d698d280.ngrok.io/?a=this_is_test1.example.com  
    當 https://d698d280.ngrok.io/ 收到之後, 會把 a 取出來並且也設定 set-cookie  
    ```javascript
    let a = req.query.a.split("=")[1];
    res.setHeader("Set-Cookie", `a=${a}; SameSite=None; Secure`)
    ```
7. 此時在 https://d698d280.ngrok.io/ 的 cookie 裡面  
    會發現把從 http://test1.example1.com.com 來的 cookie 也寫到這裡面了

整個流程可以看看此影片呈現  
<video width="100%" controls><source src="/images/sso/cookie-iframe-postmessage.mp4" type="video/mp4"></video>

所以透過這種方式, 就可以把登入資訊也寫入到另一台 server  
這樣就能達到 SSO, 只是這方式好不好, 見仁見智  
也許小型網站適合 (2,3 個), 但因為機制上面還有一些安全疑慮要解決  
所以在使用的時候要想清楚流程去避免 cookie 被盜用還包含要如何進行驗證 (可以用 JWT)  
而比較好的方式是透過 CAS 去實作  
畢竟 CAS 已經算是有完整機制的實作方法, 安全性上還是相對安全  

這邊附上程式碼可以測試
> 如果要向筆者一樣, 可以更改 localhost 的 domain name  
> 必須去修改 /etc/hosts 底下的設定喔！

```javascript
// server A
const express = require("express")
const app = express()
app.get('/', (req, res) => {
    res.setHeader("Set-Cookie", "a=this_is_test1.example.com;")
    res.end(`
        <body>
        </body>
        <script>
            var iframe = document.createElement("iframe")
            iframe.src = "https://d698d280.ngrok.io/iframe"
            document.body.append(iframe)
        </script>
        <script>setTimeout(function(){
            iframe.contentWindow.postMessage({cookie: document.cookie}, "https://d698d280.ngrok.io/iframe")
        }, 2000)</script>
    `)
})
app.listen(2000);
```
```javascript
// server B
const express = require("express")
const app = express()
app.get('/', (req, res) => {
    let a = req.query.a.split("=")[1];
    res.setHeader("Set-Cookie", `a=${a}; SameSite=None; Secure`)
    res.end("testb")
})
app.get('/test', (req, res) => {
    res.end("test")
})
app.get('/iframe', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.end(`
        <body></body>
        <script>window.addEventListener("message", function(event) {
            var img = document.createElement("img")
            img.src = "https://d698d280.ngrok.io?a=" + event.data.cookie
            document.body.append(img)
        })</script>
    `)
})
app.listen(3000)
```

## 後記

先以不同 domain 的方式配合 cookie 讓大家知道 cookie 的受限程度  
接下來第二篇著重的重點在於不同 domain 下利用 CAS 去實現 SSO  

## Reference
1. [全面介绍SSO（单点登录](https://juejin.im/post/5de46d28e51d4532c21facb3)
