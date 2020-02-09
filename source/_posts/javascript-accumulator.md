---
title: javascript 無限累加器
categories: JavaScript
date: 2020-02-10 00:01:14
tags: [JavaScript, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

最近在 js 群組上面看到一個題目，覺得蠻有趣就順手記錄下來，題目如下  
```javascript
sum(2)(3).sumOf() // 5
sum(2, 3).sumOf() // 5
sum(1, 2)(3).sumOf() // 6
sum(1)(2)(3)(4)(5, 6, 7, 8)(9, 10).sumOf() // 55
```

其實這就是 curry 化的一種變形寫法

## 實作 - 基本 function

先來說說 curry 是什麽樣的東西  
『透過部分參數呼叫一個 function，然後讓此 function 回傳 function 去處理剩餘的參數』  
以下先來個符合題目的範例  
```javascript
let sum = function(x) {
    return function(y) {
        return {
            sumOf: () => x + y
        }
    };
};
sum(2)(3).sumOf() // 5
```

這樣一個簡單的累加器就完成了，但這只也符合兩層  
如果要加到 5 層，程式碼就會長下面這樣  
這種 code 根本不是人看的，接下來就需要另一個概念『遞迴』
```javascript
let sum = function(x) {
    return function(y) {
        return function(z) {
            return function(a) {
                return function(a) {
                    return {
                        sumOf: () => a+b+x+y+z
                    }
                };
            };
        };
    };
};
```

## 實作 - 遞迴  

遞迴的概念就是重複呼叫 function 本身，然後達到某個條件在停止  
所以關鍵在於『需要讓他一直呼叫 function 直到呼叫 sumOf 才停止』  
依照這個概念下去設計，程式碼會如下  
```javascript
let sum = function(x) {
    let all = x;
    let plus = (y) => {
        all += y;
        return plus;
    }
    plus.sumOf = () => {return all}
    return plus;
};
sum(1)(2)(4).sumOf() // 7
```

透過在裡面宣告一個新的 plus function  
並把最一開始傳進來的 x 放在 all 這個 closure 裡面去保存  
然後讓這個 plus function 一直回傳自己就可以達到無限累加的功能  
接下來最後透過賦予 plus 一個 object function  
在最後去呼叫 sumOf 就可以直接回傳總值了  

## 實作 - 無限參數

接下來要解決另一個問題就是無限參數的問題  
可以透過 `args` 把所有參數都帶進來  
```javascript
function test(...args) {
    console.log(args);
}
test(1,2,3,4) // [1, 2, 3, 4]
```

接下來配合 reduce 去把整個 array 加起來  
這樣無限累加器就成功了  
```javascript
let sum = function(...args) {
    let all = args.reduce((p,c)=>p+c,0);
    let plus = (...args) => {
        all += args.reduce((p,c)=>p+c,0);
        return plus;
    }
    plus.sumOf = () => {return all;}
    return plus;
};
sum(1,2,3)(2,3,4)(1,2).sumOf() // 18
```

另外其實這一段程式碼也可以再改寫  
因為這一段跟 sum 的第一行 `args.reduce` 都是一樣的東西  
``` javascript
let plus = (...args) => {
    all += args.reduce((p,c)=>p+c,0);
    return plus;
}
```

這邊可以透過用 bind function  
如此一來，可以把加總的結果再丟到新的 function 去做加總  
```javascript
let sum = function (...args) {
    let all = args.reduce((p,c)=>p+c,0);
    let plus = sum.bind(null, all);
    plus.sumOf = () => {return all};
    return plus;
}
sum(1)(2,3)(3,4,5).sumOf() // 18
```

## 後記

雖然看到題目知道大概就是考 curry 和 clousre 的概念  
但還是會稍微卡一下 XD  
蠻有趣的題目就順手紀錄拉 ~
