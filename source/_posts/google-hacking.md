---
title: Google Hacking
categories: Google
date: 2017-10-17 00:02:20
tags: [google hacking, search]
header-img: /images/banner.jpg
catalog: true
---

這次要跟大家介紹一下 Google 到底有多好用
相信用過 Google 都知道，Google 的搜尋很方便
但是你知道，Google 還有提供除了關鍵字搜尋以外的各種神奇的搜尋方式嗎 ?

<!--more-->

下面這張表就是 Google 提供的各種搜尋技巧
先用幾個來讓大家了解如何使用這個方便的技巧吧！

![](https://i.imgur.com/MesRgnG.png)

## site:

假設我想要搜尋我這個網站的，光靠關鍵字搜尋是很難搜尋到的
排名不高，曝光度也不高更是難上加難
但是可以透過以下的方式搜尋到
```
site:yu-jack.github.io
```

![](https://i.imgur.com/2bsJgih.png)


## intitle:

intitle 就是搜尋 title 呈現的文字
我們可以搜尋一個有趣的東西 "Index Of"

```
intitle:"Index Of"
```

可以發現搜尋到一些看起來很像目錄的東西
這個代表這個網站的開發者，沒有適當的處理這個問題
這樣會導致網站的所有目錄曝光在公眾之下
裡面是什麼，我就不點了，有興趣可以試試看

![](https://i.imgur.com/fDyTRKE.png)


## inurl:
inurl 就是搜尋 url 之中有沒有包含這個字串
我用以下方式搜尋的話
```
inurl:login 
```
就會發現一堆 url 包含 login 的網址出現

![](https://i.imgur.com/NJqZNLB.png)


## filetype
filetype 會去搜尋副檔名，但是他不能單獨使用
必須跟其他指令混在一起使用

```
inurl:ntust filetype:pdf
```

![](https://i.imgur.com/7hN7xmQ.png)


## 結論

這邊做了一點簡單的介紹而已，並沒有作太多詳細介紹
但是可以參考以下的 PDF 去觀看更多不同的技巧 
[Google Hacking for Penetration
Testers](https://ephrain.net/wp-content/uploads/2016/08/BH_EU_05-Long-1.pdf)

下面這個是公開搜尋 keyword，也許可以直接搜尋到別人不想讓你看到的東西
[Google Hacking Database](https://www.exploit-db.com/google-hacking-database/)

介紹就到這邊，以後有空會再回來把這篇補詳細