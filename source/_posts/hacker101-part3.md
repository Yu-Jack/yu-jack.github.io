---
title: Hacker 101 CTF Write Up Part 3 - Ticketastic Live Instance
categories: Security
date: 2019-09-08 22:28:20
tags: [CTF, security]
header-img: /images/banner.jpg
catalog: true
---

系列篇第三篇，目前題目寫下來都蠻有趣的  

<!-- more -->

# Ticketastic: Live Instance

根據題目總共有 2 個 Flag

## 0x00

一進來發現有兩個同樣名稱的題目，這邊先點上面的 DEMO 進去看看  
![](/images/ctf/part3-instance-1-01.png)

大概就是介紹，但最後發現一句特別的話『會有機器人來讀這些 ticket』  
不太明白這意思，先放著一邊繼續看看有什麼功能，裡面提到用 admin/admin 可以先登入  
![](/images/ctf/part3-instance-1-02.png)

登入後可以看到有一個 ticket 以及可以新建使用者  
![](/images/ctf/part3-instance-1-03.png)

點了 ticket 進去看了一下，提到說，如果處理錯誤的話會在這邊被標記起來  
看起來是使用者提供錯誤的連結的話，當機器人處理不了時會在這邊顯示提醒  
但這邊看起來沒什麼洞可以挖，繼續往下  
![](/images/ctf/part3-instance-1-04.png)

嘗試去建立使用者，發現可以建立成功  
![](/images/ctf/part3-instance-1-05.png)

另外還發現建立方式是用 GET 去建立  
這就有點微妙了，一般來說，像是使用 LINE 等等通訊軟體  
貼連結上去，都會預設去做 GET，然後把預覽顯示出來  
這邊也有可能走這種方式

這邊建立一個 ticket 嘗試看能不能用 GET 連結的方式去建立使用者  
但卻發現連結處理錯誤!?  
![](/images/ctf/part3-instance-1-06.png)
![](/images/ctf/part3-instance-1-07.png)

試著換另一個連結，依舊錯誤
![](/images/ctf/part3-instance-1-08.png)

想了非常久才想到，這應該是 SSRF 的一種利用  
於是把 payload 改成 localhost 的方式去探測能不能用內網方式新增使用者  
發現不再顯示錯誤連結！  
![](/images/ctf/part3-instance-1-10.png)
![](/images/ctf/part3-instance-1-11.png)

建立的使用者也能正確地登入！  
![](/images/ctf/part3-instance-1-12.png)

接著就把這個 Payload 帶到另一個題目，發現能夠登入！  
登入後發現第一個 FLAG  
![](/images/ctf/part3-instance-1-13.png)
![](/images/ctf/part3-instance-1-14.png)

## 0x01  

接下來發現連結上面有 id  
試著帶入單引號發現噴出 SQL Exception  
![](/images/ctf/part3-instance-2-01.png)

丟入 sqlmap dump 出 admin 的密碼就是 FLAG 了
![](/images/ctf/part3-instance-2-02.png)


