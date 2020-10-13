---
title: Unit Test 實踐守則 (一) - Unit Test 定義是什麼, 涵蓋的範圍又是哪些?
categories: Test
date: 2020-09-14 10:22:57
tags: [test, unit test, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

接下來這幾篇會需要先對 Unit Test 有一點認知再繼續閱讀下去會比較適合  
若有寫過 Unit Test 的話閱讀起來會比較順  

這篇是看完『Unit Testing Principles, Practices, and Patterns』後所記錄  
看完這本書對於 Unit Test 的認知有很大的幫助  
接下來的文章會成以下幾篇大致介紹書中內容  

1. 第一篇會討論到 [Unit Test 定義是什麼, 涵蓋的範圍又是哪些?](/2020/09/14/unit-test-best-practice-part-1/)
2. 第二篇會討論到 [如何從什麼層面去思考一個好的 Unit Test?](/2020/09/21/unit-test-best-practice-part-2/)
3. 第三篇會討論到 [為何 Unit Test 前需要先重構原始碼? ](/2020/09/28/unit-test-best-practice-part-3/)
4. 第四篇會討論到 [如何寫出一個好的 Unit Test?](/2020/10/05/unit-test-best-practice-part-4/)
5. 第五篇會討論到 [如何有效使用 Test Double](/2020/10/12/unit-test-best-practice-part-5/)
    這篇會開始談到 Integration Test 定義

文章內有任何問題或是不清楚的, 歡迎一起來討論！  
不過因為本書內容量實在太多, 沒辦法一一介紹, 所以只介紹筆者覺得很精華的點  
以後有時間會繼續補完本書介紹的所有內容 XD  

書中範例程式皆是用 C# 寫的, 不過這邊範例是我用 Node.js 加上新的範例寫出來的  
概念都是相同的不必太過擔心語言不同問題  

## 介紹

書中針對 Unit Test 的認知是『The goal is to enable sustainable growth of the software project.』  
並不太像筆者的認知, 認為 Unit Test 是為了拿來防止 Bug 出現  

書中此認知的原因是程式很快就從 draft 變成小中型專案, 但要如何讓專案變成可持續成長是難事  
寫 Unit Test 就可以讓專案變成可持續成長的一個關鍵  

而何謂可持續成長?  
當專案越來越大的時候, 相對應的維護成本也越來越高  
當重構一個功能的時候可能會不小心改動其他功能, 而導致問題出現  
當新增一個功能的時候可能會因為舊有架構導致新功能難以實作, 增加測試難度以及開發時間  
其實這些可以透過測試去把專案維持著品質  
而常用的測試包含 Unit Test, Integration Test 以及 E2E Test  
但這邊就專注在 Unit Test 去討論吧！後面有文章談到 Integration Test  

## 什麼是 Unit Test?

書中給了以下三個答案  

1. 驗證一小段的程式碼, 並以驗證單一行為為主, 就是 unit of behavior
2. 執行快速
3. 獨立性 (isolated) 不受其他 unit test 影響

針對 2, 3 點, 大部分的資料是比較沒有爭議的  
像是比較有名的 [F.I.R.S.T.](https://dotblogs.com.tw/hatelove/2012/11/05/learning-tdd-in-30-days-day2-unit-testing-introduction) 也有提到這幾點  
但較有爭議的是第 1 點, 也就是 unit 的定義  

書中有提到兩種不同定義  
一個是 unit of code  
一個是 unit of behavior  
不同的定義涵蓋的測試範圍也不太一樣  

### Unit of code v.s Unit of behavior

先來說說什麼是 unit of code, 什麼是 unit of behavior  
『輸入正確帳號密碼，登入成功』此情境說明的就是一個 behavior 造成的結果  
但要怎麼組成 behavior ? 是透過很多 unit of code 組合而成的

以此情境來說  
把『輸入正確帳號密碼，登入成功』拆成程式碼去解讀  
會有以下程式碼的部分, 假設每一個部分都有相對應得程式碼    
1. 撈取資料庫資料
2. hash 使用者密碼
3. 比對 hash 過後的使用者密碼和資料庫的密碼是否一致

如果測試的粒度是測試『hash 使用者密碼』, 那就是 unit of code  
因為測試的東西, 並不是使用者會專注的結果, 而是開發者會專注的結果  
使用者只關注輸入帳號密碼能不能成功, 可能也不管你是不是用 hash, 這就是不同面向的差異  
而除了測試的粒度不同之外  
unit of code 和 unit of behavior 所定義的獨立性也有所不同  

先以一個 Node.js module 來說好了, 這個 A module 用到 B module 和資料庫這兩個相依性  
在 unit of code 之中, 是會使用 Test Double 在 B module 和資料庫上並進行測試  
在 unit of behavior 之中, 只會在資料庫使用 Test Double, 但會保留對 B module 的相依性, 並進行測試  

這裡快速介紹一下使用 Test Double 是怎麼回事  
Test Dobule 簡單來說可以去更改或是紀錄原始碼的行為以及驗證的一種方法  
下面範例是用 [sinon](https://sinonjs.org/) 的 stub 去示範 (stub 是屬於 Test Double 的一種)  
在更詳細的介紹可以參考之前我寫的[Test Double - 測試替身](/2019/12/10/unit-test-express/#test-double-測試替身)
```js
// 下面是一個 function, 帶入什麼就會回傳什麼
const a = {
    test: (param) => {return param}
}
a.test(10) // return 10
a.test(15) // return 15

// 但透過 stub, 可以做到更改的回傳值, 也就是更改程式邏輯
const sinon = require("sinon")
sinon.stub(a, "test").returns("hihihi")
a.test(10) // hihihi
a.test(15) // hihihi
```

以下圖來表達的話就是 unit of behavior 的測試方式  
可以看到 database 和 file system 是用取代掉的方式  
但在被測試的程式之中, 如果有引用到其他 modules, 則會保留相依性  
(System under test, 就是指待測程式)  

![unit of behavior](/images/unit-test/unit-test-best-practice-01.png)

但如果以 behavior 為基準, 有人會認為這樣就是 Integration Test 了, 而不是 Unit Test  
其實兩者差異差書中有說到  
其中有一個特徵是有沒有實際對外部資源進行存取, 也就是有沒有使用資料庫或呼叫第三方資源是關鍵  
如果沒有, 那就是 Unit Test  
如果有, 那就是 Integration Test  

但有文章指出這種 behavior 測試的方式, 其實是社交型 Unit Test  
可以參考[探討單元測試和整合測試的涵蓋範圍](https://ithelp.ithome.com.tw/articles/10229734)

其實 unit of code 和 unit of behavior 各有好壞  
並不是說哪個好, 就一定要用哪個, 來看看各個優缺點是什麼  

以下說的 mock 是 Test Double 的一種  

### Unit of code 優劣點  

- 優點
    - 當測試失敗時, 你會很清楚就是你測試的程式邏輯出了問題  
        因為你都把其他內部 dependency 都 mock 掉  
        所以會知道就是測試的程式有問題
    - 撰寫測試時, 只需要根據 Code Base 去寫相對應的 Unit Test
        例如說 A Class 用到 B Class 和 C Class 這兩個內部 dependency
        Unit Test 就是寫出 A Test, B Test, C Test 這三個相對應得測試程式
- 缺點
    - 會過度使用 mock 機制, mock 大量內部 dependency 的程式
        可能會導致最終程式跑 Integration Test 時直接炸裂
    - 每個 Unit Test 跟 Code Base 基本上是 1:1, 這會導致重構時大部分的 Unit Test 也需要被翻新
    - 測試時可能會跟文件定義的測試案例過度不符合
        因為專注在 unit of code, 所以程式中會大量測試使用者不在意的測試結果
        這會導致過度去測試實作邏輯

### Unit of behavior 優劣點
- 優點
    - 從使用的人角度去注重程式產生的行爲, 能夠有效驗證結果
        加上因為不會 mock 內部 dependency 的程式, 只會 mock 外部 dependency
        內部再程式的 Business Logic 可以較完整被執行
    - 寫 Unit Test 時不需關注其他內部 dependency 程式的實作邏輯
        就像上面提到的 hash function, 寫 unit test 時不需針對 hash function 去撰寫  
        就可以避免重構 hash function 時導致 unit test 也要跟著重寫
- 缺點
    - 因為不會 mock 內部 denpendency, 所以執行 Unit Test 錯誤時
        可能會較難判別錯誤是出現在哪裡
        但如果是所有測試案例都失敗的話, 很有可能就是共用的內部 dependency 出錯
        這樣反而是優點, 因為就代表此 dependency 影響範圍是全體程式碼

## 後記

當然這不是誰優點多就選誰  
這兩個也只是一個名字去代表不同 Unit Test Style  
當你今天寫了一個 SDK 裡面有一個 `add(a,b)`function 給別人使用  
試問, 你測試這個 add  function 是 unit of code 還是 unit of behavior ?  

不過依照本書的立場, 大多數的專案是建議走 unit of behavior 的方式進行  

從這篇知道了 Unit Test 是什麼以及測試的範圍  
但要怎麼知道『一個好的 Unit Test』是什麼樣子?  
來看看下一篇[什麼樣是一個好的 Unit Test? 該從怎麼層面思考?](/2020/09/21/unit-test-best-practice-part-2/)