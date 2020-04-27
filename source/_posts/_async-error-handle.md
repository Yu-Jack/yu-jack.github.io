---
title: 如何不用 try-catch 去寫 async/await
categories: JavaScript
date: 2020-05-04 10:14:27
tags: [JavaScript, promise, async, await, nodejs]
header-img: /images/banner.jpg
catalog: true
---

## 前言

在[上一篇](https://yu-jack.github.io/2019/05/02/promise-2/)有討論到如何去寫 async/await 的 try-catch 比較好  
那這篇會注重在另一種不需要 try-catch 的寫法上  

那因為用 try-catch 和不用 try-catch 的場景比較不一樣  
最後面會去比較這兩種寫法的優劣

## 寫法一

先來複習之前提到過的寫法  

```javascript
function test1() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test1 have error.")
        }, 1000)
    })
}
function test2() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test2 have error.")
        }, 1000)
    })
}
function test3() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test3 have error.")
        }, 1000)
    })
}

async function main() {
    try {
        let result
        result = await test1();
        console.log(result);
        result = await test2();
        console.log(result);
        result = await test3();
        console.log(result);
    } catch (error) {
        console.log("get error");
    }
}
main()
```

可以看到透過用 Promise 裡面 reject 的方法, 可以客製每一個回傳的錯誤訊息  
但 ... 如果我不想讓程式執行到 reject 的時候跳到 catch 的地方 (第 33 行), 該怎麼做?  

## 寫法二

這邊程式邏輯是 test1 執行完, 就算有錯誤, 我還是依舊要執行  
並且把 test1 的錯誤帶到 test2 去執行

新的寫法透過解構 Array 的方式可以達成此目的  

```javascript
async function to(promise) {
    return promise.then(result => [null, result]).catch((error) => [error, null])
}

function test1() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test1 have error.")
        }, 1000)
    })
}
function test2(data) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            console.log("test2 handle data: " + data);
            rej("test2 have error.")
        }, 1000)
    })
}

function handleTest1ResultIsNull(error) {
    console.log("handleTest1ResultIsNull's error message " + error);
    return "someConditionalValue"
}

async function main() {
    let error, result
    [error, result] = await to(test1());
    console.log("result: " + result);
    if (error) {
        console.log("get error-1");
        console.log(error);
    }

    if (!result) {
        result = handleTest1ResultIsNull(error);
    }

    [error, result] = await to(test2(result));
    console.log("result: " + result);
    if (error) {
        console.log("get error-2");
        console.log(error);
        return;
    }
}
main()
```

注意到段程式碼  
透過傳進去一個 promise 並使用 then 去取得回傳值  
當 catch 發生得時候, 透過 return 的方法, 讓此 promise <span style="color: red">不會直接噴出錯誤, 而是正常回傳值</span>
```javascript
async function to(promise) {
    return promise.then(result => [null, result]).catch((error) => [error, null])
}
```

然後透過解構 Array 的方式可以取得回傳值  
這樣即使 test1 的 promise 是丟出一個錯誤, 透過此 warpper function  
就可以達成就算有錯誤, 程式還是依舊繼續執行下去  

```javascript
let [result, result] = await to(test1());
```

但這裡帶來一個問題, 如果程式邏輯是 test1 正確的時候回傳 A 值, 錯誤的時候給一個 default 值  
這樣其實不用特別寫一個 wrapper function, 只要稍微更改 test1 裡面的邏輯即可  

## 寫法三

這裡可以看到 test1 裡面改成, 當某一個 error 出現時  
特別去處理此 error, 然後在用 resolve 讓此 promise 正常回傳而不要丟出 error  

```javascript
function test1() {
    return new Promise((res, rej) => {
        let error = "test1 have error";
        setTimeout(() => {
            if (error) {
                res(handleTest1ResultIsNull(error))
            } else {
                res("success")
            }
        }, 1000)
    })
}
function test2(data) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            console.log("test2 handle data: " + data);
            rej("test2 have error.")
        }, 1000)
    })
}

function handleTest1ResultIsNull(error) {
    console.log("handleTest1ResultIsNull's error message" + error);
    return "someConditionalValue"
}

async function main() {
    try {
        let result
        result = await test1();
        console.log("result: " + result);
        result = await test2(result);
        console.log("result: " + result);
    } catch (error) {
        console.log("get error");
        console.log(error);
    }
}

main()
```

## 比較

開始來比較一下兩種寫法的優劣  

### Wrapper function

透過此 wrapper function 是可以方便程式撰寫的時候判斷方法  
可以清楚地去判斷此 error 要 log 什麼, 要不要停止執行, 或是要繼續往下都是非常彈性的  
但缺點就是, 你會寫一堆 `if (error)` 判斷  
這在這種寫法上是無可避免的  

```javascript
async function to(promise) {
    return promise.then(result => [null, result]).catch((error) => [error, null])
}
```

另外有另一種寫法也可以有一樣的效果  
就是把 wrapper function 直接寫在 await 後面一樣可以達到效果  
```javascript
let [error, result] = await test1().then(result => [null, result]).catch(error => [error, null]);
```

### try-catch block

透過 try-catch block 可以輕鬆直接在 catch 的時候去統一處理 error  
但前提是你每一個 promise 裡面的 error 要事先處理好, 而不是交由最外層的 try-catch 去處理  
只是使用者這種方法, 如果 promise 裡面有 error, 但還想要繼續執行  
就必須透過 resolve 的方式去更改程式邏輯, 這點在這也是無可避免的  

```javascript
try {
    await test1()
} catch (error) {
    console.log(error)
}
```

### 總結

兩種寫法應用場景其實不太一樣  
如果邏輯之間是第一個成功, 第二個才能繼續這種, 就很適合使用 try-catch block  
因為你前面錯誤發生, 就直接讓跳出去, 也不需要繼續執行了  

但如果是不管第一個是否成功, 第二個都要繼續執行 (根據第一個執行的結果去處理)  
就適合用此文提到的 wrapper function  

不過要注意一下商業邏輯的部分, 以剛剛的[寫法三](#寫法三)的例子  
是因為 function 回傳值就只有兩種, 所以才可以透過[寫法三](#寫法三)去修改, 就又變成 try-catch 的形式  
只是這種改底層的方式, 如果此 functino 在其他地方邏輯是, 此 function 成功後才能繼續往下跑其他 function  
這樣有可能會讓其他地方邏輯爆掉, 請特別注意這件事  

但如果商業邏輯是不管第一個是否成功, 第二個都要執行這種 (不根據第一個執行的結果去處理)  
其實在寫程式設計上, 這兩種邏輯理論上是可以被拆開的  
因為這兩個是毫無相關性的, 就不用硬寫在同一個地方  

## References

1. [How to write async await without try-catch blocks in Javascript](https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/?fbclid=IwAR3UoAUJ6kAQV0_5s0FbVfLDnKRXoC6I7db40vJV-l9sUU7sL9YuVpXYOLI)