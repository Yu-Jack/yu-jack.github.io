---
title: Ngrok - Connect to your localhost!
categories: tool
date: 2017-11-08 21:17:43
tags: [ngrok, localhost]
header-img: /images/banner.jpg
catalog: true
---

今天要介紹的是一個非常好用的東西，可以直接讓大家都連到你的 localhost
這樣做完一個網站，你也不用特地部署，可以直接透過這個工具，大家都能連到

<!-- more -->

工具連結在此: [Ngrok](https://ngrok.com/)

## 使用方式簡單介紹

下載下來後，`unzip` 之後就可以做使用了
如果在 localhost 開了一個 8080 想讓大家連
可以在下這以下這行指令

```
./ngrok http 8080
```

結果會長這樣，然後在網址列打上他給你的網址就可以直接連到你的 8080 port 
![](https://i.imgur.com/9wgzJP7.png)

如果像是要用到 Apple Pay 一些特定服務只允許跑在 SSL 上面的話
這個工具會非常有用，但畢竟是經過別人家重導 .... 所以小心用