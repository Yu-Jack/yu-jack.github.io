---
title: CloudFront 設定 Header Forward
categories: AWS
date: 2018-09-05 14:26:10
tags: [CloudFront, cookie, query string, header, aws]
header-img: /images/banner.jpg
catalog: true
---

最近在使用 CloudFront Header forward 的設定
CloudFront 預設會把 `User-Agent` 這個 header 替換成 `Amazon CloudFront`
於是開始研究起要怎麼把原始的 User Agent 完整的帶到 Origin 去

<!-- more -->

但由於 CF 上面的設定寫的不是很清楚
於是發現以下這篇 [AWS 官方文章](https://aws.amazon.com/blogs/aws/enhanced-cloudfront-customization/)
這裡直接做一個總結

1. None: 使用 CloudFront 原生的行為 (例如替換 `User-Agent`)
2. Whitelists: 把 whitelists 裡面的參數，**完整不動** 的 Forward 到 Orign 去使用
3. ALL: 把所有參數都 forward 到 Origin 去

下面是一個 whitelist 的簡單範例

![](https://i.imgur.com/Dy57usH.png)

以這張圖的設定的來說，代表 `User-Agent` 不會被 CloudFront 給自動替換掉
而是會拿原生`User-Agent`直接 forward 到 Origin 去

另外這邊要提醒，Cloudfront 預設是不會 Forward Headers, Cookies 和 Query String 的
這邊要特別注意，要特別設定才可以
那至於 Cookie 以及 Query String 的設定看上面就明瞭了
