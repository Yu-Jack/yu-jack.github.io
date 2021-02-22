---
title: Unit Test 實踐守則 (三) - 為何寫好 Unit Test 前需要先了解重構? 
categories: Test
date: 2020-09-28 10:22:57
tags: [test, unit test, refactor, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

上一篇我們會討論了 [如何從什麼層面去思考一個好的 Unit Test?](/2020/09/21/unit-test-best-practice-part-2/)
接著我們討論到寫好 Unit Test 前需要先看看重構  

書中提到 Unit Test 和 Code Base 是彼此非常糾纏的  
原文是這樣寫道  
> Unit tests and the underlying code are highly intertwined,  
> and it’s impossible to create valuable tests without putting effort into the code base they cover.

所以在寫好一個 Unit Test 之前, 是需要先把程式碼進行重構  
這樣才有辦法寫出一個好的 Unit Test  

但有趣的就來了, 如果先進行重構才去寫 Unit Test 又要怎麼確認重構後的邏輯是正確的?  
在 91 大的 2012 年[這篇文章](https://ithelp.ithome.com.tw/articles/10104643)也提到了這蛇咬尾巴的矛盾點  

所以比較好的方式, 是額外先寫更高層一點的測試, 先確保邏輯上是沒有問題再來進行重構  
而這個更高層一點的測試, 是有可能只用一次用完就丟, 這很正常  
因為當程式碼開始進行重構的時候, 原本這個更高層的測試可能 mock 一堆內部方法  
但隨著內部方法被重構之後, 呼叫的進入點可能改變, 這個測試就無用了  
但帶來的效益, 卻是程式碼更乾淨也更好維護, 而且更好寫測試  

> 筆者經驗談: 
> 除非, 你能保證 100% 掌握住這段邏輯的運作流程  
> 那也許你就可以先不用寫更高層級的測試了, 就可以直接重構了 (若你真的有信心的話)  
> 
> 雖然我真的幹過直接重構然後才寫 Unit Test, 還好結果是沒問題的 (擦汗  
> 但這前提真的是很清楚邏輯且邏輯簡單才敢這樣做  
> 當系統中遺留舊有程式的邏輯太過複雜, 我還是會先建立一個到多個測試確保等等不會改壞  

在這裡會簡單介紹書中提到的一些重構的方式和架構  

## 重構

書中提供兩種維度, 把我們的 Code Base 分成了四個種類  

![圖一](/images/unit-test/unit-test-best-practice-03.png)

縱向的是邏輯和 domain knowhow 的重要性  
橫向的是與其他程式碼之間有沒有很大的關聯度  

以上圖中例子來說
在 MVC 架構中, Controller 往往代表控制流程的角色
business logic 並不存在於 Controller 之中
所以 business logic 相關的基本上會在左上的位置

根據這兩種維度, 可以分辨出哪一段程式碼是最重要的  
就可以針對這部份進行 Unit Test 或是重構  
像下圖中左下角沒有太大作用會影響 Business Logic 的話, 可以不用在測試的優先序前面幾位  
譬如說是 getter 或是 setter 的程式  

而右上是過度複雜的部分  
當一段程式碼把流程和商業邏輯全部砸在一塊的時候  
想必非常難懂, 所以要往兩邊的維度去拆分, 如下圖  

![圖二](/images/unit-test/unit-test-best-practice-04.png)

除了程式碼的拆分之外, 每個模組之間的相依性也很重要  
書中也建議用 hexagonal architecture 的方式去連接每一個模組, 示意圖如下  

![圖三 - hexagonal architecture](/images/unit-test/unit-test-best-practice-05.png)

舉例來說明一下 hexagonal architecture 是什麼概念  
以上面『使用者輸入正確帳號密碼, 登入成功』的例子來說  
我們再多加一小段行為變成『使用者輸入正確帳號密碼, 登入成功, 並寄信給使用者通知登入成功』  
我們把流程拆成如下  
1. 撈取資料庫資料
2. hash 使用者密碼
3. 比對 hash 過後的使用者密碼和資料庫的密碼是否一致
4. 一致的時候, 使用 SMTP service 寄信給使用者

```js=
Database --- Login service ---- SMTP

Login service 包含項目如下 (六角形白色區塊)
1. Read user data
2. Trigger business logic
3. Send email

Login service 裡的 business logic 包含項目如下 (灰色圈圈)
1. hash input password
2. compare user password and input password
```

我們再把上面描述的用較平面化來的表示  
可以看到操作 database 相關的, 絕對不會是 business logic 那部份的程式去存取  
一定是交由從的 application service 去存取  

![圖四](/images/unit-test/unit-test-best-practice-06.png)

我們來舉上面的情境換做成程式來看一下範例  
假設真的有一段程式是都塞在同一隻程式裡面大概會長這樣  
(以下程式為示意, 並不能正確執行)
```js
// loginController.js
function login(request) {
    const {account, password} = request
    const user = userDb.find(account)
    const hashPassword = require("crypto").createHash("sha256").update(password).digest("hex")
    if (user.password !== hashPassword) {
        throw new Error("Mismatch")
    }
    const axios = require("axios")
    axios.post(mailServiceUrl, {
        mail: user.email,
        title: "You have logined successfully"
    }))
}
```
這個要做 unit test 是非常難做到的, 因為太過混雜  
而且也嚴重打破 hexagonal architecture 的結構  

如果真的要在重構前先寫一個測試確保等等不會改壞的話, 大致上會寫成以下這樣  

```js
const loginController = require("./loginController.js")
const axios = require("axios")
const userDb = require("userDb.js")
describe("when user type correct password, user should be allow to login", () => {
    // arrange
    const request = {account: "account", password: "123"}
    sinon.stub(userDb, "find").withArgs(request.account).return({
        password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
        email: "123@gmail.com"
    })
    const mock = sinon.mock(axios)
    mock.expects("post").once()

    // act
    // 如果沒有成功呼叫, 就會噴出 Error
    loginController.login(request)

    // assert
    // 驗證是否有呼叫寄信程式
    mock.verify()
})
```

那因為這個只是示意一下在這種情況下該如何寫測試  
所以實際上跑 express 並不會這樣測試  
但這樣測試的話, 其實某方面來說就會變成 Integration test 了  
詳細的 Integration test 部分下一篇會介紹到  

那麼 ...... 如果我們要寫好一個 unit test, 那我們就勢必得先重構上面的程式碼  
這邊先以簡單拆法為主, 所以可能不是非常完美, 但用例子解釋就足夠了  
透過這樣拆成模組化, 到時候再使用類似 sinon 的 mock 工具時會更輕易能夠做 mock  

> 如果邏輯比這個更複雜的情況下  
> 還是建議先向上面一樣, 先寫一個更高級別的 Test 去確保  
> 但這邊邏輯很單純, 於是我就直接進行重構了  

```js
// loginController.js
function login() {
    const user = userDb.find("account")
    if (userService.isPasswordMatch(user.password, inputPassword) === false) {
        return new Error("Mismatch")
    }
    mail.send(user.email);
}

// hash.js
const crypto = require("crypto")
module.exports = {
    sha256: (password) => crypto.createHash("sha256").update(password).digest("hex") 
}

// userService.js
const hash = require("hash.js")
module.exports = {
    isPasswordMatch: (userPassword, inputPassword) => {
        return userPassword === hash.sha256(inputPassword)
    }
}

// mail.js
const axios = require("axios")
module.exports = {
    send: (email) => {
        axios.post(mailServiceUrl, {
            mail: user.email,
            title: "You have logined successfully"
        }))
    }
}
```

從上面例子可以看到 hash 已經不會出現在 loginController 的流程控制中了  
而是會出現在管控 business logic 的程式碼裡面  
這樣也看得出來我們最重要的 business logic 是位在 userService 裡面了  
用六角形圖來看會變這樣  

<img src="/images/unit-test/unit-test-best-practice-13.png" width=450/>

接著根據上一篇, 好的 Unit test 要『專注在最重要的程式』  
我們應該要測試的地方就是在這塊 business logic  
這樣拆分就有達到上圖四的切割了  

所以在進行 unit test 的時候會如下  
這時候可以看到我們根本不需要去使用 Test Double 就可以完成對 business logic 的測試了  

```js
describe("when user type correct password, user should be allow to login", () => {
    // arrange
    const exceptedResult = true
    const userInputPassword = "123"
    const hashPassword = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
    const userService = require("./userService.js")

    // act
    const actualResult = userService.isPasswordMatch(userInputPassword, hashPassword)

    // assert
    expect.equal(actualResult, exceptedResult)
})
```

## 後記

以上就是重構的一些方法  
簡單介紹完重構之後, 那我們就根據此篇最後的 unit test 去看看  
[如何寫出一個好的 Unit Test? ](/2020/10/05/unit-test-best-practice-part-4/)