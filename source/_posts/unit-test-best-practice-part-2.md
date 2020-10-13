---
title: Unit Test 實踐守則 (二) - 如何從什麼層面去思考一個好的 Unit Test?
categories: Test
date: 2020-09-21 10:22:57
tags: [test, unit test, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

上一篇我們會討論到什麼 [Unit Test 定義是什麼, 涵蓋的範圍又是哪些?](/2020/09/14/unit-test-best-practice-part-1/)  
接著我們會討論到 [如何從什麼層面去思考一個好的 Unit Test?](/2020/09/21/unit-test-best-practice-part-2/)

這篇著重於在心法, 也就是先思考我們要的 Unit Test 要有什麼樣的效果  
透過瞭解這些效果之後, 再來制定想要的組合  
每個人認為好的 Unit Test 可能都不一樣  
但這邊就以書中內容去介紹什麼是一個好的 Unit Test  

## 什麼是一個好的 Unit Test?

書中對好的 Unit Test 目標定義有三個  
1. 可以被整合在開發流程中
2. 專注在最重要的程式
3. 用最小維護成本提供出最大的價值

基於第三點的目標, 可以看出書中其實不推薦開發者為所有程式碼都加上 Unit Test  
雖然帶來的效益可能不錯, 但取而代之的是維護成本極高  

可以試想, 當你為所有程式都寫上 Unit Test 之後  
當你要開始重構或是因為新功能開始把其他程式進行合併  
原本寫的 Unit Test 基本上會變得毫無作用  
甚至因為寫了太多 Unit Test 導致執行測試時間過長  

當然這並不是說為所有程式寫上 Unit Test 不好  
但我們要思考的是會有一些隱藏成本存在的  

竟然目標已經有了, 接著就是要透過什麼方式達到  
書中提供以下四個面向, 以分析的角度去決定以及如何取捨去達到目標  

## Unit Test 的四個面向

以下是書中提供的四個面向去思考, 看完之後我們再回頭看看剛剛舉例的 behavior  
1. Protection against [regression](https://en.wikipedia.org/wiki/Software_regression): 保護程式不出現 Bug
2. Resistance to refactoring: 不因重構導致影響撰寫 Unit Test
3. Fast feedback: 能不能快速給予結果, 而不會等待很久
4. Maintainability: 能不能輕易理解/執行 unit test 的內容

關於第四點是一定必做的, 如果連第四點都做不到, 那就不會有人寫 Unit Test 了  
除了第四點是必做之外, 其他三點之間會有一些互斥行為存在  

舉例來說, 要把 Protection against regression 做到極致的話  
就會需要寫很多 Unit Test, 但這會導致 Resistance to refactoring 指標往下降  

上面這段話很饒口對吧, 用白話來說的話就是  

『要把 Bug 降到最低的話, 就把所有程式都加上 Unit Test 就好 (unit of code)  
但當把所有程式加上 Unit Test, 哪天要重構功能時, 大部分的 Unit Test 都不能跑了』

這裡定義一下重構為『在不改變程式外在行為的前提之下，改變程式內部結構以提升設計品質』  
可以看看在 Teddy 的投影片裡提到的[重構的定義](https://www.slideshare.net/teddysoft/ss-238494517?fbclid=IwAR3zNqIevurDkP0pz3FbidPNgYG1wsO7YcatIIUoKf6KRtXsp_xDTYZzFp4)  

假設 Unit Test 測試的粒度, 以上篇提到的 unit of code 中的例子, 測試『hash 使用者密碼』
原本程式碼如下
```js
// hash.js
const crypto = require("crypto")
module.exports = (password) => crypto.createHash("sha256").update(password).digest("hex")
```

測試程式碼如下  
```js
const hash = require("hash.js")
it("when give the string to hash 256, should return sha256 string", () => {
    // arrange
    const exceptedResult = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
    
    // act		
    const actualResult = hash("123")

    // assert
    expect.equal(actualResult, exceptedResult)
})
```

未來因為部分的程式需要用到 sha512  
所以需要加上其他的 hash 方式, 想要調整此程式碼變成如下  
```js
// hash.js
const crypto = require("crypto")
module.exports = {
    sha256: (password) => crypto.createHash("sha256").update(password).digest("hex"),
    sha512: (password) => crypto.createHash("sha512").update(password).digest("hex")
}
```

測試程式碼就需要進行調整  
```js
const hash = require("hash.js")
it("when give the string to hash 256 should return sha256 string", () => {
    // arrange
    const exceptedResult = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
    
    // act
    const actualResult = hash.sha256("password")

    // assert
    expect.equal(actualResult, exceptedResult)
})
```
以 unit of code 概念來說, 這樣重構時, 就會需要連 Unit Test 一起重構  

但如果以 unit of behavior 來說, 舉例如下  
```js
const userService = require("./userService.js")

it("when user type correct password, user should login successfully", () => {
    // arrange
    const exceptedResult = true
    const hashPassword = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
    
    // act
    const actualResult = userService.isPasswordMatch("123", hashPassword)

    // assert
    expect.equal(actualResult, exceptedResult)
})
```

> 眼尖的讀者應該有發現到  
> 筆者在 Unit Test 裡面有寫註解關於 arrange, act, assert  
> 這其實是很著名的 3A Pattern 寫法  
> 後面在提到如何寫好的 Unit Test 時會講到  

因為 unit of behavior 關注的點是輸入密碼這個行為造成的結果, 並不用關注裡面怎麼去實作 hash 這件事情  
所以在重構 hash function 的時候, 就不會需要重新調整 unit test 了  
而且重構 hash function 之後, 跑完 unit test 如果是通過也就代表結果正確  

過度使用 unit of code 的方式除了會降低 Resistance to refactoring 這個指標外  
也會降低 Fast Feedback 這個指標  
因為過多的 Unit Test 會讓整體跑 Unit Test 拉得過長  

以這三個指標來說, 會出現以下這張結果  

![](/images/unit-test/unit-test-best-practice-02.png)

這張圖是以 Resistance to refactoring 為主軸去調整    
以 Resistance to refactoring 為主, 也就是書中的核心思想  
『The goal is to enable sustainable growth of the software project.』  

書中也提到這個三角形是可變動的  
如果希望系統很少 Bug, 那麼相對應 Test Case 就會寫得非常多去驗證  
所以主軸可能就會以 Protection against regression 為主  
也就是以剛剛的測試『hash 使用者密碼』來說  
這個 Test Case 就需要測試  

那剩下就是 Resistance to refactoring 和 Fast feedback 去選擇  
這很難拿到三項都是完美的一百分，所以會有一個折衷點存在  


> 題外話: 這也很類似分散式系統裡面的 [CAP 理論](https://zh.wikipedia.org/zh-hant/CAP%E5%AE%9A%E7%90%86)

## 後記

筆者認為根據不同情境會組出不同樣的組合  
舉極端的例子, 如果只是很初期 MVP 用的專案的話, 甚至連 Unit Test 都不需要  
因為產品沒辦法趕快生出來的話, 可能就被別家搶走生意了   
好不好維護這是以後等生意做成再來考慮的事情  
不然沒生意的話, 這個專案可能就直接進垃圾桶了 QQ  

那麼如果要寫好一個 unit test 該怎麼寫呢?  
.
.
.
.
.
.
.
.
.
.
.
.
.
<img src="/images/wait.png" style="margin: 0" width=300 />
我們得先來看看重構！  
來看看下一篇[為何 Unit Test 前需要先重構原始碼? ](/2020/09/28/unit-test-best-practice-part-3/)  