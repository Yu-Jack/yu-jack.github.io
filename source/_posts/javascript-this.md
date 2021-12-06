---
title: JavaScript this 是什麼? 如何運作的呢?
categories: JavaScript
date: 2019-04-24 23:09:32
tags: [JavaScript, this]
header-img: /images/banner.jpg
catalog: true
---

## 前言

相信寫過 js 的人對於 this 都有一定的認識  
但要搞懂它真的不容易，js 的 this 並沒有其他語言的 this 那麼單純  
所以這邊要一步一步的去展示並介紹 js 中的 this 到底是怎麼一回事  
以及最後面教學如何一步一步判定 this 會是指向什麼

<!-- more -->

## this 是什麼 ？

this 單純看英文解釋的話，是代表『自身』  
聽起來好像有這麼一回事，但實際上使用起來根本不是這樣  
實際上 js 中 this 代表的是執行時的對象，並不代表自身  
簡單來就說就是找*函數被調用的位置*  

讓我們看看以下的範例

```javascript
function foo(num) {
    console.log( `foo: ${num}`)
    this.count++;
}
foo.count = 0;
for (let i = 0; i < 10; i++) {
    if (i > 7) {
        foo(i);
    }
}
// foo: 8
// foo: 9
// foo 被調用多少次
console.log(foo.count) // 0 --- ??? 為什麼是 0 ??
```

雖然 console.log 真的有跑出來 foo 的兩個輸出  
但 foo.count 卻還是 0  
這其中的原因是，真正執行 foo 調用的位置的地方是*全域(瀏覽器中為 window 物件)*
注意到這點回去可以執行這行 `window.count` 會發現為 NaN，卻不是 undefined  

那我在這邊該如何去把 `this.count` 綁定到我的 `foo.count` 上面呢?  
這裡可以透過 `fn.call(thisArg, arg)` 的方式把我們的 this 綁定到 foo 上面  
在 for loop 之中調用 foo 得方式更改為 `foo.call(foo, i)` 就可以完成綁定  
重新執行以上的程式就會發現 `foo.count` 變成 2 了！

然而要如何尋找呼叫位置以及善用 this 就是一件學問了  
而用 this 有什麼好處? 看看以下這段 code  

```javascript
function foo(num) {
    console.log( `foo: ${num}`)
    data.count++;
}
var data = {
    count: 0
}
for (let i = 0; i < 10; i++) {
    if (i > 7) {
        foo(i);
    }
}
// foo: 8
// foo: 9
// foo 被調用多少次
console.log(foo.count) // 2
```

沒有用 this 去做綁定，而是用一個變量的方式去儲存  
雖然這樣一樣看達到效果，但這看起來就不太簡潔未來要重複使用也很不方便  
而這就是學好 this 的好處之一  

看到這邊應該會 this 有簡單的理解了  
那對於以下這段 code 應該就能清楚知道會出現什麼結果了  

```javascript
function identify() {
    return this.name;
}
function speak() {
    var greeting = "I 'm" + identify.call(this);
    console.log(greeting)
}
var me = {
    name: "Jack"
};
var you = {
    name: "Reader"
}
identify.call(me) // Jack
identify.call(you) // Reader

speak.call(me) // Jack
speak.call(you) // Reader
```

## this 綁定規則

前面提到要如何去找到調用位置是重要的事之外  
還要理解 js 中是有哪些規則去綁定 this 的  
以下會開始介紹 js 的幾種綁定方式  
但就個人來說，盡量使用顯示綁定的方式去把 this 綁定到對的對象上面才是正確的做法  

### Default Binding (默認綁定)

這條為無法應用其他規則的時候，默認會出現的綁定模式  
請看以下的 code  

```javascript
function foo() {
    console.log(this.a);
}
var a = 2;
foo(); // 2
```

這邊可以注意到 `var a = 2` 是在全域下的一個全局變量  
所以裡面的 `this.a` 是指向到全域的變量 a  
還有個方法可以確認說有沒有真的綁定到，可以透過 `use strict` 嚴格模式去做測試

```javascript
function foo() {
    "use strict";
    console.log(this.a);
}
var a = 2;
foo(); // TypeError
```

### Implicit Binding (隱式綁定)

這條隱式綁定的規則，則是要取決於上下文  

```javascript
function foo() {
    console.log(this.a);
}
var obj = {
    a: 2,
    foo: foo
};
var bar = obj.foo;
var a = "HIHI"; // Global
bar(); // "HIHI"
```

雖然 bar 是 obj.foo 的一個引用，但實際上它是對應到 foo 上  
還有一種狀況很特別，當把 function 當成 args 傳進去執行  

```javascript
function foo() {
    console.log(this.a);
}
function doFoo(fn) {
    fn()
}
var obj = {
    a: 2,
    foo: foo
};
var bar = obj.foo;
var a = "HIHI"; // Global
doFoo(obj.foo); // "HIHI"
```

這邊可以發現當把函數存進去後, `obj.foo` 的 `this` 是被綁定在 global 上  

### Explicit Binding (顯式綁定)

顯式綁定會透過三個函數去使用  
`call` `apply` `bind` 的方式去做到這件事  
做法的話，前面應該有看到過了，這邊重新複習一下

```javascript
function foo() {
    console.log(this.a)
}
var obj = {
    a: 2
};
foo.call(obj); // 2
```

這邊可以注意到我們把 foo 裡面的 `this.a` 綁定到 obj 上面了  

### new Binding

先說明 js 之中的 new 和其他 class 類型的語言是完全不一樣的東西  
在 js 之中使用 new，並不會真的屬於什麼類或是實例化一個類 (嚴格來說 js 中也沒有所謂的類，全部都是物件)  
而在使用 new 的時候會有以下幾個步驟  

1. 創建全新物件
2. 新物件會被執行原型鏈的連接
3. 新物件會綁定到函數調用的 this
4. 如果函數沒有返回其他物件，那麼 new 會自動返回這個新物件，若有返回其他物件，則替換掉新物件

```javascript
function foo(a) {
    this.a = a;
}
var bar = new foo(2);
console.log(bar.a); // 2
```

以上的範例來說明上面的四個步驟  
bar 為 *創建全新物件*，建立出 bar 之後會對 Object 的*原型鍊做連接* (這裡暫時不提)  
因為 bar 為新物件，所以根據*新物件會綁定到函數調用的 this*  
這時 bar 就會被綁定在 foo 函數裡面的 this 去了  
那因為在使用 `new foo(2)` 時，並沒有*返回其他物件*，所以這裡會把 bar 回傳回去  
但如果這時有返回其他物件，這時候就會把 bar 也改替換掉了  
這時第三步原本是把 this 綁定在 bar 本身，這時會變成綁定在其他物件身上  
參考以下 code  

```javascript
var test = {
    a: "hihi"
}

function foo(a) {
    this.a = a;
    return test;
}
var bar = new foo(2);
console.log(bar.a); // "hihi"
```

不過如果回傳的並不是物件的話，狀況又會不一樣了

```javascript
function foo(a) {
    this.a = a;
    return 1;
}
var bar = new foo(2);
console.log(bar.a); // "2"
```

## 後記

這是看完 You don't know JS 後做的一篇整理  
如果有任何錯誤歡迎指教！  
而整本書對於 this 的解釋非常詳細，如果有興趣的讀者可以找找這本書看看原文是如何寫的吧！  
後續會再找時間整理關於 prototype (原形鏈) 的原理