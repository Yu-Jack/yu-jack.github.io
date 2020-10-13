---
title: Unit Test 實踐守則 (五) - 如何有效使用 Test Double
categories: Test
date: 2020-10-12 10:22:57
tags: [test, unit test, test double, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言  

上一篇[如何寫出一個好的 Unit Test? ](/2020/10/05/unit-test-best-practice-part-4/)留下的兩個問題

1. 那除了 business logic 以外都不用寫 unit test 嗎?  
    如果測試切入點從 controller 開始, 然後對 mock/stub 資料庫去做 unit test 不也是可以?  
2. 文章中有提到 Test Double, 但好像沒有說用在哪或是怎麼使用比較好?  

在討論第一個問題之前, 我們需要先花點介紹書中 Integration Test 的定義  

至於關於第二個問題  
其實當我們開始用 Test Dobule 的時候  
不外乎是要針對外部資源或是資料庫使用 Test Doubles  
那麼要如何比較準確使用 Test Doubles 去測試呢?  
是不是在 unit test 中的待測試程式  
從資料庫取得資料時需要用到 Test Doubles 呢?

以上兩個問題等等會詳細地進行說明  
但為了要說明, 我們必須先瞭解書中 Integration Test 的定義  

## Integration Test 是什麼?  

還記得我們提到過 unit test 的定義嗎?  

1. 驗證一小段的程式碼, 並以驗證單一行為為主, 就是 unit of behavior
2. 執行快速
3. 獨立性 (isolated) 不受其他 unit test 影響

而在書中對 Integration Test 的定義就是, 當測試不符合上面其中一點時就是 Integration Test  
以第一點來說, 我們 unit test 驗證的是 1 個行為  
但對 Integration Test 來說, 驗證的是 N 個行為  

除此之外, 當有對外部資源或資料庫直接操作或是做 mock 的話, 也隸屬於 Integration Test  
可以看到作者在[這則評論](https://disq.us/p/28q4lb3)裡面談到這件事  
以及我去跟作者 dobule check unit test 和 Integration test 的定義的[評論](https://disq.us/p/2cg0hl8)  

不過有趣的是, 作者認為技術上配合 mock 資料庫去驗證 1 個行為這種方式, 可以算得上 unit test  
只是作者覺得為了簡單好區分就把他歸類在 Integration Test 了

> Technically, a test that covers the controller and mocks the database would be a unit test,  
> but I would still categorize it as an integration test for simplicity sake. 
> from https://disq.us/p/2cg0hl8  
> 這個連結點進去要稍等一下, 才會跳到那個評論  

所以回到前面的問題『除了 business logic 以外都不用寫 unit test 嗎?』  
這其實還是得看情況, 如果一個 API 的程式邏輯相對單純  
那 unit test 做的事情就已經達到 Integraion Test 做的事情  
只是定義上可能會有些不同而已  

而前面提到過書中把程式分成四大類型, 而 unit test 和 Integration test 也會依照不同分類去使用 (圖一)  
所以按照書中邏輯, 作者是不希望在進行 unit test 時牽扯到外部資源的  
希望單純以 business logic 去進行 unit test  
因為此特點所以在 unit test 中其實會非常少用到 Test Double (除非選用 unit of code)  
至於其他牽扯到多個行為或是外部資源就交由 Integration Test 去處理  

![圖一](/images/unit-test/unit-test-best-practice-09.png)

這也是為什麼前一篇的 unit test 是會以 userService 為切入點進行測試, 而不是 controller  

如果有遵守重構的原則進行拆分, 在使用 Test Double 的時候  
大部分都會是使用在 Integration Test 裡面  
但 Integration Test 通常是會實際去跟外部資源進行測試  
也就是會實際讀取資料庫, 但有一些像是要付錢的 API 可能就還是要 mock/stub 的方式去處理  
像是[ 91 大介紹的 Intergration Test ](https://dotblogs.com.tw/hatelove/2012/12/10/learning-tdd-in-30-days-day8-integration-testing-and-web-ui-testing-by-selenium-and-webdriver)也有提到這點  

所以這帶來一個問題  
也就是既有程式在還沒拆分 business logic 之前, 或是本身邏輯違反六角形結構 (hexagonal architecture)  
導致在 business logic 裡面去讀取資料庫時該怎麼解決  

這就回歸到上一篇提到的重構環節了  
但我們要思考的是如何在重構中又能保持原本程式 output 是不變的才對  
針對這點, 我有特別去跟作者確認如果在 business logic 還未抽出來之前  
會建議先使用 Integration test (無論要不要用 mock) 先去做驗證  
沒問題的話, 在開始把 business logic 抽出來去寫 unit test 的流程適合嗎?  
而我得到的回覆如下  
> That's also correct. Write an integration test first, to check the overall behavior. Then do the refactoring.
> from https://disq.us/p/2cg0hl8

所以這也重複驗證, 本書是希望針對 business logic 去做 unit test  
剩餘的就交給 Integration test, 也就是上圖圖一的 Controller 部分  

接著我們討論一下 Test Double 的使用方式  

## Test Double 使用方式

書中把 Test Double 分成兩種大類型  

![](/images/unit-test/unit-test-best-practice-12.png)

1. Mocks 是幫忙驗證以及模擬互動的結果.
2. Stubs 是幫忙模擬 input data, 像是當成資料庫取值就會需要用到 Stubs.

> 想詳細了解各個 Test Dobule 的話  
> 可以參考之前我寫的[ Test Double - 測試替身](/2019/12/10/unit-test-express/#test-double-測試替身)

以登入的例子來討論應該要用哪一種類型的 Test Double  
假設登入成功之後要寄信通知使用者登入成功, 程式如下  
```js
// loginController.js
// axios 是一個專門發 request 用的套件
const axios = require("axios")
function login() {
    // 其餘程式就忽略  ......
    axios.post(mailServiceUrl, {
        mail: mail,
        title: "You've login successfully"
    })
}
```

那因為上一篇重構的案例把它調整成如下  
並且我們再加上一點邏輯在拆開的 mail.js 裡面  
```js
// loginController.js
const mail = require("./mail.js")
function login() {
    mail.sendLoginSuccessfullyMail(mail)
}

// mail.js
const axios = require("axios")
module.exports = {
    sendLoginSuccessfullyMail: (mail) => {
        if (isMailFormatCorrect(mail) === false) {
            throw new Error("mail format is wrong")
        }
        axios.post(mailServiceUrl, {
            mail: mail,
            title: "You've login successfully"
        })
    }
}
```

此時要 mock/stub 哪一個位置才是比較適合的呢? 以及要選 mock 還是 stub 呢?  
答案是使用 mock 在 mail.js 裡面的 axios 套件的 post 方法去進行驗證就好  

原因是 mail.js 並不是實際上去發出外部請求的程式  
而是 axios.post 才是  
在 mail.js 裡面的程式也是內部相依性的一種  
所以在做 mock 的時候要以最外層, 實際去呼叫外部資源的地方為主  
透過這種方式可以以最大限度去檢測內部使用的相依性問題  

如果萬一是 mock 在 mail 的 `sendLoginSuccessfullyMail` 方法的話  
變成有一段`檢測 mail 格式`的邏輯就會沒有測試到, 而這種方式就是 unit of code  
因為 unit of code 就是在測試程式中, 所有相依性都用 mock 去處理   

那以前幾天提到六角形架構 (hexagonal architecture) 來看的話如下  

<img src="/images/unit-test/unit-test-best-practice-08.png" width=550/>

所以在使用 mock/stub 盡量以最外面靠近外部資源的去 mock/stub  
不過當我們在測試這類型的時候, 其實也已經被歸類在 Integration test 裡面了  

那麼接著為何剛剛的 case 要使用 mock 而不是 stub?  
在書中, 用了以下兩種方式去分類何時使用 mock 何時使用 stub  
有回傳值使用 stub, 無回傳值使用 mock  

<img src="/images/unit-test/unit-test-best-practice-11.png" width=400/>

不過進一步說明的話, 因為在剛剛的 case 中並沒有需要寄信的 response 去處理任何東西  
所以我就也不需要用 stub 了  
我只需要用 mock 去驗證`寄信的行為`是不是有符合就夠了  

## 後記

透過這五篇帶大家了解一下書中內容的一些精華  
書中有些觀點我可能沒辦法完整呈現出來  
但有興趣的人可以去看看這本書, 真的寫得不錯！  
如果有任何疑問, 歡迎提出來一起討論！  