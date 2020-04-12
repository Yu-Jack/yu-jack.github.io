---
title: Single Sign On 實作方式介紹 (CAS)
categories: Security
date: 2020-04-20 10:05:21
tags: [Security, SSO, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

CAS 全名是 Central Authentication Service  
一個獨立的認證服務, 概念是在使用服務之前  
如果是沒有登入的使用者, 會先被跳轉到認證服務的地方進行登入  
登入成功之後就會被導回去原本使用服務的頁面  

題外話, 這裡的英文 Authentication 是有含義所在的  
代表判斷使用者是不是他所宣稱的人, 通常會透過使用帳號密碼或是郵件等等方式進行<span style="color: red">認證</span>  
而認證成功後, 有沒有被<span style="color: red">授權</span>存取服務的權限則是另一個單詞 Authorization  
通常代表, 判斷使用者有沒有權限可以存取資源,  例如要修改個人資料有沒有權限等等  

## 角色

在介紹流程之前, 先定義四個角色  

1. 使用者: 就是我們使用者  
2. 應用服務 A : 使用者必須要登入後才能使用的 A 服務 (AP 1)  
3. 應用服務 B : 使用者必須要登入後才能使用的 B 服務  (AP 2)
4. CAS Server:  使用者被導轉到需要輸入帳密登入的地方  

## 第一次登入使用 A 流程

1. 使用者開啟應用服務 A 的頁面, 但使用者尚未登入獲得認證  
2. 使用者被導轉到 CAS Server 的登入頁面  
3. 使用者在 CAS Server 進行登入  
4. 使用者登入成功之後, CAS Server 會寫入一個 cookie 在 CAS Server 的網域下並產生 session   
5. 使用者被導轉到應用服務 A 頁面, 此時導轉網址的 Query String 會有剛剛 CAS Server 寫入的 cookie 資料  
6. 應用服務 A 拿著剛剛的 cookie 資料, 送往到 CAS Server 進行驗證  
7. 驗證成功, 生成自己的 cookie & session 給這個客戶使用  
8. 接著進行登入成功的頁面, 開始使用服務 A  

![Case A](/images/sso/case-01.png)

## 第二次登入使用 B 流程

1. 使用者開啟應用服務 B 的頁面, 但使用者尚未得到應用服務 B 的認證  
2. 使用者被導轉到 CAS Server  
3. 此時因為在第一次登入 CAS Server 已經寫入 cookie CAS Server 的網域  
    當使用者被轉到 CAS Server 後, CAS Server 會取得此使用者的資訊  
    就知道此使用者已經登入過, 所以不需要重新登入  
4. 此時 CAS Server 把使用者導回應用服務 B 上  
5. 導轉到應用服務 B 的時候, 此時導轉網址的 Query String 會拿到 CAS Server 的 Cookie 資料  
6. 應用服務 B 拿著剛剛的 cookie 資料, 送往到 CAS Server 進行驗證  
7. 驗證成功, 應用服務 B 生成自己的 cookie & session 給這個客戶使用  
8. 接著進行登入成功的頁面, 開始使用服務 B  

![Case B](/images/sso/case-02.png)

> 為何要驗證 ticket 是因為導轉回來的 query string 是可能被更改的  
> 所以要先確保回來的 ticket 真的是 CAS Server 給的, 而不是哪一個駭客幹的  
> 在 DEMO 專案裡面, 每一段我都有加上 checksum  
> 這是為了保證這一定是 CAS Server 傳送的 (達到資料一致性)  

## 實作 CAS 流程

講完流程就要來用程式實作整體流程  
先附上個人撰寫的 [CAS 測試專案](https://github.com/Yu-Jack/cas-example)(Node.js 版)  
可以到 github 去 clone 下來玩玩  
為了練習點英文, 所以那專案的 README 是用英文寫, 寫不好請見諒 XD  

### Workflow 快速介紹

這裡在快速把流程帶過一次  

在第一次使用 AP1 的時候, 點了 login url 之後會被導轉 CAS Server  
此時會進行登入, <span style="color: red">需要進行帳號密碼驗證</span>, 登入成功後會進入到 AP1 manager 頁面  

此時進入到 AP2, 點了 login url 是先被導轉到 CAS Server  
但因為 CAS Server 有辦法識別此 cookie 是已經登入過  
所以<span style="color: red">不用再驗證帳號密碼</span>，接著被導轉到 AP2 manager 頁面  
原因是, 我已經登入過了, 就不用再登入了  

下面會針對 AP Server 和 CAS Server 的重點程式碼進行說明  

### AP Server 機制

進到 AP 的登入頁面後, 裡面會有一個 url, 點了就會被跳轉到 CAS Server  
但因為你要告訴 CAS Server 你是從哪邊跳轉過來的, 這樣登入成功後 CAS Server 才有辦法把你跳轉到原本的頁面  
所以會需要附上 URL, 這邊為了安全機制有加上 checksum, 不然輸入任何網址 CAS 都會跳轉過去喔！  

```javascript=
// ap server nodejs code, 這裏採用 ejs 模板去渲染頁面, 頁面的程式碼看下面那段 ejs
app.get('/', (req, res) => {
    res.render("ap1_index", {
        checksum: getHmac(URL),
        serviceUrl: URL
    })
})
```

```html=
<!-- ap server render ejs 的頁面, 也就是 ap 的登入頁面 -->
<h1>this is AP1</h1>
<% let url = "http://test.cas-example.com:3000/?checksum=" + checksum + "&serviceUrl=" + serviceUrl; %>
<a href=<%= url %>>go to login <%= url %> </a>
```

接著成功登入 CAS 之後, AP 會需要重新拿著 CAS 給的 ticket 去驗證此人是否真的存在  
這邊 status = 200 代表成功, 如果檢測成功, 就會跳轉到 managr 頁面就完成登入了  

> 這裏的 ticket 可以想像是登入成功後的一組識別碼  
> 就像去飲料店買飲料拿到的號碼牌一樣, 用此號碼牌就可辨別是誰買的飲料  
> 在這邊的號碼牌就是辨別誰已經登入成功  

```javascript=
// ap server nodejs code
// 去向 CAS Server 驗證此 ticket 是否有效
const response = await axios.post("http://test.cas-example.com:3000/verify", {
    ticket,
    checksum: getHmac(ticket),
}).then((response) => response.data);
if (response.status === 200) {
    req.session.login = true;
    return res.redirect("/manager");
}
```

而 AP 的 manager 頁面也要做點限制, 除了認證成功以外的就不允許進到這頁面  
```javascript=
// ap server nodejs code
app.get('/manager', (req, res) => {
    if (!req.session.login) {
        return res.redirect("/failed");
    }
    res.render("ap1_manager")
});
```

### CAS Server 機制

剛剛提到 AP 會帶著需要告訴 CAS 結束後要跳轉回來的地方  
下面那段程式可以看到資訊正確的話, 最後會 redirect 到 serviceUrl  
這個 serviceUrl 就是 AP 提供的  
而其他 session 部分就是為了保存下次同樣使用者再來的時候, 就會被判定早已登入過  
```javascript=
// CAS Server nodejs code
// 登入成功執行此段程式碼的最後一段, 就會被跳轉回去當時 AP 提供的 serviceUrl
if (username !== "123" && password !== "123") {
    return res.redirect("/bad")
}
req.session.login = true;
req.session.userInfo = {};
const ticket = require("randomstring").generate(10);
DB.set(ticket, serviceUrl);
req.session.userInfo[serviceUrl] = ticket;
res.redirect(`${serviceUrl}?ticket=${ticket}&checksum=${getHmac(ticket, serviceUrl)}`)
```

下面這段 code 就是當使用者被判定登入過的話, 就可以給一個 ticket 然後就直接跳轉過去  
而<span style="color :red">不需要再去判斷 username 和 password 是否正確</span>  
```javascript=
// CAS Server nodejs code
if (req.session.login) {
  if (req.session.userInfo.hasOwnProperty(serviceUrl)) {
      const ticket = req.session.userInfo[serviceUrl];
      return res.redirect(`${serviceUrl}?ticket=${ticket}&checksum=${getHmac(ticket, serviceUrl)}`)
  }

  const ticket = require("randomstring").generate(10);
  DB.set(ticket, serviceUrl);
  req.session.userInfo[serviceUrl] = ticket;
  return res.redirect(`${serviceUrl}?ticket=${ticket}&checksum=${getHmac(ticket, serviceUrl)}`)
}
```

重點程式碼就介紹到這篇, 剩下的可以直接 clone 我的 [CAS 測試專案](https://github.com/Yu-Jack/cas-example)(Node.js 版) 玩玩看  
至於其他程式碼就是做一些保護機制、錯誤訊息顯示簡單的 DB  
讓在執行流程順暢以及比較知道執行時到了哪一個步驟  

## DEMO

<video width="100%" controls><source src="/images/sso/cas-example.mp4" type="video/mp4"></video>

## 後記

在現實使用狀況上, 還需要考量各種狀況和安全機制  
而且現實使用上除了要加上 https, cookie 也要設成 httpOnly Secure 去防止駭客竊取  
這部分就要花費蠻多功去討論, 就留給未來看哪天會寫寫這個主題 XD  
