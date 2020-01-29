---
title: callback, promise, async/await 使用方式教學以及介紹 Part II (Error Handling 介紹)
categories: JavaScript
date: 2019-05-02 22:42:27
tags: [JavaScript, promise, callback, async, await, nodejs]
header-img: /images/banner.jpg
catalog: true
---

上一篇主要是介紹如何使用  
這篇會介紹該如何去在每一種使用方式之中去做 Error Handling  

<!-- more -->

## callback

相信各位有在使用別人第三方套件或是 Node.js 原生的 Library 都會發現一件事情  
那就是 callback 第一個參數都會是 error  
雖然這看似是一個不成文的規定，但仔細想想把 error 放在第一個是非常合理的  
假設當 callback 參數回傳越來越多的時候，總不可能把 error 放在最後一個去處理  
因為你會始終不知道哪一個會是 error (就算寫註解也會讀到瘋掉)  
試想一下這幾段 code 就可以理解了

```javascript
function test(cb) {
    // 當 function 成功後
    cb(successful_data_1, successful_data_2)
}
test((successful_data_1, successful_data_2) => {
    // 開心地處理兩個回傳的資料
})
// --- 分隔線  
function test(cb) {
    // 當 function 失敗後
    cb(error)
}
test((error) => {
    // 咦? 第一個到底是 error 還是我原本的 successful_data_1
})
```

當遇到上面的狀況就會變得非常難判斷，但如果我整體改寫成這樣就會變得輕而易舉  

```javascript
function test(cb) {
    // 當 function 成功後
    cb(null, successful_data_1, successful_data_2)
}
test((error, successful_data_1, successful_data_2) => {
    if (error != null) {
    }
    // 開心地處理兩個回傳的資料
})
// --- 分隔線  
function test(cb) {
    // 當 function 失敗後
    cb(error)
}
test((error, successful_data_1, successful_data_2) => {
    if (error != null) {
        // 開心地處理 error, 於是 data_1 以及 data_2 就完全不用管他們了
    }
})
```

當然有人會說  
『啊我就把所有參數丟到第一個當 Object 全部存起來，第二個就放 Error 也是一種方式啊』  
這樣講的話當然沒錯，但如果把所有東西都放在第一個 Object 裡面  
這樣參數就會有分類，使用問題也只是會徒增而已  
再加上這算是一種共識了，所以跟潛規則走會比較方便一點  

## promise

Promise 處理 error 的方式就比較特別了，我們先來看看一般 promise 出錯的時候是怎麼抓取的  

```javascript
function test() {
    return new Promise((res, rej) => {
        rej("this is error");
    })
}
test().then((data) => {console.log("Get " + data)}).catch((error) => {console.log("handle! " + error)}); // this is error
```

上面為一般 promise 用 rej 的方式，外面用 catch 去抓住這個錯誤  
但凡事要考慮例外，萬一有一個 error 是你沒辦法 rej 到的話，那該要怎麼抓取?  

```javascript
function test() {
    return new Promise((res, rej) => {
        oqiwje() // non-exist function
    })
}
test().then((data) => {console.log("Get " + data)}).catch((error) => {console.log("handle! " + error)}); // this is error
```

會發現當在 Promise 裡面出錯的話，外面的 catch 也是能抓到的  
其原因是因為 Promise 是有被一層內部的 try-catch 給包住  
且在內部的 catch 那一邊套用了預設地 rej function  
所以外面才抓得到

那如果放在 Promise 外面的話呢??  

```javascript
function test() {
    oqiwje() // non-exist function
    return new Promise((res, rej) => {
    })
}
test().then((data) => {console.log("Get " + data)}).catch((error) => {console.log("handle! " + error)});
```

咦!? 竟然抓不到，error 直接噴出來!  
但這也不意外，因為出了 Promise 到了外面  
那就是要透過自己去寫 try-catch 才能抓取到這個錯誤  

```javascript
function test() {
    oqiwje() // non-exist function
    return new Promise((res, rej) => {
    })
}
try {
    test().then((data) => {console.log("Get " + data)}).catch((error) => {console.log("handle! " + error)});
} catch (error) {
    console.log("handled by outer try-catch");
}
```

