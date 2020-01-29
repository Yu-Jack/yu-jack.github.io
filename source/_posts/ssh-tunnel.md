---
title: 關於 SSH Tunnel 連線 (SSH Proxy, SSH Port Forwarding)
categories: Development
date: 2019-01-08 22:02:33
tags: [ssh, Development, ssh tunnel]
header-img: /images/banner.jpg
catalog: true
---

這篇主要在介紹 SSH Tunnel 是什麼東西以及教學如何使用

<!-- more -->

## 使用情境介紹  

一般來說會使用到 SSH Tunnel 的其中一個情境會是這樣子的

這裡有兩台機器，分別為 A B
B 為重要的服務或是資料
A 為我們本身的主機，作為本地端開發時使用的 (開發會需要用到 B 的服務或是資料)

這時候我們總不能每一次在 A 把程式打完，就一次一次把程式放到 B 上面去跑
這件事實在是太麻煩了（汗
所以可以的話希望可以直接在 A 機器上面就能夠讀取到 B 的服務或是資料
這樣的話就能夠方便直接在本地開發
而要達成這件事情的方法就是透過 SSH Tunnel 的方式去達成

## SSH Tunnel 介紹

SSH Tunnel 在者裡面扮演的角色可以這樣思考

你在住家附近有一口水井，但你水井完全是沒有水可以取用
然後在距離很遠的地方有一個水庫，要喝水的必須到水庫取水並放回住家附近的水井
有一個作法就是，把水井和水庫之間挖一條通道，讓水庫的水直接導入到水井
這個`通道`就是我們 SSH Tunnel 扮演的角色

而用比較技術的說法的話，SSH Tunnel 就是做到了 Port Forwarding 的功用

## SSH Tunnel 使用方式

這邊主要會是用 Linux 原生指令 ssh 去完成 SSH Tunnel
在這之前我們先回想一下 ssh 連線的方式！

當已經有一台 server 上面跑著一個網頁的服務
而你可以透過以下指令 ssh 連線到那一台 server 上
`ssh root@127.0.0.1`
ssh 連線上去之後，上面有跑一個 Nginx 的服務在 80 port
這時候在 server 上執行 `curl localhost` 會發現有成功回傳 Nginx 的 Hello 頁面

此時如果你想要在自己的電腦上就能讀取這個網頁或是資料庫該怎麼辦?
這邊我們就要介紹 `-L` 這個 option 可以幫你達成這個目標！
Template: `ssh -L [local_port]:localhost:[remote_port] root@127.0.0.1` 

所以如果我要把 server 上的 80 port 網頁服務導入到本地端的 8080 port 該怎麼做呢?
可以使用以下這行指令
`ssh -L 8080:localhost:80 root@127.0.0.1`
然後在瀏覽器打開 http://localhost:8080 即可看到 server 上面的網頁！

接著又有另一種情境出現了
就是在 server 上要讀取 local port 的服務的時候該怎麼辦呢?
這裡就可以使用另一種相反的方式，也就是透過 `-R` 去達成
`-R` 簡單來說就是反過來，你可以把本地機器上的服務 port 導入到 server 讓他連線！
Template: `ssh -R [remote_port]:localhsot:[local_port] root@127.0.0.1`

舉例來說，在本地端起了一個 8080 port 的服務
如果要在 server 上 6666 port 讀取的話可以透過以下方式取得！
`ssh -R 6666:localhost:8080 root@127.0.0.1`

## 後記

最近還蠻常會使用到這個方式去連線，於是在這邊特別把它記錄下來
然而這種方式只是圖個方便，需要的時候做個 forwarding 而已