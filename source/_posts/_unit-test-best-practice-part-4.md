---
title: Unit Test 實踐守則 (四) - 如何寫出一個好的 Unit Test?
categories: Test
date: 2020-10-05 10:22:57
tags: [test, unit test, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

上一篇我們會討論了 [為何 Unit Test 前需要先重構原始碼? ](/2020/09/28/unit-test-best-practice-part-3/)  
接著我們就要進入正題了  

## 如何寫出一個好的 Unit Test

我們拿上一篇重構完成之後的程式碼來寫寫看 Unit Test  

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

在此範例中看到了 arrange, act 以及 assert, 這是著名的 3A pattern  
然後透過上一個重構的步驟, 把重要的 business logic 抽出來了  
接著要針對此 business logic 進行測試  
下面來解釋各個步驟代表什麼意思  

### Arrange

這是準備階段, 準備一些關於待測程式的資料以及結果  
通常這個階段會有很大量的程式碼存在  
包含設置 Test Double 去 Mock/Stub 一些外部資源, 像是資料庫或第三方 API 之類  
Mock/Stub 就像是前面提到過的範例, 可以更改程式回傳的邏輯  
詳細可以參考之前寫過一篇有介紹 [Test Double](https://yu-jack.github.io/2019/12/10/unit-test-express/#test-double-測試替身)  

### Act

在這個階段, 通常只會有一行程式碼  
這一行程式碼, 就是代表外部使用的行為  
像是範例中, 使用者是做『輸入帳號密碼』這個行為, 所以我們只會呼叫 `login` 而已  
而如果是 Unit of Code 的情況下, 通常也只會有一行程式碼  
像是測試 `hash` function 的行為, 我們也只會呼叫 `hash`  

這階段出現多行程式是不建議的做法, 會帶來以下幾項缺點  
1. 當 Unit Test 失敗, 很難分辨到底是呼叫哪一個行為導致失敗
2. Code Base 可能設計不夠良好, 沒有足夠的封裝

### Assert

在 Unit of Code 的結果中, 通常只會有一個單一結果要驗證  
但在 Unit of Behavior 的結果中, 是會有多種結果需要驗證  
所以在這個階段, 程式碼不一定只會有一行, 是會有多行的可能性  
取決於你怎麼定義你的 Unit Test 的結果  

除了以上 3A Pattern 之外, 其實還有最重要的部分  
也就是 unit test 的名字內容寫法  

因為這個結果是給人在看的, 萬一寫的不清不楚  
接手的人也不知道這個 unit test 到底在測試什麼東西  
就會間接導致, 接手的人不知道這個 unit test 測試什麼, 於是寫了一個新的 unit test   
結果這兩個 unit tes 在測試一模一樣的東西, 這就有點尷尬了  
那我們來說說怎麼寫比較適合  

### Unit Test 的名字內容寫法  

這邊特別申明一下  
因為書中是使用 C#, 所以 unit test 名稱就是 function 名稱, 這跟 java 也很相似  
這邊會以書中的範例為主, 至於 js 的會在最後面用另一篇個觀點來描述  
所以我們先看看書中 C# 的寫法吧！  

書中針對 unit test 名字有以下三個 guidelines  

1. 不要遵守死板的命名規則
2. 在命名測試的時候, 當成要描述一個情境給一個不懂程式, 但卻懂這個 domain knowhow 的人聽
3. 把每一個文字用下底線(_)去區分開來

讓我們先看看第一個 unit test 的名字  
這個範例是名稱是 `IsDeliveryValid_InvalidDate_ReturnsFalse`  
這個代表是說, 當帶入了一不合法的日期時, 這個驗證日期要回傳 false  
```c#
public void IsDeliveryValid_InvalidDate_ReturnsFalse()
{
    DeliveryService sut = new DeliveryService();
    DateTime pastDate = DateTime.Now.AddDays(-1); 
    Delivery delivery = new Delivery(pastDate);
    
    bool isValid = sut.IsDeliveryValid(delivery);

    Assert.False(isValid); 
}
```

我們試著以上述第二點重新去轉換變成如下  
`Delivery_with_invalid_date_should_be_considered_invalid`  

看起來好多了, 對吧?
不過 ... 什麼是 invalid date?  
所以在近一步更新這個 unit test 名字變成如下  
`Delivery_with_past_date_should_be_considered_invalid`  

不過還有一些贅字要調整  
像在不合法就直接說不合法就好, 不用強調 `be considered invalid`  
所以會變成如下  
`Delivery_with_past_date_should_be_invalid`  

這樣看起來就完美多了  
不過最後在書中, 有提到因爲測試是「敘述一件事實』  
所以不應該有 should 存在, 最後會變成如下  
`Delivery_with_a_past_date_is_invalid`

最後這段就見仁見智了  
個人覺得可以不必遵守到最後一段  
就像上面第一點 guidelines 提到的, 不要遵守死板的命名規則  
因為有時特意遵守死板規則, 可能會導致別人看不懂  

但其實在修改敘述過程中, 就很像在校稿一樣  
你要把內容調整成有明確意思, 且容易讓別人看懂的方式  

寫 js 的人看到這邊一定很問號, 那 describe-it 的話要怎麼寫！？  
其實別慌張, 做法其實跟他的 guidelines 一樣  
試著在寫 describe-it 的內容時, 當成是在跟不懂程式, 但懂 domain knowhow 的人說明情況  
以上面例子就會變成  
`descrit("When delivery is given a past date, it should be invalid")`

那因為 describe-it 可以進行分層, 所以分層可以根據 [javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices#-%EF%B8%8F-112-categorize-tests-under-at-least-2-levels)  
這種概念來進行分層, 執行下來會有以下兩張圖的差距  
是不是右邊讀起來比較易讀? 但要注意的是, 分層的名字記得也要分得有意義  

![](/images/unit-test/unit-test-best-practice-07.png)  


### 額外注意事項

除了以上介紹部分, 書中還提到一些額外要注意的事項  

1. 避免 if-else 出現在 Unit Test 之間
    出現 if-else 就代表了, 把實作邏輯帶來到 Unit Test 這也會帶來相對應的缺點
    例如說這個 Unit Test 在重構的時候, 很有可能就非常容易壞掉

2. 提到了實作邏輯, 在 Unit Test 中盡量不要出現實作邏輯
    這些實作邏輯應該是要包在 Code Base 裡面的才對
    以下面程式為例子, `exceptedResult` 不應該用 1+1 的邏輯去賦予, 而是應該直接給予 2
    類似這種算是實作邏輯, 書中是不建議這種邏輯出現在 Unit Test 中
    像是遇到重構的時候, 就連同 Unit Test 邏輯都要調整
    ```js
    // 不適合的做法, 因為暴露出實作邏輯
    describe("when 1+1, result should return 2", () => {
        // arrange
        const exceptedResult = 1 + 1
        
        // act
        const actualResult = add(1, 1)

        // assert
        expect.equal(actualResult, exceptedResult)
    })
    ```

## 後記

看到這邊可能會產生兩個疑惑  

1. 那除了 business logic 以外都不用寫 unit test 嗎?  
    如果測試切入點從 controller 開始, 然後對 mock/stub 資料庫去做 unit test 不也是可以?  
2. 文章中有提到 Test Double, 但好像沒有說用在哪或是怎麼使用比較好?  

以上這兩點會在下一篇[如何有效使用 Test Double ](/2020/10/12/unit-test-best-practice-part-5/)解答
