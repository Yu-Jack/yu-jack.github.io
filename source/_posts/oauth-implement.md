---
title: OAuth 2.0 介紹以及實作
categories: Security
date: 2020-04-27 10:05:21
tags: [Security, SSO, OAuth, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

這篇文章會注重在 OAuth 2.0 的介紹  
OAuth 1.0 和 2.0 的差別其實蠻大的, 對角色的定義也有所不同  
OAuth 1.0 和 OAuth 2.0 的差別詳細可以看這篇文章 [OAuth 1.0，1.0a 和 2.0 的之间的区别有哪些？](https://www.zhihu.com/question/19851243)  

> 基本上 2.0 就是對 1.0 的角色重新定義  
> 簡化 1.0 的複雜流程, 以及強化 1.0 面臨到的安全問題  
> 但本質上的目的都是一樣, 並無改變  

## 角色介紹

我們先定義會參與 OAuth 2.0 流程中的所有角色  
為了不讓 OAuth 2.0 定義偏掉, 所以這邊部分名詞定義皆會用原文去表示  
先給予大前提, Client 代表的不是使用者, 而是應用程式 (購物網站等等)  

- **Resource Owner** - 授權 Client 去取得 Resource Server 裡面存放的 Protected Resource, 也就是使用者本身 (end-user, 也稱終端使用者)
- **Resource Server** - 存放 Protected Resource 的伺服器，可以接受來自 Client 透過 Access Token 發出的請求。
- **Client** - 代表 Resource Owner 去存取 Protected Resource 的應用程式. 像是各大購物商城的網站或是 APP
- **Authorization Server** - 認證過 Resource Owner 並且 Resource Owner 許可之後，核發 Access Token 的伺服器
- **Access Token -** 獨一無二的識別號碼, 被 Client 帶在 Request 上, 並到 Resource Server 取得 Protected Resource

> Resource Owner 和 Authorization Server 可以是同個伺服器, 也可以是不同伺服器

## 流程介紹

那我們就先用上面的名詞和角色來看看一個流程  

Jack (Resource Owner) 最近上傳了去度假的照片 (Protected Resource) 到 photos.example.net (Resource Server)  
Jack 希望可以利用 printer.photos.net (client) 去列印上傳的照片  

要取得照片, 勢必需要使用 Jack 的帳號密碼去登入  
但 Jack 不希望讓 printer.example.com 知道帳號密碼  

於是 printer.example.com (client) 為了提供更好的服務  
去向 photos.example.net (Resource Server) 申請 OAuth 的服務  
photos.example.net (Resource Server) 提供 photos.example.net (Authorization Server) 給 client  

> 這邊 Resource Server 和 Authorization 是同一台喔  

當 printer.example.com (client) 要求 Jack 登入時  
會把 Jack 導到 photos.example.net (Authorization Server) 去進行登入  

當 Jack 登入成功, 並按下 Approve 時  
photos.example.net (Authorization Server) 會核發一組暫時的 Grant Code  
並把 Jack 導回到 printer.photos.net (client)  

此時 printer.example.com (client) 透過 Grant Code 向 photos.example.net (Authorization Server) 取得 Access Token  
printer.example.com 就可以存取 Jack 在 photos.example.net (Resource Server) 上的照片 (Protected Resource)  

> Grant Code 可以想像是去銀行排隊的時候拿的號碼牌  
> 拿著號碼牌到相對應的櫃檯, 櫃檯會給予服務, 同時號碼牌就也失去了效用  
> 此櫃檯給予的服務可以對應到 OAuth 的流程中, 也就是核發 Access Token  

上述流程畫成圖的話, 如下  
![OAuth 2.0 流程](/images/oauth/oauth-flow.png)

上面的流程就是 OAuth 2.0 的大致流程  
在核發 Grant Code 以及後續的 Access Token  
是屬於 OAuth 2.0 Grant Flows 的四項其中之一的 Authorization Code Grant Flow  

接下來的實作也會以此 Grant Flows 去實作  
其他 Grant Flows 可以參考[四種內建授權流程](https://blog.yorkxin.org/2013/09/30/oauth2-1-introduction.html)

## 簡易實作

這裡就借用上一個 CAS 專案來進行修改 XD  
流程有了準備可以開始實作 OAuth 2.0, 但在實作前要先定義出目標和角色  
專案在 Gituhb 可以下載 [OAuth Example](https://github.com/Yu-Jack/oauth-example)  

### 實作目標以及各需求角色的目的

以使用者角度來說 (使用者是不會知道什麼是 OAuth)  

* 『我希望在列印圖片的網站, 可以列印我上傳在照片雲端管理服務的照片  
    但我不想在列印圖片的網站進行登入並讓它知道我的帳號密碼』

以列印圖片的網站開發者來說  

* 『我希望當使用者透過 OAuth 登入後, 我可以去取得使用者上傳在 OAuth 提供商的照片』

以 OAuth 提供商 (照片雲端管理服務) 來說  

* 『我能夠提供使用者進行上傳照片, 且可開放 OAuth 登入讓第三方應用程式讀取使用者的照片』

### 各角色以及專案詳細資料  

各需求角色對應到 OAuth 2.0 角色如下  

1. client - 列印圖片的網站
2. resource owner - 使用者本身
3. resource server - 使用者上傳照片的地方 (OAuth 提供商)
4. authorization server - OAuth 提供商的授權伺服器
5. protected resource - OAuth 提供商裡面的使用者信箱和照片

接下來專案會分成兩個資料夾去進行程式開發  

1. client → http://printer.example.com:4000
    - 用 node + vue 建立列印(可讀取)圖片的網站, 可以點選使用 OAuth 登入
2. resources_server → http://photo.example.net:3000
    - 用 node + vue 建立的網站, 使用可以上傳照片, 並讓 client 透過 Access Token 存取使用者上傳的照片
    - 建立登入頁面, 讓 resource owner 登入, 並核發 Grant Code 給第三方應用程式  
        再讓第三方應用程式拿著 Grant Code 來取得 Access Token

### 啟用方式

啟用流程如下, 特別要注意的是要設定 `/etc/hosts` 哦  
如果都在同一個 localhost 下面, 這樣 cookie 會錯亂  

1. `npm install or yarn`
2. `npm run build`
    這裡只有一個 webpack 檔案, 會去 build 兩個不同網站的 vue source code
3. `node client/server.js`
4. `node resource_server/server.js`
5. 設置 /etc/hosts
    ```
    127.0.0.1 printer.example.com
    127.0.0.1 photo.example.net
    ```

### 使用流程

啟用成功後, 使用流程如下

1. 打開  http://printer.example.com:4000 並點選 Go OAuth
2. 此時會被跳轉到 http://photo.example.net:3000  進行登入 (username: 123, password: 123)
3. 成功後會被跳回去 http://printer.example.com:4000  後, 就可以瀏覽相片 (但此時沒有)
4. 另外開啟分頁打開 http://photo.example.net:3000/
原本是需要登入的, 但因為剛剛 OAuth 的時候已經登入過, 所以可以直接進入到上傳圖片的頁面
5. 開始上傳圖片, 出現上傳成功時, 回去 http://printer.example.com:4000 按下重整就可以看到剛剛上傳的圖片

## 影片 Demo

<video width="100%" controls><source src="/images/oauth/oauth-flow.mp4" type="video/mp4"></video>

## 後記

這邊就不詳細解釋程式的流程了, 因為發現寫一寫太多 XD  
畫面就留給他醜醜的 (有時間再回來美化 XD  
其他有興趣的再自己去看程式囉  