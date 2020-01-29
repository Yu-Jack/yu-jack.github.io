---
title: 關於『測試』這件事
categories: Test
date: 2017-11-01 00:02:33
tags: [Test, Development, mocha]
header-img: /images/banner.jpg
catalog: true
---

為什麼要測試?
確保你程式的結果跟你預期所想的一樣
那這樣有什麼好處?
這樣大概會讓你少加班好幾小時吧 ....

下面我會介紹如何用 mocha 去做測試
小弟我對測試並沒有鑽研到很深的地步，如果有任何奇怪的地方，歡迎指教 ~

<!-- more -->

## 介紹

測試是為了確保你的程式結果跟你預期所想的一樣
那我們又該如何去測試？那又該測試什麼東西？

在這邊我把該測試的東西分成三個方向，由小到大
這篇文章重點會放在 Unit Test 的部分，其他會以 Unit Test 的概念延伸說明
1. Unit Test (本篇重點)
測試你的 function 有沒有輸出正確結果

2. API Test
測試跟 API 相關的 Unit 有沒有正確執行

3. User Story Test
測試整個使用情景有沒有跟使用者所想的一樣

## 準備

在開始要做測試之前需要安裝以下幾樣東西
```javascript
// mocha 測試主要會用到的東西
// chai 一個很好用的 assertion library
// axios 發 request 用的 library
npm install mocha chai axios
```

該建立的資料夾

```

|--- package.json
|--- node_modules
|--- test
|    |--- test.js

```

## 如何測試

想像一下我們現在有一個需求進來了
『我要把我丟進去的數字都變成一個陣列然後回傳回來』

所以根據這個狀況我可以列出一個測試的方式
```javascript
// First Test Case in test.js

const {assert} = require('chai')
describe('Unit Test', function() {
    it('Test function with one number', function () {
        const result = transformToArray(1)
        assert.equal(typeof [], typeof result)
        assert.equal(1, result.length)
    });
})
```
測試列出來了，但是程式完全還沒寫
於是接下來先寫主要功能的程式

```javascript
// 這程式想放哪都可以，記得 require 近來就好

function transformToArray (number) {
    return [number]
}

transformToArray(1)
// result should be [1]
```

程式寫出來之後，可以正式執行測試了
依照這個 test case 我們的程式是有正確執行的

![](https://i.imgur.com/oanbJ3s.png)


接下來我在列出另一個 test case
```javascript=
// First Test Case in test.js

const {assert} = require('chai')
describe('Unit Test', function() {
    it('Test function with one number', function () {
        const result = transformToArray(1)
        assert.equal(typeof [], typeof result)
        assert.equal(1, result.length)
    });
    it('Test function with multiple numbers', function () {
        const result = transformToArray(1, 2, 3, 4)
        assert.equal(typeof result, typeof [])
        assert.equal(result.length, 4)
    })
})
```

Oops, test case 出錯了，代表我的程式爆炸了
這時候該怎麼辦？
那就是回去繼續修改我的程式讓他可以通過這個 test case

![](https://i.imgur.com/mXOfzFW.png)

進行修改後，程式變成這樣

```javascript=
// Version 2 程式

const transformToArray = function () {
    let temp = []
    for (const i of arguments) {
        temp.push(arguments[i])
    }
    return temp
}
```

登愣，我們執行結果正確了

![](https://i.imgur.com/tAGBFrt.png)

但是總覺得程式好像沒有寫得很漂亮於是改成

```javascript=
// Version 3 的程式

const transformToArray = function () {
    return Object.keys(arguments).map((key) => {
        return arguments[key]
    })
}

```

在我們剛剛列出 test case 然後修正程式去符合新的 test case
這整個開發流程，就屬於 TDD 的方式

1. 列出 test case
2. 開發程式
3. Passed or Failed
4. Refactor

不過我個人是喜歡 BDD 的開發方式，兩個的主要差別我列在下面

* Test-driven Development 的方式，是以測試為主，列出各種 test case 讓程式可以正確執行
* Behavior-driven Development 的方式跟 TDD 很相似，但是他會以規格為主(有點像訂出 User Story 的感覺)

BDD 比較符合我們現時開發上的流程，客戶需求進來
變成一個 User Story，根據 User Story 寫出 Test Case
接下來就是開發程式，讓程式可以通過這個 Test Case

那關於測試 API 和 Uesr Story 的方式
大體上跟 Unit Test 很相似，差在 Test Case 的寫法不太一樣而已

對 API Test 來說，可能是 3 ~ 4 Unit 合成的一個 API
例如 API 是『登入』，對登入來說 Input 是帳號密碼，Output 是有無驗證成功
帳號密碼的驗證可能牽扯到 3 ~ 4 Unit，但是這已經在 Unit Test 那邊完成了
所以對於 API Test 來說，可能會列出以下幾種 Test Case

1. 輸入正確帳號密碼，成功登入
2. 輸入錯誤帳號密碼，無法登入
3. 輸入正確帳號錯誤密碼，無法登入
4. 輸入錯誤帳號正確密碼，無法登入

對 User Story 來說，可能是 3 ~ 4 個 API 合成的一個功能
假如使用情形是，使用者登入了賣書網站
搜尋了他想要的書本，根據搜尋會顯示或是找不到書本給使用者看
那對於 User Story Test 來說，可能會列出以下幾種 Test Case

First Test Case
1. 輸入正確帳號密碼，成功登入後
2. 在搜尋欄位輸入『nodejs』 然後顯示 nodejs 書籍

Second Test Case
1. 輸入正確帳號密碼，成功登入後
2. 在搜尋欄位輸入『找不到』，然後顯示搜尋結果為 0 筆的頁面

## 結語

我認為用什麼樣的開發流程去測試程式都可以
BDD TDD ATDD 等等，都是很好的開發流程
對於不同團隊都會有各個團隊習慣的方式
但最重要的是，要有『測試』這件事情出現在專案的開發流程上就足以