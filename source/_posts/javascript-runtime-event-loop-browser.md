---
title: Event Loop 運行機制解析 - 瀏覽器篇
categories: JavaScript
date: 2020-02-03 00:01:11
tags: [event loop, JavaScript, browser, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---
## Event Loop (2021-03-14 Updated)

關於 Event Loop 也寫了兩篇, 針對瀏覽器和 Node.js 版本  
透過以下兩篇可以更加清楚了解兩者之間的差異  

Event Loop 運行機制解析 - 瀏覽器篇 (本篇)  
[Event Loop 運行機制解析 - Node.js 篇](/2021/03/14/node-event-loop/)  

## 前言  
網路上有許多文章在討論瀏覽器內 event loop 的機制  
不少文章都有探討到所謂宏任務 (macrotask or task) 以及微任務 (microtask) 東西  
但我開始好奇這東西在瀏覽器內的規範是如何去寫這些東西以及定義這些名詞  
又或是名詞是不是真的跟網路文章說的一樣
於是開始想深入了解，究竟在瀏覽器規範中，是怎麼是對 event loop 去說明的  

如果要開始看規範的話，原本是想針對 ECMA 內的 JS 機制去閱讀  
但深入一看才發現，ECMA 內根本沒有針對 JS event loop 的機制去做說明  
經過一段時間查找後，才發現真正定義 event loop 執行順序以及方法的細節是被歸類在 HTML Living Standard 裡面  

HTML Living Standard 基本上就是規範了瀏覽器內核心該如何實現的一套規則  
[官網在此](https://html.spec.whatwg.org/)，在此規範裡面就有提到 event loop 的機制  

## Processing Model

在 [8.1.4.3 Processing Model](https://html.spec.whatwg.org/#event-loop-processing-model) 完整定義一個 event loop 包含了哪東西  
這邊擷取原文的部分內容  
![](/images/browser/event-loop.png)

先以簡單的方式說明重點步驟  
1. 1 ~ 6 重點在於執行 task queue 內的 oldest task  
2. 7 執行 mircrotask checkpoint
    如果 microtask queue 不為空的話，則會執行 microtask queue 裡面的 microtask
    ![](/images/browser/microtask.png)
3. 10 執行 rendering  

但接下來就要開始問，什麼是 task ? 什麼是 microtask ? 什麼是 rendering ?

## task

task 擁有自己的 task queue，不同於待會提到的 microtask queue
但要注意的雖然叫做 task queue 但這裡的資料結構並不是 queue 而是 sets  
![](/images/browser/task_queue_not_queue.png)

task 主要包含以下職責  

1. The user interaction
    主要是 event callback，像是滑鼠事件的 callback 是屬於此 task 的範疇  
2. The DOM manipulation  
    DOM Manipulation 像是 `document.body.style = 'background:yellow';` 也是屬於此 task  
3. The networking  
    這就像 ajax 觸發時的 callback
4. The history traversal  
    官網上面是提到 history.back() 這是屬於 task 這種類型

> 可參考 [HTML Living Standard - Generic task sources](https://html.spec.whatwg.org/multipage/webappapis.html#generic-task-sources)  
> 在這份規範中，沒看到所謂的 macrotask  
> 可是會發現在掘金上面都會把此 task 稱為 macrotask 去解釋  
> 個人是覺得以規範裡面的名詞去說明比較適合，所以這邊都只會稱 task  

## microtask

microtask 是會在每一輪 event loop 進行渲染之前會被觸發  
且只要在 microtask queue 裡面還有東西的話，就會一直執行下去  
直到整個 microtask queue 變成空的為止  
也就是說在 microtask 執行的時候，又觸發 queue 新的 microtask 的話  
這個新的 microtask 也是會在此輪 task 執行完之前執行，不會留到下一輪 task  
比較著名的 microtask 就是 `Promise` 以及 `MutationObserver`
且此 microtask 擁有自己的 microtask queue，這裡的 queue 就是真的 queue 了  
詳細可以在讀讀以下這張圖  
![](/images/browser/microtask.png)
> 可參考 [HTML Living Standard - microtask-queue](https://html.spec.whatwg.org/#microtask-queue)

## rendering

rendering 就是渲染  
透過 parse HTML 變成 DOM Tree 以及 parse CSS 變成 CSSOM Tree
並且把 DOM Tree 跟 CSSOM 進行合成變成最後的 Render Tree  
並根據這個 Render Tree 去計算節點的位置去對整個畫面進行 Paint (繪製)  
這整個過程就是 rendering  
另外在修改 DOM 的狀況下，也會出現 Reflow (重排/回流) 或是 Repaint (重繪) 的現象  
整個概念流程如圖下，詳細可以參考 [Render-tree Construction, Layout, and Paint](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/render-tree-construction?hl=en)
![](/images/browser/render-tree-construction.png)

另外在規範上面有提到每一輪的 event loop task 結束後不一定會需要 rendering  
原因是為了要達到每秒 60 fps 的效果 (60 frams per second)  
每次瀏覽器繪出一個 frame 的間隔時間為 16.7 ms  
如果在 16.7ms 內進行兩次 DOM 操作的話，是有可能不會出現兩次渲染的  
另一個發生的原因是在畫面上如果沒有可見的影響的渲染的話，這次就是不必要的渲染  
![](/images/browser/no_need_rendering.png)

## Event Loop 流程圖

根據上面對 task 以及 microtask 的介紹以及 event loop 流程，可以簡化成以下這張流程圖  

![](/images/browser/flow.png)

但這邊要注意的是，真正執行渲染時的 thread 跟執行 js 的 thread 是屬於不同個 thread  
執行 js 程式的 thread 範疇是在 task 以及 microtask 中  
但進行渲染時會是透過另一個 GUI thread 去進行渲染  
> 這裡先幫忙補充名詞以及知識  
> process 又名進程、處理程序，thread 又名線程、執行緒  
> 程式在執行時被稱為 process  
> 有時候我們寫的程式想要開另一條分支去幫忙做計算，那條分支被稱為 thread  
> 而 process 是由一個或是多個 thread 組合而成的  
> 每個 process 是不會共享記憶體空間的，但是在 process 底下的 threads 們是可以互相共享的  
> 而 process 之間可以透過 Inter Process Communication (IPC) 去做溝通，這邊就不針對這個做說明  

此兩個 thread 是屬於互斥關係  
可以試試以下代碼證明，GUI Thread 和 JS Thread 是互斥的  
當還在執行 js 時，你是看不到他把畫面變成紅色的  
最終你只會看到畫面變成藍色的  
可以查看 [js 引擎与 GUI 引擎是互斥的](https://www.kancloud.cn/xiak/quanduan/375582)看看更多互斥的範例
```html
<html lang="en">
<body>
    <script>
        function sleep(second) {
            var start = +new Date();
            while (start + second * 1000 > (+new Date())) {}
        }
        document.body.style.backgroundColor = "red";
        sleep(5)
        document.body.style.backgroundColor = "blue";
    </script>
</body>
</html>
```

### 談談瀏覽器 process/thread 關係

看到這裡大家可能會覺得網頁開啟來就是只會有一個進程然後包含 GUI Thread, JS Thread 等等  
但其實並不都是這樣，有的瀏覽器實作方式是透過 multi-process 的方式去實作  
例如說 Chrome 的做法就是下圖右方的方法去實作  
![](/images/browser/multi-process.png)
> 圖片出處 [Inside look at modern web browser (part 1)](https://developers.google.com/web/updates/2018/09/inside-browser-part1)  
> 圖中黑色外框表示 process  
> 裡面有一個虛線很像魚的是 thread (Google 說像魚的，不是說我的 XD)  
> 從圖裡面也可以看到，除了包含 Render 之外，還有 Network, GPU, Device 各式各樣的 thread/process (根據瀏覽器實作機制，可能是 thread 可能是 process)  
> 以 Chrome 來說, GUI 和 JS 相關的任務，都被歸類在 Render Process 裡面  
> 所以在 Chrome 的 Render Process 裡面的 GUI 和 JS 都是 thread 的概念  

以 multi-process 去設計瀏覽器的時候  
當你擁有三個 tab 就會擁有三個 render process 去控制  
當發生其中一個 tab 壞掉的時候，是不會去影響另外兩個 process  
但如果當你只有一個 process，另外 3 個 tab 都是這個 process 裡面 thread 的話  
萬一 process 壞掉，這樣 3 個 tab 是會都會掛掉的 (因為 process 掛了, thread 也不用想活了)  
![](/images/browser/multi-process-tab.svg)

> 圖片出處 [Inside look at modern web browser (part 1)](https://developers.google.com/web/updates/2018/09/inside-browser-part1)  
> 題外話，非常推薦大家去看 [Inside look at modern web browser (part 1)](https://developers.google.com/web/updates/2018/09/inside-browser-part1) 這系列 1-4 的文章  
> 圖文並茂，針對瀏覽器的機制講得很清楚

## 執行範例

介紹以上名詞以及流程後，我們來試試看以下幾個例子  

### 範例一

以下屬於主程式碼，也就是被放在 task 裡面去執行，最後才會進行渲染
以下面的例子來說，畫面最終會被渲染成紅色，但不會是 黃 藍 紅的順序下去  
因為整段是屬於第一輪的 task，最後渲染是會吃最後一個紅色的屬性  

```javascript
document.body.style = 'background:yellow';
document.body.style = 'background:blue';
document.body.style = 'background:red';
```

![](/images/browser/example-01.gif)

### 範例二

這邊有 setTimout，代表裡面的 callback 會被放在下一輪的 task 之中  
這樣第一輪的 task 執行渲染藍色，第二輪的 task 執行渲染黑色  
所以畫面上會先看到藍色再看到黑色  
```javascript
document.body.style = 'background:blue';
setTimeout(function test(){
    document.body.style = 'background:black'
}, 0)
```
![](/images/browser/example-02.gif)
> 中間有一段有用慢動作播放，以方便看渲染效果  
> 但注意，如果瀏覽器是以 60 fps 進行的話, 代表說這個 setTimeout 時間沒有大於間隔 16.7 ms  
> 在這個狀況是有可能發生只有一次渲染的結果，也就是只看到黑色並沒有藍色  
> 如果要一定要讓瀏覽器出現兩次渲染，可以把 setTimeout 改成 16.7  
> 後面的範例也是如此

為了驗證是分別在兩輪 event loop 後執行 rendering 這件事  
我們來試試看使用 chrome performance 檢測看看  
首先先把程式改成利用 click 觸發，這樣比較好追蹤事件  
```html
<html lang="en">
    <button id="button">button</button>
    <body>
        <script>
            document.getElementById("button").addEventListener("click", function test() {
                document.body.style = 'background:blue';
                setTimeout(function test2(){
                    document.body.style = 'background:black'
                }, 0)
            })
        </script>
    </body>
</html>
```

從第一張可以知道有兩個綠色的地方，都是 paint 的行為  
![](/images/browser/example-02-per-01.png)

> 這邊 Chrome 版本 80.0.3987.66 上面有一個 task 的標籤  
> 我查不太到這個代表的意思  
> 但依照規範上面 event loop 的概念  
> 那個灰色的 task 標籤，就是代表每一次的 event loop  
> 推測的一個原因是在後面的 microtask 範例中，執行 microtask 被歸類在這個灰色 task 標籤下面  
> 如有錯誤請糾正，感謝！！  

先放大最左邊黃色部份來看看 (大約 2440 ms)，會發現 task 尾端執行了一個叫做 test 的 function  
還有一個 setTimeout 的 function (被稱為 test2)  
然後接下來下一個 task 就開始有第一個 paint (blue)  
![](/images/browser/example-02-per-02.png)

再放大中間右邊的黃色部份 (大約 2442 ms)，會發現 task 尾端執行了一個叫做 test2 的 function  
這個 test2 就是前面 setTimeout 設定好的 function  
觸發執行後，接下來就會觸發第二個 paint (black)
![](/images/browser/example-02-per-03.png)

開始執行 paint 的動作把畫面渲染成黑色 (大約 2449 ms)  
![](/images/browser/example-02-per-04.png)

小整理
1. 大約 2440 ms 的時候，執行了第一輪 task 並觸發了第一個 paint (blue) 以及 setTimeout
2. 大約 2442 ms 的時候，觸發了 setTimeout 的行為
    大約 2449 觸發了第二個 paint (black)
    此 paint 的行為是來自 setTimeout 裡面的程式碼   
    可以在圖片上面有一個 frames 可以判斷，總共對畫面進行兩次更新  
![](/images/browser/example-02-per-01.png)

至於要怎麼看 Paint 的畫面可以按照以下步驟去證明
![](/images/browser/example-02-per-05.png)
![](/images/browser/example-02-per-06.png)

### 範例三
這邊有 Promise，代表裡面的 callback 會被放在此輪的 microtask 之中  
第一行是指定在渲染的時候要渲染藍色，但按照流程圖來說  
最後要執行渲染之前還會先跑 microtask 的 callback  
跑完 microtask 的 callback 後，指定在渲染時要是黑色  
第一輪結束後，只會執行渲染黑色，所以畫面上只會看到黑色  
而 log 的順序會是 1, 3, 2

```javascript
document.body.style = 'background:blue'
console.log(1);
Promise.resolve().then(()=>{
    console.log(2);
    document.body.style = 'background:black'
});
console.log(3);
```

![](/images/browser/example-03.gif)

我們再來看看 chrome 的 performance 的結果如何  
為了方便檢測，把 js 那一段程式把也改成由 click 進行觸發  
```html
<html lang="en">
    <button id="button">button</button>
    <body>
        <script>
            document.getElementById("button").addEventListener("click", function test() {
                document.body.style = 'background:blue'
                console.log(1);
                Promise.resolve().then(function test2(){
                    console.log(2);
                    document.body.style = 'background:black'
                });
                console.log(3);
            })
        </script>
    </body>
</html>
```

按照 Promise 是走 microtask 的概念，所以不會進入新的一輪 task 裡面  
在一次 event loop 結束後，這段程式把只會觸發一次 paint 的效果  
最下面可以看到觸發 test function 後，又觸發了 microtask  
然後就結束這一輪的 task，接下來才是 paint
![](/images/browser/example-03-per-01.png)

### 範例四

先來看渲染顏色的順序效果  
第一輪的 task 之中，第一行指定了藍色  
但在跑完 Promise 的 microtask 後，會變成黃色  
所以在第一輪結束之時，會直接把畫面渲染成黃色  
但因為我們有設定在 setTimout 也會執行渲染  
所以會變成第一輪 task 結束後是黃色，但在第二輪 task 結束後，會變成紅色  
至於 log 順序的話為 1, 3, 2, 4, 5

```javascript
document.body.style = 'background:blue'
console.log(1);
setTimeout(() => {
    console.log(5)
    document.body.style = 'background:red'
}, 0)
Promise.resolve().then(()=>{
    console.log(2);
    document.body.style = 'background:black'
}).then(() => {
    console.log(4);
    document.body.style = 'background:yellow'
});
console.log(3);
```
![](/images/browser/example-04.gif)
> 中間有一段有用慢動作播放，以方便看渲染效果

我們再來看看 chrome 的 performance 的結果如何  
為了方便檢測，把 js 那一段程式把也改成由 click 進行觸發  
```html
<html lang="en">
    <button id="button">button</button>
    <body>
        <script>
            document.getElementById("button").addEventListener("click", function test() {
                document.body.style = 'background:blue'
                console.log(1);
                setTimeout(function test2(){
                    console.log(5)
                    document.body.style = 'background:red'
                }, 0)
                Promise.resolve().then(function test3(){
                    console.log(2);
                    document.body.style = 'background:black'
                }).then(function test4(){
                    console.log(4);
                    document.body.style = 'background:yellow'
                });
                console.log(3);
            })
        </script>
    </body>
</html>
```

可以看到上面有兩個 task 是主要進行 paint 的行為  
![](/images/browser/example-04-per-01.png)

放大左半邊來看看，會發現左半邊執行了一個叫做 test function  
也就是我們程式碼裡面的 click callback function  
callback function 裡面有一個 setTimeout function  
所以在 task 結束的尾端可以發現有一個 setTimeout 事件被觸發  
但這個 setTimeout 的 test2 function 是在下下一輪 task 才會進行動作 (畫面右邊的 test2)  
而在中間的 task 就進行 paint 的動作 (變成黃色)
![](/images/browser/example-04-per-02.png)

而把背景變成紅色則是在更後面的 task  
![](/images/browser/example-04-per-03.png)

### 範例五
此範例是來自於 [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)  
以下是裡面的 demo 範例，可以清楚看到每種 callback 放在 task 又或是 microtask 裡面  
![](/images/browser/example-05.gif)

## 後記

這次介紹的是瀏覽器版本的 event loop，但其實 node.js 的 event loop 又不一樣  
這個之後再介紹 node.js 版本的 event loop 又是如何運作的  
另外這邊文章也有簡單談到渲染引擎，這裡面還有牽扯到關於 Reflow 以及 Repaint 的行為  
這個也會另外在開新的文章做詳細解釋  
還有本文提到有些名詞有結合中國的一些技術名詞，這樣大家在看中國的技術文章時會比較好同步  

## References
1. [「前端进阶」从多线程到Event Loop全面梳理](https://juejin.im/post/5d5b4c2df265da03dd3d73e5#heading-4)  
    針對瀏覽器的 event loop 的介紹渲染例子非常的詳細，非常推薦看看
2. [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)  
    針對 task, microtask 都有詳細的說明，也有針對不同瀏覽器做比對
3. [js引擎与GUI引擎是互斥的](https://www.kancloud.cn/xiak/quanduan/375582)
4. [深入探究 eventloop 与浏览器渲染的时序问题](https://juejin.im/entry/596d78ee6fb9a06bb752475c)
5. [从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5)
6. [Render-tree Construction, Layout, and Paint](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/render-tree-construction?hl=en)
7. [Inside look at modern web browser (part 1)](https://developers.google.com/web/updates/2018/09/inside-browser-part1)
8. [Inside look at modern web browser (part 2)](https://developers.google.com/web/updates/2018/09/inside-browser-part2)
9. [Inside look at modern web browser (part 3)](https://developers.google.com/web/updates/2018/09/inside-browser-part3)
10. [Inside look at modern web browser (part 4)](https://developers.google.com/web/updates/2018/09/inside-browser-part4)
