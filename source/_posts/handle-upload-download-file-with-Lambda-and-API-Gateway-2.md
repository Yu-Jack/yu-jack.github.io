---
title: 如何用 AWS API Gateway 和 Lambda 上傳和下載檔案 -- Part 2
categories: AWS
date: 2017-11-15 01:03:47
tags: [API Gateway, aws, lambda, upload file, download file]
header-img: /images/banner.jpg
catalog: true
---

## 前言

這次記錄是介紹，只透過 AWS API Gateway 不加上 AWS Lambda 做檔案的上傳
上一篇因為 Lambda 的特性是 Request 和 Response 都要是 JSON
所以必須在 API Gateway 必須要做 body mapping 的調整 
e.g 透過 Binary Support 或是 Base64Enconde 的方式處理
那這次的紀錄是讓 AWS 的 API  Gateway 的 Upload 直接通往到後面的 Server 端
<!-- more -->

## AWS API Gateway 

在上一篇，透過 Lambda 和 API Gateway 完成檔案上傳和下載之後
出現了一個疑問，API Gateway 直接到 Server 這端，需不需要調整東西呢 ?

在這樣的想法下，做了一個簡單的實現
1. 在 API Gateway 新增一個 API /upload (POST Method)
2. 用 nodejs 啟動 server (記得把 body-parser 改成 text 也支援的設定)
在這樣的實驗之下，發現 Request 的 Content-Type 只有帶 multipart/form-data
並沒有帶後面的 Boundary，這樣會沒有辦法去 Parse 上傳的檔案或是 text
那會這樣的原因只會有一個，那就是 API Gateway 對我的 Headers 做了手腳

後來的解決方式，是把設定 API Gateway 為 Proxy，就可以讓 bounday 成功 pass 到後端 Server
那這後面就會介紹如何設定 API Gateway (基本上就只有一個地方，Integration Request & Integration Response)

### Upload

只要把 HTTP Proxy Integration 打勾即可，不用像上一篇要到其他地方做設定

![](https://i.imgur.com/xuGUHC1.png)

## Server 


### Upload 
```javascript=
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.text({type: '*/*'}))
app.post('/upload_file',  (req, res, next) => {
    console.log(req.body);
    console.log(req.headers);
    res.json({})
})
app.listen(8080)
```

## DEMO

### Upload

從上傳的地方會看到 content-type 最後面會出現 boundary
如果 API Gateway 沒有設成 Proxy 的話，是不會出現

不會出現的話，會沒辦法用 content-type 後面的 boundary 去 parse 檔案的
因為檔案之間會用 boundary 去區分，沒了這個就沒辦法識別傳了什麼上來

![](https://i.imgur.com/r4KL4RF.png)