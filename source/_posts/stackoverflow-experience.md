---
title: Stack Overflow 回答體驗心得以及如何問好問題
categories: Experience
date: 2020-12-01 22:02:44
tags: [Stack Overflow, experience]
header-img: /images/banner.jpg
catalog: true
---

## 前言

說到 Stack Overflow 工程師們一定不會陌生  
這是從小(?)看到大的一個網站  
有問題就估狗找一下, 很多解答都會在 Stack Overflow 裡面出現  

最近假日閒來無事, 想著不如我也來上去貢獻回答看看別人好了  
就這樣開始回答問題了, 大概花了三個禮拜在上面找問題回覆  

不過使用 Stack Overflower 之後  
一直以為 Reputation 越高, 就是回答問題越多, 但實際上不是  
Reputation 的增加, 是透過回答問題, 問問題以及修改別人的問題或是答案來加分  

而在這過程中, 也發生過問的問題不精準又或是沒提供詳細的資訊  
導致回答的人很難去回答問題, 這裡會在後面介紹案例  
介紹完案例之後, 會根據每一個問問題的案例中所缺少的要點  
整理成如何問好一個問題做結束  

## 簡單機制介紹

### 分數計算  

最基本的問問題是無法獲得分數的  
而回答或是問題, 並且被其他人 Upvote 的話可以得到 10 分  
Downvote 則是會 -2 分  
若被發問者選為最佳解答, 則是額外再加 15 分  
所以單純回答問題是不會有任何分數的  
另外 comment 也是完全不會算分數的唷  
其他詳細可以看官網寫的機制 [What is reputation? How do I earn (and lose) it?](https://stackoverflow.com/help/whats-reputation)  

### Privilege

除此之外, 隨著 Reputation 越高, 可以做的權限越多  
例如他會出一個 Review List 讓 Reputation 高的人去審閱說問題是否清楚  
或是第一次貼文的文章內容有沒有需要改善  

以下圖來說, Stack Overflow 就會把第一次發問的文章讓你去 Review 看問得好不好  
若像是沒有加 tag 或是語意不通順, 都可以幫發問者修改  
若修改成功, 也會獲得額外的分數  
[官網](https://stackoverflow.com/help/privileges)有列出所有權限可做的事情, 有興趣可以看看  

![](/images/stackoverflow/01.png)

### Badge

至於 Badge 的部分, 分成『金』『銀』『銅』三種  
例如說第一次回答問題之後, 就會獲得『Teacher』銅牌 Badge 
第一次問問題的話, 就會獲得『Student』銅牌 Badge  
但也有像是一天獲得 200 以上 Reputation 的 Badge  
[官網](https://stackoverflow.com/help/badges)有列出所有 Badge 有興趣可以看看  

### Profile 頁面

那因為回答和問問題都會算分, 所以從分數上很難判別這個人到底是很會回答還是很會問  
所以在 Profile 的頁面可以看到這樣的結構  

![](/images/stackoverflow/02.png)

javascript tag 右邊可以看到 score 和 post 的數字  
post 越高, 代表這人關於 javascript tag 的相關文章越多  
score 越高, 代表這個人回答 javascript tag 獲得的 upvote 越高  
以上圖來說, 回答 javascript tag 的文章有 19 篇, 獲得的 upvote 則有 18 個  

## 心得

個人算分如下 (截至 2020-12-01)  
初次登入獲得 1 分  
透過回答獲得 590 分 (35 篇回答, 35 upvote \* 10, 16 best answer \* 15)   
修改文章獲得 8 分  
目前總計為 599 分  

<a href="https://stackoverflow.com/users/8871569/jack-yu"><img style="margin: 0" src="https://stackoverflow.com/users/flair/8871569.png?theme=clean" width="208" height="58" alt="profile for Jack Yu at Stack Overflow, Q&amp;A for professional and enthusiast programmers" title="profile for Jack Yu at Stack Overflow, Q&amp;A for professional and enthusiast programmers"></a>

> 上面這是 iframe 去嵌入 Stack Oveflow 的頁面, 所以會隨當前分數變動  

那根據問題和答案類型可以分成以下幾種類型  
每一個案例都會挑我有回答過的去介紹  
1. 語言特性
2. 使用工具或是服務
3. 原理
4. 資料結構
5. 不精準提問
    這裡會介紹幾個案例是筆者透過 comment 一來一往才問到發問者真正想解決什麼問題  


### 語言特性

筆者是比較熟悉 javscript & node.js 所以問題都是挑這些居多  
目前最常遇到的就是對 async-await 和 promise 的機制不熟悉的狀況  
這種問題都相對單純一點  

**<span style="color: red">案例一</span>**
以下是對 async-await 流程不熟悉
1. [nodejs async/await placement for multiple functions](https://stackoverflow.com/questions/64718096/nodejs-async-await-placement-for-multiple-functions/64718306)
2. [How to handle async forEach, pass results into database and then render complete data set](https://stackoverflow.com/questions/64739519/how-to-handle-async-foreach-pass-results-into-database-and-then-render-complete/64739568#64739568)

**<span style="color: red">案例二</span>**
以下是對 promise 使用不了解
1. [How can return false value promise method in node if array is empty and vise versa](https://stackoverflow.com/questions/64735740/how-can-return-false-value-promise-method-in-node-if-array-is-empty-and-vise-ver/64736170#64736170)

**<span style="color: red">案例三</span>**
接著是混合兩者, 不清楚 node.js 本身應該要怎麼去實作 callback 或是 promise  
1. [How to implement a callback in Node's app.get function?](https://stackoverflow.com/questions/64712352/how-to-implement-a-callback-in-nodes-app-get-function/64712643)

這些回答起來都相對單純, 因為這幾個問題都有附上程式碼  
所以一看程式碼很快就知道問題出在哪裡  

但像是這個問題 [nodejs async/await placement for multiple functions](https://stackoverflow.com/questions/64718096/nodejs-async-await-placement-for-multiple-functions/64718306)  
其實發問者也已經提供很完整的思路跟想要問什麼  
他是可以在本地實驗跑看看結果會產生什麼, 就可以不用到 Stack Overflow 上來了  

### 使用工具或是服務

工具定義指的是類似 express ejs pug 等等其他第三方套件  
服務定義指的是其他第三方 API 或是 AWS 這種  
這邊的問題就相對比較麻煩, 因為如果沒有實際使用過很難回答  
但有些問題是可以透過查詢官方文件就能夠回答的問題  

**<span style="color: red">案例一</span>**
有個問題是 [NodeJS cloudinary search API by context](https://stackoverflow.com/questions/64841164/nodejs-cloudinary-search-api-by-context/64841188) 關於 cloudinary 的 API  
實際上筆者也沒有串過, 於是特別為了這個問題去申請帳號去測試  
但有趣的是, 在文件上和使用方法上, 真的沒有一個可以達到這個人的目的  
我還特地去翻 Node.js SDK source code 看官方怎麼寫和最後 API 怎麼打的  
但當下真的沒有找到, 隔了一兩天去估狗才找到真正的用法  
而且這用法的教學, 還是在 Stack Overflow 上面發現的 XD  
才知道原來是這種用法官方文件沒有特別標註起來, 所以很難發現使用方法  

**<span style="color: red">案例二</span>**
另一個問題是關於 AWS Amplify  
[ExpressJS using EJS fail to load static assets when deployed on AWS Amplify](https://stackoverflow.com/questions/65006304/expressjs-using-ejs-fail-to-load-static-assets-when-deployed-on-aws-amplify/65031304#65031304)
但不巧的是, 筆者也沒有用過, 所以一開始回答是針對他的資料夾結構去判斷哪裡可能出了問題  
到後面透過 comment 一問一答, 才發現原來他想要的是 serverless 的架構  
而我一去查才發現 Amplify 其實是沒辦法達到他 express +  ejs 的需求  
其實在 Amplify faqs 裡面, 有詳細的講到 Amplify 是適用於哪一種服務  
這裡筆者犯了一個小錯誤, 其實應該要先看 Amplify 適用於哪一種服務, 就可以在第一次回答解決他的問題了  

> 若是真的有 express + ejs 解決方案也歡迎分享給我  

**<span style="color: red">案例三</span>**

這個是關於 express + pug 的使用方式  
[Trying to iterate over JSON in Pug but keep getting length error](https://stackoverflow.com/questions/64879071/trying-to-iterate-over-json-in-pug-but-keep-getting-length-error/64887884)  
發問者雖然有看文件, 但看的地方卻看錯了  
因為他給的範例程式碼有用到 `app.get` 所以應該是要搭配 express  
但他卻說他用 `cli` 去 render pug 頁面, 這樣就跟他給的程式碼有所衝突  
這就回答他該怎樣一步一步做去正確做到  
其實很多文件的 Getting Started 都寫得很清楚, 只要從 Getting Started 開始看基本上都是能用的  
像這個 pug 的官方文件的 Getting Started 就有提到要安裝 express  
只是它可能沒有一步一步的去說明, 導致有些初學者會搞混使用方法   

### 資料結構

這類型問題大多是從某個資料結構要轉成另一個資料結構  
但發問者可能不知道怎麼轉比較好  

下面就是處理資料結構轉換的相關問題, 都是蠻單純的轉換  
1. [Merging objects from array with the same key value](https://stackoverflow.com/questions/64798626/merging-objects-from-array-with-the-same-key-value/64798714)
2. [How to merge two array and sum their value?](https://stackoverflow.com/questions/64710800/how-to-merge-two-array-and-sum-their-value/64710928)
3. [How could I separate each JSON object and group them to an array in JavaScript?](https://stackoverflow.com/questions/65090523/how-could-i-separate-each-json-object-and-group-them-to-an-array-in-javascript/65090703)

這類型的題目很有趣, 可以看到很多人一起回覆  
每個人的寫法都會很不一樣, 有點像是另類的 LeetCode  
有趣的是, 上面的人回答大部分很喜歡用 `reduce` 去回答  
有可能是倖存者偏差, 剛好那些問題都是很適合用 `reduce` 去解答(?  
而且每次我一按送出, 瞬間就會多出其他 2-3 個答案, 根本就搶答案大賽 XD  

另外有些人寫法會用那種 one-line program 去回答  
不過個人很不喜歡 one-line program  
雖然使用上方便, 但到最後扯到維護或是接手的人能不能看得懂 code 又是另一回事  
除非不會有人接手一次性專案, 那就可以考慮看看了 XD  
這類型回答我都會偏向寫的比較通俗易懂和避免時間空間複雜度太高的問題   
寫扣簡單, 寫出大家都看得懂的扣才是高手 XD  

### 原理

原理指的是程式運行的原理, 這跟語言特性也會有相關性  
但因為問的問題是屬於應用類性, 並不算語言特性  
那因為原理不了解導致應用錯誤, 所以就歸類在此類  

**<span style="color: red">案例一</span>**
接著是 [sending POST request to express route - after receiving form data, res.render is not triggered](https://stackoverflow.com/questions/64766209/sending-post-request-to-express-route-after-receiving-form-data-res-render-is/64769482)  
這就是對於 Ajax 和 Form submit 機制的不熟悉  
值得一提的是, 還好他內容有寫一句話 `(through fetch)` 不然我可能會很難回答他的問題
有興趣可以看看原本的內文, 而這篇的回答, 改天有時間再寫另一篇文章起來  

**<span style="color: red">案例二</span>**
接著是 vue + express 組合的運行問題  
[When express and vue js are connected, the default address is accessed](https://stackoverflow.com/questions/64779038/when-express-and-vue-js-are-connected-the-default-address-is-accessed/64779174)  
一般來說寫 vue 比較難跟 express 扯上關係  
但如果要用 express 去 hosting vue 的東西, 但又要保留原本 exprss api 甚至 ejs/pug redner 機制的話  
這會需要額外的調整, 但在調整之前要先了解請求進來後怎麼運行的才有辦法設定  
所以針對這個問題去解釋整個原理, 而這篇的回答也會在挑個時間寫成一篇文章  

**<span style="color: red">案例三</span>**
再來是 express + csurf 的問題  
[CSRF doesn't work on the first post attempt](https://stackoverflow.com/questions/64869650/csrf-doesnt-work-on-the-first-post-attempt/64877159)
這個題目其實蠻有趣的, 花了我一點時間研究才發現, 原來是 csurf 本身這個套件 bug 導致這個問題的 (cookie 模式下)  
這會歸類在原理的原因是, 這問題牽涉到的是 csurf 底層實作的原理有關  
只是後來這個發問者是透過把 cookie 模式改成 session 模式去避免掉這問題  
並把原因歸咎在 session 跟 cookie 一起使用後導致的結果, 但實際上不是這樣  
單純只是 csurf 底層實作機制導致的 bug 而已  

個人還蠻喜歡回答這類型的題目  
一來是重新省思自己有沒有真的了解原理  
二來是要用淺顯易懂以及舉例的方式去說明原理  
 
### 不精準提問

不精準提問指的是問問題的人沒有適當的表達想要的東西以及為什麼要這樣做  
又或是沒有提供相對應的資訊  
又或是本身問題方向就已經偏了  

以上狀況都可能導致回答問題的時候, 沒有辦法短時間內成功回覆  
必須透過長時間一來一往的 comment 才能找到問題本質  
下面案例會看到問問題的人都會被 downvote, 可見在別人看來這問題不是很好 (我是都沒有 downvote 別人拉 XD)  

**<span style="color: red">案例一</span>**
[Vanilla JS Unexpected token A in JSON at position 141 json.parse()](https://stackoverflow.com/questions/64892989/vanilla-js-unexpected-token-a-in-json-at-position-141-json-parse/64893106)  
題目是問 JSON.parse 的問題, 但其實他不是要問這個  
他真正想做的是要比對使用者點擊的文字和儲存的資料是否一至這件事  
並且要正確顯示 `&quot;` 這個符號在頁面上  
導致讓我第一次的回答沒有回答到他想要的結果上  
因為他真正的目的是別件事, 並不是問題所描述的    

**<span style="color: red">案例二</span>**
再來原本的題目是 [How to use esprima? (Or how to insall a nodejs module?)](https://stackoverflow.com/questions/64859917/how-to-use-a-global-nodejs-module/64859983)  
看了他提出的問題發現他是用 `npm install -g esprima` 去裝模組  
導致他執行的那個 js 讀取不到, 資料架底下的 node_modules 然後就跟他說不能用 `-g` 去裝  
結果他回答卻是說, 他希望裝一次就好, 然後任何地方都要可以使用  
經過這樣確認後, 就知道他的問題應該是如何 require global module  
所以最後他就把題目改成『How to use a global nodejs module?』  
所以這也是一樣, 並不知道他是為了什麼而想要做這件事情, 文章內容也沒有特別提到  
導致第一次回答不是他要的  

**<span style="color: red">案例三</span>**
再來是本身問問題方向就稍微有點錯誤, 但我還是嘗試通靈去解答, 結果還真的被矇對  
[Changing JSON values with fetch](https://stackoverflow.com/questions/64707887/changing-json-values-with-fetch/64707951)  
他的問題是用了 fetch api 之後, 原本用 `archive: true` 狀態沒有更改, 但用了 `read: true` 卻可以  
這其實很困惑, 因為也不知道是改資料庫內容還是改了什麼內容  
但幸好他有提供一段使用 fetch api 的程式碼, 一看發現程式碼放的位置不是在 `then` 裡面  
所以是因為還沒等到 server response 就直接呼叫其他 function, 導致看起來狀態沒有更改到  
這種就屬於資料提供不完整  

## 如何問好問題

所以問問題真的是一種技巧, 要在問問題前要先做兩件事情
1. 先 Google 過, 中英文都要
    有時候關鍵字不同查到東西也不一樣  
    特別是中英文的關鍵字
2. 翻翻官方文件, 大部分的官方文件其實都會提到一些細節甚至到理論  
    先去官方文件走一趟也是一種方式

接著才是到真正問問題的地方, 注意以下幾點, 才不會造成無謂的一來一往而浪費時間 
1. 明確告訴別人你『為什麼』想做這件事情, 不要成為 X-Y 問題者  
2. 除了為什麼, 也要告知別人『預期想要結果是什麼』
3. 已經試過哪一些 solutions, 以及目前得到的結果是什麼  
    先提過試過的 solution 以及明確得到的結果, 回答問題的人比較能夠知道問題出在哪
4. 盡力準備足夠的資訊, 並在問問題的時候一併附上  
    但有些事是真的很難確定要提供什麼資訊上去才真正有用
    這個就需要一點經驗去判斷, 大體來說是什麼樣的資料會影響到你目前的流程
    就可以把相對的資料提供上去好讓別人參考
    但要注意, 不要一股腦地全部就貼上去, 貼『重點』就好
5. 不管是文字或是當面問問題, 需要把問題順過一次, 以邏輯最清楚的方式去問別人
    不過文字的部分, 一定要注重排版, 例如說程式把一定要用 code block 去弄
    若是直接貼純文字版本, 看的人也會很痛苦  
    問問題的人是有責任讓要回答的人看得舒服且清楚的 (個人經驗  
6. 最最最最重要的一點, 一定要有禮貌  
    但不是說直接把程式碼丟上去, 其他內容也沒打詳細  
    然後最後留一個謝謝, 這樣不叫做禮貌喔 XD  

而回答問題的人, 其實也是需要技巧  
當回答問題的時候, 有些地方可能想要確認, 所以會經過一來一往的討論  
此時是要問對問題才能引導發問者到正確的癥結點進而找到問題點  