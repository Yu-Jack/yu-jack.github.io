---
title: 如何用 AWS API Gateway 和 Lambda 上傳和下載檔案 -- Part 1
categories: AWS
date: 2017-11-04 21:03:47
tags: [API Gateway, aws, lambda, upload file, download file]
header-img: /images/banner.jpg
catalog: true
---

這篇主要是記錄如何利用 AWS lambda 和 AWS API Gateway 做檔案的上傳以及下載
在 API Gateway 中要做幾項設定才有辦法達成
加上 Lambda 不能回傳『完整』的 binary 所以必須搭配 API Gateway mapping template 調整
這篇不會一步一步教學開 API Gateway 和 Lambda，只記錄重點部分
<!-- more -->


## API Gateway

主要調整得地方有兩個

1. /upload Integration Request
2. /download Integration Response

另外還有一種特別的方式，是利用 API Gateway 的 Binary Support 去處理
這種方式會列在最後面

### /upload Integration Request
1. 到 body mapping template 底下調整成圖片樣子(Generate templaye 選擇 "Method Request passthrough")

![](https://i.imgur.com/1vUOTvZ.png)

```javascript
// 需要修改的部分為第一行的 body
// 其他行不需要做調整
{
    "body": "$util.base64Encode($input.body)"
}
```

### /download Integration Reponse

1. 到 body mapping template 底下調整成圖片樣子
 
![](https://i.imgur.com/ZW32Fhb.png)
```javascript
$util.base64Decode($input.body)
```

## Lambda

主要是用 nodejs 去編寫處理上傳的部分

### Handle upload request

```javascript=
const multipart = require('parse-multipart');
exports.handler = (event, context, callback) => {
    // convert base64 string to binary
    const buffer = new Buffer(event.body, 'base64')
    const boundary = multipart.getBoundary(event.params.header['Content-Type'])
    const parts = multipart.Parse(buffer, boundary)
    return callback(null, {
        s: parts
    })
    
}
```

### Handle download request

這邊範例是用去讀取 S3 的檔案

```javascript=
exports.handler = (event, context, callback) => {

    s3.getObject({
        Bucket: 'your-bucket',
        Key: 'download_file.json'
    }, (err, data) => {
        if (err) {
            return callback(err)
        }
        // 原本方式是會直接回傳 JSON (DEMO 有圖)
        // callback(null, data.Body)
        // 
        // 正確方式，回傳 base64，然後讓 API Gateway 去 decode
        callback(null, new Buffer(data.Body).toString('base64'))
    })
}
```

## Demo with Postman


### Upload File

上傳要注意選 "form-data"
然後隨便選擇一個檔案即可

![](https://i.imgur.com/QhjRLH3.png)

### Download File


如果沒有在 API Gateway 做調整的話會變成
沒錯，Lambda 是會直接回傳 JSON 的
他並不會回傳 binary 給你，所以才要到 API Gateway 和 Lambda 做一些調整 (要到 mapping template 調整)

![](https://i.imgur.com/qFc5FZC.png)


修改之後

![](https://i.imgur.com/mijGJFI.png)

然後可以改用程式下載檔案

```javascript=
const request = require('request')
const fs = require('fs')
const r = request.post('your_url')
r.on('response', function (res) {
    res.pipe(fs.createWriteStream('download_file.json'))
});
```

## 額外補充 - Binary Support

### /upload integration request

在 API Gateway 底下的 binary support 加上 multipart/form-data，API Gateway 就會自動幫我們做 base64 encode

而在 mapping template 就改成這樣即可
lambda 不需要做任何調整

```javascript
{
    "body": $input.json('$')
}
```

## 註記

1. API Gateway payload 有限制 10mb
2. Lambda 有限制 6mb

所以最大只能上傳或下載 6mb 的檔案
但是，因為會轉成 base64，所以原本的 4mb 轉完可能變成 5mb
這裡是特別要注意的地方