---
title: JavaScript 真的是直譯式語言嗎？
categories: JavaScript
date: 2020-03-16 10:00:00
tags: [JavaScript, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

網路上常有人在討論 js 是不是編譯 (compiler) 語言又或是直譯 (interpreter) 語言  
這是一個蠻妙的問題，但要了解這之前，我們必須先談談什麼是編譯語言什麼是直譯語言  

這邊先來個科普，在中國那邊也會把直譯稱之為解釋型語言，所以直譯等於解釋  
下面文章統一都會用直譯去做解釋  

## 編譯語言

被稱為編譯語言有一個特性  
此語言會透過編譯器編譯成另一個語言  
而編譯器是什麼呢?  

先來說說一個情境  
在這個世界中我在 A 國家扮演著一種角色  
這個角色是一個專門的手抄者，做的事情就是專門把英文的書翻成中文書  
讓 A 國的人也能夠讀懂英文的書  
這裡的手抄者，可以想像成就是編譯器的存在  

透過手抄者生產出來的書，還沒有人去讀是不會產生任何效果的  
編譯器也是如此，編譯器把 C++ 等等語言轉變成 byte code  
這個 byte codes 還沒被電腦執行之前，是沒有任何作用的  

所以編譯語言做的事情就是，把 A 語言的程式碼轉換成 B 語言的程式碼  

## 直譯語言

被稱為直譯語言有一個特性  
此語言會透過直譯器直接去執行，並輸出結果
這個直譯器又是什麼呢?  

再來換另一個情境
在這個世界中我是 A 國家的一個角色
這個角色是一個專門的口譯者，做的事情就是專門把英文的語言翻成中文的語言給 A 國的人聽  
讓 A 國的人能夠聽懂英文  

這裡的口譯者總共做了兩件事情  

1. 分析英文語句以及文法  
2. 把分析完的結果轉成中文說出來  

這裡的口譯者，可以想像成就是直譯器的存在  
其實這也跟上述手抄者在做的事情很類似，兩者一樣都是在翻譯一種語言，只是結果不盡相同  

## 簡單總整比較一下

兩者之間的行為差別  

* 編譯器
    把 A 語言轉換成其他可以讓機器執行的 B 語言，但不會去執行，<span style="color: red">產生的結果是語言</span>  
* 直譯器
    讀取 A 語言，並且執行它，不會輸出額外的語言，<span style="color: red">產生的結果是運行結果</span>  

兩者之間的效能

* 編譯器
    會把大多數的時間花在編譯上，而且編譯出來的另一種語言很接近電腦能讀的語言，所以實際上執行的時候效率是很高的
* 直譯器
    會讀取原始碼之後，立刻進行分析，分析完又馬上執行。牽扯到語法分析、編譯成機器能讀的語言、交給電腦執行。要如何把這整個流程進料減少分析以及編譯的次數是效能的一大考量  

> 不管是編譯器或是直譯器，都是會需要詞法以及語法分析


用一張圖來表示編譯以及直譯語言的差別  
![](/images/compiler_interpreter/compiler_interpreter-01.jpg)  
> 圖片出自[你知道「编译」与「解释」的区别吗？](http://huang-jerryc.com/2016/11/20/do-you-konw-the-different-between-compiler-and-interpreter/)  

## js 是哪一種 ?

常常有人說 js 直譯 (interpreter) 語言，因為不需要編譯 (compiler)，而且是直接跑在瀏覽器上  
不像 C++ 那樣需要編譯後才可以執行，所以 js 都是一行一行執行的！  

且慢 ......

你知道 js 裡面有一個 hoisting 的概念嗎?  

> 關於 js hoisting 的文章
> 建議可以看看[我知道你懂 hoisting，可是你了解到多深？](https://blog.techbridge.cc/2018/11/10/javascript-hoisting/)  
> 裡面講得非常詳細

當你執行以下程式是得到 `Uncaught ReferenceError: test is not defined`
```javascript
console.log(test); // Uncaught ReferenceError: test is not defined
```

但當你執行以下程式卻得到 `undefined`
```javascript
console.log(test); // undefined
var test = 1;
```

如果是一行一行執行，那為什麼上面兩者的結果是不同的呢?  
在讀過編譯器和直譯器後，我想各位讀者應該有些答案了  

在主流瀏覽器的實現下，js 『看起來』像是直譯語言  
但在這個黑箱子背後，也是有編譯的步驟存在  
這樣 js 是不是直譯語言呢?  
我們來看看其他地方針對直譯式語言或是 JavaScript 是如何介紹的  

[虚拟机随谈（一）：解释器，树遍历解释器，基于栈与基于寄存器，大杂烩](https://www.iteye.com/blog/rednaxelafx-492667)提到以下這一段話
> 一般在網路上都會看到 Python、Ruby、JavaScript 都是直譯語言，是通過直譯器來實現  
> 這其實很容易造成誤解，語言一般只會定義抽象語義，而不會強制性要求採用某種實現方式  

且在[ MDN Web Docs ](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/About_JavaScript)上面是這樣對 JavaScript 進行介紹的
> JavaScript (JS) is a lightweight, interpreted, or just-in-time <span style="color:red">compiled</span> programming language with first-class functions.  

在[維基百科](https://en.wikipedia.org/wiki/Interpreted_language)上則是這樣對直譯式語言進行解釋的
> Many languages have been implemented using both compilers and interpreters,  
> including BASIC, C, Lisp, and Pascal. Java and C# are compiled into bytecode, the virtual-machine-friendly interpreted language.  
> Lisp implementations can freely mix interpreted and compiled code.  

所以以使用的案例來說，在瀏覽器上的 js 是直譯語言
不過是哪一種，需要看用哪一種方式實現這種語言的執行方式  
因為說到底語言只是定義抽象語義，並無強制要用哪一種類型實現  

前面有提到效率，那是不是 js 效率就很低?  
且慢！看看我們 Chrome V8 大大就完美呈現什麼叫做媲美編譯語言的效能了  
有興趣的可以去看看各種 V8 比較效能的文章  

## 後記

希望這篇有幫助到正在了解 js 是編譯或是直譯語言的小夥伴們  

## References

1. [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/About_JavaScript)
2. [Wiki](https://en.wikipedia.org/wiki/Interpreted_language)
3. [虚拟机随谈（一）：解释器，树遍历解释器，基于栈与基于寄存器，大杂烩](https://www.iteye.com/blog/rednaxelafx-492667)
4. [我知道你懂 hoisting，可是你了解到多深？](https://blog.techbridge.cc/2018/11/10/javascript-hoisting/)
5. [你知道「编译」与「解释」的区别吗？](http://huang-jerryc.com/2016/11/20/do-you-konw-the-different-between-compiler-and-interpreter/)