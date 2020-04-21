---
title: OAuth 是什麼? 跟 SSO 有什麼關係或差別?
categories: Security
date: 2020-04-13 10:05:21
tags: [Security, SSO, OAuth, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

OAuth 和 Single Sign On (SSO) 的概念不仔細研讀, 還真的不好分出這之間的差別  
這篇會針對它們之間的差別進行解釋  

## 正文

我們先看看 RFC 上面對於 OAuth 以及 SSO 的解釋是什麼 (擷取部分內容)  

### OAuth

OAuth 1.0 和 OAuth 2.0 的本質解決的問題上是一樣的  
但在對角色和細節流程上面的定義不大一樣  
這會到 OAuth 2.0 實作的文章時稍微提到一些大體差別  

這邊就針對 OAuth 2.0 去進行簡單介紹  
在 RFC 上面對於 OAuth 2.0 的定義如下  

> The OAuth 2.0 authorization framework enables a third-party  
> application to obtain limited access to an HTTP service, either on  
> behalf of a resource owner by orchestrating an approval interaction  
> between the resource owner and the HTTP service, or by allowing the  
> third-party application to obtain access on its own behalf.  

簡單來說, OAuth 能夠讓第三方應用程式去取得使用者的資料  
舉例來說就是 Google 製作了 OAuth 服務讓 PChome (第三方) 能夠取得使用者在 Google 上面的資料  

這邊有三個重要的地方  

1. authorization (授權)  
2. third-party application (第三方應用程式)  
3. approval interaction between the resource owner and the HTTP service  

Authorization 是一種授權的概念, 也就是當你登入成功之後, 你被賦予了可以使用多少服務的權限  
所以 OAuth 是一種<span style="color: red">授權</span>框架, 它可以授權其它第三方應用程式取得使用者資料  
當然還是要經過使用者允許之後 (approval interaction), 才會授權給第三方取得使用者的資料  

> 這在 OAuth 1.0 以及 OAuth 2.0 裡面都是一樣的  

### SSO

在 RFC 上面對於 SSO 的定義蠻有趣的, 它是直接給例子 XD  

> Bob has an account in an application hosted by a cloud service  
> provider SomeCSP.  SomeCSP has federated its user identities with a  
> cloud service provider AnotherCSP.  Bob requests a service from an  
> application running on AnotherCSP.  The application running on  
> AnotherCSP, relying on Bob's authentication by SomeCSP and using  
> identity information provided by SomeCSP, serves Bob's request.  

簡單翻譯一下, Bob 有一組帳號密碼是在 SomeCSP 這個服務底下  
此時 Bob 使用一個在 AnotherCSP 服務底下的應用程式  
這個應用程式要透過 SomeCSP 去<span style="color: red">認證</span>此使用者的身份接著才能使用 SomeCSP 提供的身份資料去服務 Bob  

夠冗長了吧 XD  
這邊就在幫它簡化一下, 也就是說 Bob 想要使用 AnotherCSP 的服務時  
必須先透過 SomeCSP 進行登入<span style="color: red">認證</span>才能使用  

這裡有一個重點, 就是 authentication (認證)  
當你拿著帳號密碼來登入的時候, 此時就是在做認證, 確認是不是真的是你  

### 小總結  

這兩個東西的重點是不一樣的, 一個在於授權, 一個在於認證  

OAuth 是一種授權框架, 而不是認證框架  
SSO 是一種認證的方式, 而不是授權的方式  

認證: 使用者拿著帳號密碼去登入網站, 這叫做認證  
授權: 使用者登入後, 開始依照本身的權限去操作, 這叫做授權  

## 舉例  

接著我們用更貼近生活的例子再次解釋一次這兩種概念  

### SSO 例子

今天我在 Google 日曆登入我的帳號  
但使用完日曆之後, 我想先去收個 Gmail, 這時候會發現我並不用重新登入, 而是可以直接使用 Gmail  
原因是這兩個服務的帳號密碼其實是一樣, 再透過 Google 的 cookie-session 機制能夠讓我不需要重新登入  

### OAuth 例子

今天我在 Pchome 購物, 發現一台 Mac 很想買  
於是我點下登入按鈕, 發現跳出可以用 Facebook or Line or Google 登入  
那因為常用 Google, 所以我選擇用 Google 登入  
此時我就被導入到 Google 的登入頁面輸入帳號密碼  
認證完成之後, 我被導回 PChome 後就發現我有會員的身份, 然後就開開心心的買完東西  

接著隔天我在 Yahoo 購物, 發現 magic keyboard 比 PChome 更便宜  
於是我在 Yahoo 按下登入按鈕, 發現又跳出可以用  Facebook or Line or Google 登入  
我一樣選擇用 Google 登入, 但因為昨天我早就登入過了, 所以今天我不用重新輸入帳號密碼  
只要在 Google 頁面按下 Approve 確認, 就被導入 Yahoo  
然後發現我有會員的身份, 然後開開心心的買完東西  

上面流程會發現一件事情, 我們只用了一個帳號就可以使用 Yahoo 和 PChome 的服務  
這個狀況很像剛剛 SSO 提到的, 我登入後使用 A 服務, 再次使用服務 B 時, 是不用重新登入  

但這裡有一個小小的差別  
請注意, 當我們在登入後使用 Google Calander 後, 再去使用 Gmail 的時候  
Google 不會叫你重新按下 Approve 才能使用 Gmail, 而是直接跳到 Gmail 的頁面讓你用  

但在 PChome 和 Yahoo 的狀況下  
當我按下 Google 登入按鈕, 我一定都會被導轉到 Google 登入頁面去按下 Approve 或輸入帳密  
這裡就是一開始提到的 approval interaction 的部分  

這是一個 OAuth 的核心地方, 也就是<span style="color: red">授權</span> PChome 和 Yahoo 可以存取<span style="color: red">我的 Google 資料</span>  
所以在 PChome 和 Yahoo 按下 Googe 登入回來後, 會發現我的 email 已經在它們裡面  

但也會有另一個疑問出現, 那為什麼我在 Google 登入後  
我從 PChome 和 Yahoo 按下 Goolge 登入, 我不需要輸入帳密, 只需要按下 Approve 呢?  

其實這原因很單純, 在使用 Facebook 網頁的時候, 你今天看完, 隔天再看, 是不需要重新登入  
這就是透過 cookie-session 的機制達到, 但這跟 OAuth 並無太大相關性  

只是 OAuth 還有一個特性  
當我使用其他購物網站, 繼續使用 Google 登入的時候  
這樣 ... 我是不是只要記得 Google 的帳號密碼, 其他購物網站其實都不用紀錄?  
也就代表, 我使用其他購物網站, 我都<span style="color: red">不需要重新輸入帳號密碼</span>就能登入了  

沒錯, 其實透過 OAuth 也能達到 SSO  
但前提是如果全世界的人都用 Google OAuth 的時候, 的確只要一組帳號密碼就能登入所有服務  

所以其實 OAuth 和 SSO 的概念其實是很相近, 所以這也是常常被搞混的其中一點  

## 後記

寫一寫才發現, 這篇應該當第一篇才對 XD  

## References

1. https://tools.ietf.org/html/rfc6749#section-1
2. https://tools.ietf.org/html/rfc7642#section-3.2
3. [OAuth与SSO、REST有哪些区别与联系](https://blog.51cto.com/favccxx/1635938)