還有一種 Handle 方式是寫在內層 function 裡面

```javascript
function test() {
    return new Promise((res, rej) => {
        oqiwje() // non-exist function
    }).catch(error => "handle by inner function")
}
test().then((data) => {console.log("Get " + data)}).catch((error) => {console.log("handle! " + error)}); // Get handle by inner function
```

那因為在 inner function 裡面被抓取到，並且回傳  
還記得 promise chain 中，如果 return 的話是會到下一個 then 去的  
所以這邊會被外面的 then 給抓到，而不是 catch，這邊要注意  

Promise 的 Error Handling 只要能確保能執行到 rej 就沒什麼問題了  
然而在 Promise 之前用 try-catch 包起來或程式都丟到 Promise 裡面等他報錯丟出來也可以處理到  

## async/await

await catch error 的方式可以想成一般 try-catch 的方式  

```javascript
function test() {
    return new Promise((res, rej) => {
        rej("QQQ");
    });
}
async function main() {
    try {
        let result = await test()
    } catch (error) {
        console.log("Handled by main")
    }
}
main()
```

而要特別注意的是，如果把 catch 寫在外面的 await 那裡的話  
會造成程式不會往最外層的 catch 前進  

```javascript
function test() {
    return new Promise((res, rej) => {
        rej("QQQ");
    });
}
async function main() {
    try {
        let result = await test().catch(() => {console.log("Handled by await")})
        // 因為有正確被 handle 到，所以程式是會繼續下去執行的
        console.log("Still going")
    } catch (error) {
        console.log("Handled by main")
    }
}
main()
```

但如果透過在 catch function 裡面把 error 再次 throw 出來的話，是可以成功 throw 出來  

```javascript
function test() {
    return new Promise((res, rej) => {
        rej("QQQ");
    });
}
async function main() {
    try {
        let result = await test().catch(() => {
            console.log("Handled by await")
            throw new Error("QQQQ")
        })
        // 因為在上面做 throw error，所以程式不會繼續走下去
        console.log("Still going")
    } catch (error) {
        console.log("Handled by main")
    }
}
main()
```

千萬要注意 return 和 throw 的方式會帶來不一樣的結果  
使用 return 就跟 Promise 的 reject 的狀態下 return 是一樣的  
他會回傳到下一個 then 裡面 (也就是 resolved 的狀態)  

```javascript
function test() {
    return new Promise((res, rej) => {
        rej("QQQ");
    });
}
async function main() {
    try {
        let result = await test().catch(() => {
            console.log("Handled by await")
            return new Error("QQQQ")
        })
        // 因為在上面做 return, 相當於是把結果回傳到 result 裡面了
        console.log(result); // Error: QQQQ
        console.log("Still going")
    } catch (error) {
        console.log("Handled by main")
    }
}
main()
```

而個人比較不建議的寫法是在 await 那一層做 Error Handling  
而是盡量再底層那裡做 throw error 到最外面的 try-catch 去接  
原因是這跟 Design Pattern 有關係  
最外層的 main 可以想像是 Controller，而 test 可以想像成 Facade  
在裡面得程式才是真正的商業邏輯  
從下面程式來解讀的話，回家主要目的是要做功課  
那做功課一定會有流程，像是先吃飯，洗澡，最後在讀書這樣的順序  
但要怎麼吃飯洗澡讀書是要寫在每一個該做的項目的最裡面，而不會寫在順序那一層  
這樣程式撰寫上會比較乾淨一點  

```javascript
function eatFirst() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res("Error");
        }, 1000);
    });
}
function getBook() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res("Error");
        }, 1000);
    });
}
function writeIt() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("Books are ate by dogs!!!");
        }, 1000);
    });
}
async function doHomeWork() {
    await eatFirst()
    await getBook()
    await writeIt()
}
async function main() {
    try {
        let result = await doHomeWork();
    } catch (error) {
        console.log("Handled by main")
    }
}
main();
```

## 後記

這次主要介紹 Error Handling 的方式  
也加了一些個人建議撰寫的方法，如果有其他想法歡迎大家來討論！  