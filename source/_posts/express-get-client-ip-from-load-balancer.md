---
title: 如何從多層 Load Balancer / Nginx 取得使用者正確的 IP?
categories: Security
date: 2020-01-09 00:30:25
tags: [express, x-forwarded-for, ip, nginx, architecture]
header-img: /images/banner.jpg
catalog: true
---

## 前言

我們有時候要取得使用者 IP  
往往都會用最簡單的方式取得 IP  
以 express 為例子，會使用 `req.connection.remoteAddress` `req.ip` 等等方式取得 IP  
但你知道，當伺服器被多層的 Load Balancer 保護在前面的時候  
取得到的 IP 會是 Load Balancer 的嗎?  
而真正的 IP 會被 Load Balancer 放在 `X-Forwarded-For` 上面，傳遞到後面伺服器  
如果不知道的話，那這邊文章有可能會幫助到你  

<!-- more -->

接下來會以 AWS 的 Load Balancer 以及伺服器上建立一個 Nginx 服務  
然後還有一個 express server 服務來說明  
從無 Load Balancer 到雙層 Load Balancer 的架構下分別該如何取得 IP

## Direct Connection

架構示意圖如下  
![](/images/aws/aws-get-ip-01-arch.png)

當我們連線時直接連到伺服器時
可以透過 express 的 `req.connection.remoteAddress` 取得到使用者的 IP (233.x.x.x)  
原因是此時的呼叫者是使用者  

![](/images/aws/aws-get-ip-01.png)

## 單層 Load Balancer

架構示意圖如下  
![](/images/aws/aws-get-ip-02-arch.png)

當我們遇到只有一層 Load Balancer 時  
透過 express 的 `req.connection.remoteAddress` 會取得到的
是 Load Balancer 的 IP (10.x.x.x, 圖中最下面)  
原因是 Load Balancer 作為中介者，取得到了 Rqeuest 之後  
會再往後端伺服器轉發，這時候呼叫者就是 Load Balancer 而不會是使用者  
使用者真正的 IP 是會放在 header 的 `X-Forwarded-For` 上面 (233.x.x.x)   
> 這邊 Load Balancer 可以是 Nginx，但這邊我們用 AWS Load Balancer 做 DEMO  
> 原因是我們後面會需要架構出兩層 Load Balancer 的狀況

![](/images/aws/aws-get-ip-02.png)

## 雙層 Load Balancer

架構示意圖如下  
![](/images/aws/aws-get-ip-03-arch.png)

而當我們再加上一層 Load Balancer 的時候 (這裡用 nginx 代替)  
透過 express 的 `req.connection.remoteAddress` 會取得到的是 Nginx 的 IP  
因為呼叫者從上一個案例的 Load Balancer 變成了 Nginx  
而我們這邊 Nginx 是架設在 localhost 裡面，所以可以看到 IP 是 127.0.0.1 (圖中最下面)  
那前面 Load balancer 的 IP 就被放到 X-Forwarded-For 上面去了 (10.x.x.x 那個)  

![](/images/aws/aws-get-ip-03.png)

## 雙層 Load Balancer + 惡意 X-Forwarded-For

架構示意圖如下  
![](/images/aws/aws-get-ip-04-arch.png)

狀況如同前面的 Case，但這邊唯一不一樣的是  
萬一使用者自己在 X-Forwarded-For 加了 `X-Forwarded-For: 5.5.5.5, 6.6.6.6`  
這些資料是會被放到 X-Forwarded-For 最前面去的  
所以在取得 IP 的時候要特別注意並不是取得 X-Forwarded-For 的第一個就可以了  
應該要根據你前面放了多少個 Load Balancer 去決定要拿***從後面數過來的第幾個***才是正確的  

![](/images/aws/aws-get-ip-04.png)

## References

其他還有很多詳細的介紹，非常推薦看以下這篇文章，大推！
1. https://devco.re/blog/2014/06/19/client-ip-detection/
