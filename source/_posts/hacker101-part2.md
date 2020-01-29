---
title: Hacker 101 CTF Write Up Part 2 - Micro-CMS v1, Petshop Pro
categories: Security
date: 2019-09-06 21:28:20
tags: [CTF, security]
header-img: /images/banner.jpg
catalog: true
---

系列篇第二篇，Micro-CMS v1 還因為玩壞掉我重開了快二十次才可以開來玩 QQ  

<!-- more -->

# Micro-CMS v1

根據題目總共有 4 個 Flag

##  0x00  
打開頁面後頁面是
![](/images/ctf/part2-cms-v1-1-01.png)

試著建立 post 試試看
![](/images/ctf/part2-cms-v1-1-02.png)

發現有 XSS 跳出來，但打開原始碼沒發現什麼變化
![](/images/ctf/part2-cms-v1-1-03.png)

按了 Go Home 會去上一頁就跳出 FLAG 了
![](/images/ctf/part2-cms-v1-1-04.png)

##  0x01  
因為跳出 xss 的時候注意到 page 後面的 id 帶的是 8  
覺得很疑惑，因為總共才三筆資料，id 怎麼會是 8?  
![](/images/ctf/part2-cms-v1-2-01.png)

於是就 8 7 6 回去一個一個看看是不是有什麼玄機  
發現 id 是 6 的時候，出現了 forbidden 的字樣，寫著不可讀  
![](/images/ctf/part2-cms-v1-2-02.png)

竟然不可讀的話，試著加上 edit 發現可以編輯，且內容有 FLAG
![](/images/ctf/part2-cms-v1-2-03.png)

##  0x02  
接下來就試著對每一個頁面的 id 做 SQL Injection  
發現在 edit 的頁面狀況下，id 會有 SQL Injection  
於是就跳出 FLAG 了  
![](/images/ctf/part2-cms-v1-3-01.png)

##  0x03  
這個漏洞我找非常非常的久  
才發現原來的 `<svg/onload=alert('xss')` payload 是跳不出 FLAG 的  
要用 `<img src="" onerror="javascript:alert('xss')"/>` 才跳得出來  
![](/images/ctf/part2-cms-v1-4-01.png)
![](/images/ctf/part2-cms-v1-4-02.png)

打開原始碼發現 FLAG 就藏在下面  
第一張是 `img` tag 的原始碼  
第二張是 `svg` tag 的原始碼  
兩個都可以觸發 xss，但只有 `img` 有 FLAG  
不知道為何 `svg` 那一個 payload 不能觸發  
可能是這題的解答，有希望某一些固定的 tag 去寫  
才會造成 `svg` payload 跳不出 FLAG  
![](/images/ctf/part2-cms-v1-4-03.png)
![](/images/ctf/part2-cms-v1-4-04.png)

# Petshop Pro

根據題目總共有 3 個 Flag

##  0x00  

進去之後頁面長這樣
![](/images/ctf/part2-pet-0-01.png)

按下 Add to Cart 之後
![](/images/ctf/part2-pet-0-02.png)

在按下 checkout
![](/images/ctf/part2-pet-0-03.png)

看來是一個結帳流程，講到錢就想來試試看能不能 0 元結帳  
看了一下 source code 發現有一個 hidden input
![](/images/ctf/part2-pet-0-04.png)

並且用 javascript 把價格更改成 0 元後送出
![](/images/ctf/part2-pet-0-05.png)

送出後價格為 0 元且拿到 FLAG
![](/images/ctf/part2-pet-0-06.png)

##  0x01  

透過 nmap 找到登入點為 `/login` 之後  
![](/images/ctf/part2-pet-1-01.png)

稍微試著輸入單引號看看會不會有 SQL Injection 問題，結果沒有 QQ  
但因為輸入 username 的時候，輸入錯誤會爆出 **Invalid username**  
![](/images/ctf/part2-pet-1-02.png)
代表說此系統設計方式，如果輸入正確的 username 的話，應該不會爆出這個錯誤  
根據以上邏輯先寫出第一版程式找找看 username  
{% gist e49a273bd60048ffbcd0ddf99c4f5196 brute_username.js %}

找到 username 後輸入，的確變成 **Invalid password**  
那就繼續找密碼
![](/images/ctf/part2-pet-1-04.png)
![](/images/ctf/part2-pet-1-03.png)

接下來用一樣的方式找到密碼
![](/images/ctf/part2-pet-1-05.png)
{% gist ec81363f36c5d82438d5388e95266bb7 brute_password.js %}

登入成功，出現 FLAG!
![](/images/ctf/part2-pet-1-06.png)

##  0x02  

登入後發現可以編輯商品
![](/images/ctf/part2-pet-2-01.png)
![](/images/ctf/part2-pet-2-02.png)

試著輸入 xss payload，跳出 xss，但打開原始碼沒發現任何東西
![](/images/ctf/part2-pet-2-03.png)

試著加入購物車發現，也會跳出 xss
![](/images/ctf/part2-pet-2-04.png)

打開原始碼發現 FLAG!
![](/images/ctf/part2-pet-2-05.png)