---
title: callback, promise, async/await 使用方式教學以及介紹 Part I
date: 2018-07-22 22:42:27
categories: JavaScript
tags: [JavaScript, promise, callback, async, await, nodejs]
header-img: /images/banner.jpg
catalog: true
---

<span style="color: green">[Update 2019-05-02]</span> 關於 Error Handing 可以看[下一篇文章](/2019/05/02/promise-2/)

這篇主要紀錄 callback, promise, async/await 的使用方式
以及如何從到 callback 和 promise 的 hell world 進入到 async/await 這兩兄弟的世界
建議閱讀的人要有 Javascript 的基礎概念，包括對 non-blocking, event-driven 的觀念有一些涉略

<!--more-->

## Callback

Callback 是 JS 很常用的一種使用方式
簡單來說，就是把 function 當作參數傳進去使用
以下是簡單的使用範例
```javascript=
function test() {
    console.log("This test function is done.")
}
function main(callback) {
    console.log("This is main start.")
    callback()
    console.log("This is main end.")
}
main(test)
// This is main start.
// This test function is done.
// This is main end.
```

但是 callback 使用上往往沒那麼簡單，基本上都會牽扯到 API 相關的用法
所以會變成下面這樣的方式
```javascript=
function test() {
    // 這邊模擬 test 這個 function 去 call 其他 API 要等待的情況
    // 等了一秒後才會執行 console.log 這個函式
    setTimeout(()=> {
        console.log("This test function is done.")
    }, 1000)
}
function main(callback) {
    console.log("This is main start.")
    callback()
    console.log("This is main end.")
}
main(test)
// This is main start.
// This is main end.
// This test function is done.
```

這邊會發現，`This is main end.` 反而先執行印出來了, 這裡牽扯到 non-blocking 的概念, 將會放在別的章節重新介紹
那如果我想要 `This is main end.` 在最下面的話該怎麼做呢?
做法上只要把執行 `This is main end.` 的函示也當成 callback 傳進去就可以按照順序執行下來了
```javascript=
function test(callback2) {
    // 這邊模擬 test 這個 function 去 call 其他 API 要等待的情況
    // 等了一秒後才會執行 console.log 這個函式
    setTimeout(() => {
        console.log("This test function is done.")
        callback2()
    }, 1000)
}
function main(callback) {
    console.log("This is main start.")
    callback(() => {
        console.log("This is main end.")
    })
}
main(test)
// This is main start.
// This test function is done.
// This is main end.
```

用 callback 解決的非同步的問題, 但是當越來越多 callback 串再一起
就會變成 callback hell, 如同下面這樣
```javascript=
function api1(callback) {
    setTimeout(() => {
        console.log("Done with api1")
        callback()
    }, 2000)
}
function api2(callback) {
    setTimeout(() => {
        console.log("Done with api2")
        callback()
    }, 1000)
}
function main(callback) {
    api1(() => {
        api2(() => {
            callback()
        })
    })
}
main(() => {
    console.log("All function is done.")
})
// "Done with api1"
// "Done with api2"
// "All function is done."
```

當越來越多 API 要`按照順序`做下去的時候就會很恐怖了，會變成這樣
```javascript=
api1(() => {
    api2(() => {
        api3(() => {
            api4(() => {
                // bla bla bla
            })
        })
    })
})
```

## Promise

介紹完 callback 之後，一定要介紹他的好兄弟 Promise
Promise 是一個可以對非同步進行處理以及進行各種操作的東西
通常 Promise 會包含三種狀態 `resolve` `reject` `pending`
`resolve` 代表成功 `rejetc` 代表失敗, `pending` 代表還在處理中, 結束狀態未知
以下有兩種方式得知結果
`resolve` 會觸發 `onSuccessful`, reject 會觸發 `onFailed`
`promise.then(onSuccessful, onFailed)`
`promise.then(onSuccessful).catch(onFailed)`
以下是 Promise 的使用範例
```javascript=
function test(number) {
    return new Promise((resolve, reject) => {
        if (number === 1) {
            resolve("Success")
        } else {
            reject("Failed")
        }
    })
}
function main() {
    test(1).then((result) => {
        // result === "Success"
        console.log(result)
    }).catch((error) => {
        // 不會被執行, 因為狀態是成功
    })
    test(2).then((result) => {
        // 不會被執行, 因為狀態是失敗
        console.log(result)
    }).catch((error) => {
        // error === "Failed"
        console.log(error)
    })
}
```

Promise 的基本介紹完之後，一定都會提到一個 Promise Chain 的概念
簡單來說就是我可以一直 `then` 下去，直到海枯石爛, 只要我在 `resolve` 或是 `reject` 的狀態下，`return` 任何東西都可以 `then` 下去
```javascript=
function test(number) {
    return new Promise((resolve, reject) => {
        if (number === 1) {
            resolve("Success")
        } else {
            reject("Failed")
        }
    })
}
function main() {
    test(1).then((result) => {
        // result === "Success"
        console.log(result)
        // return "Next One"
        return test(1)
    }).then((result) => {
        // result === "Next One"
        console.log(result)
    })
}
function main2() {
    test(2).then((result) => {
        // result === "Success"
        console.log(result)
        // return Promise 的物件也是可以的喔
        return test(1)
    }).then((result) => {
        // result === "Success"
        console.log(result)
    })
}
```

但是按照這樣的寫法下去, 又會變成另一種 then hell 的概念
於是接下來出現了 async/await 這兩兄弟

## async/await

`async/await` 基本上是一種語法糖, 把 Promise 的重新包裝起來然後做使用
可以不用再透過 `then` 的方式去執行 Promise
使用方式會變成以下這樣
```javascript=
function test(number) {
    return new Promise((resolve, reject) => {
        if (number === 1) {
            resolve("Success")
        } else {
            reject("Failed")
        }
    })
}
async function main() {
    var result = await test(1)
    // result === "Success"
    console.log(result)
}
main()
```

記得在使用 `await` 的時候, function 前面一定要加上 `async`
所以當我有很多 API 要使用的話, 就會變得很乾淨
```javascript=
async function main() {
    let result1 = await test1()
    let result2 = await test2()
    let result3 = await test3()
}
```

## 結語
這 Part 主要是快速介紹使用教學方式
下一部分會介紹在這三種使用方式裡面是如何做到 [Error Handling](/2019/05/02/promise-2/)  