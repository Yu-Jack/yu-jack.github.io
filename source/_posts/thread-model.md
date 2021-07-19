---
title: Thead Model 介紹
categories: Operating System
date: 2021-07-15 12:40:00
tags: [thread, thread model, process, operating system]
header-img: /images/banner.jpg
catalog: true
---
## 介紹

在學習各個語言底層如何去操作 Thread 時  
都會看到一個名詞 Thread Model  
也就是不同語言開 Thread 的方式都不太一樣  
舉例來說, 會看到某些文章寫出以下類似的結果  

```
Ruby 1.8  1:N, aka Green threads
Java 8    1:1, 但某個版本之前都是使用 1:N
Ruby 1.9  1:1, 但使用 GIL
Go   1.1  M:N, 確切說 M:P:N 比較好, 但這邊先讓我用 M:N
```

而這 1:1 1:N M:N 代表什麼意思呢?  
而 Go 裡面提到的 M:P:N 又是什麼鬼呢?  

## User space & Kernal space

在往下講之前, 我們必須先談談作業系統的一個特點
在整個作業系統中的虛擬記憶體空間被區分成兩塊
區分這兩塊是記憶體保護機制的一環

* User space
	我們常使用的軟體, 例如瀏覽器, 甚至是 bash command 也屬於這一環

* Kernal space
	能呼叫系統一切的資源, 例如 file system, network 等等

而在 User space 的程式是不允許直接對 Kernal space 的資料做存取
所以在我們使用的軟體上要能夠建立檔案或是發出網路請求
往往是透過 system call 到 Kernal space 要求更高的權限進而去完成功能

這都是為了不讓在 User space 的程式惡意亂搞 Kernal space 的資料  
像是 User space 的程式故意佔著大量 CPU 資源不放或是更改作業系統架構等等

可以把以上的情況想像成下面的情境

作業系統很像一個國度, 此國度是採取國王制度  
國王掌握了核心的權利, 包含分配食衣住行等等權利  
國王希望保護全體住民  
於是安排一個騎士保護一個住民的方式  
還是安排一個騎士保護多個住民的方式  
依據不同情竟有不同好壞  

這概念也是待會講 Thread Model 時會提到

## Thread Model

依照上面定義的兩種 space, Thread 也會被切成兩種形式

* User-Space Thread
    在應用程式中創建 Thread, 而這個創建並不是透過 system call 去建立的  
    所以這裡的 Thread 並不是指 OS 實際執行的 Thread  
    而是透過操作 stack pointer 讓 OS 實際執行的 Thread 去執行指定的 User-Space Thread  
    通常 OS 是不知道 User-Space Thread 的存在, 所以透過 `ps` 指令是看不到的  
    換句話說, User-Space Thread 是交由應用程式去管理, 並不是交給 OS 管理  

* Kernal-Space Thread
    一個執行中的程式就被稱為 Process  
    而每一個 Process 都有一個實際的執行者, 也就是 Kernal Thread  
    Kernal Thread 則是 CPU 執行的最小單位, 這些 Thread 都會交由 OS 去管理  

講到這裡一定會對於如何實作 User-Space Thread 感到疑惑  
建議可以看這個 [Repo](https://github.com/bhaargav006/User-Thread-Library), 這是明尼蘇達大學出過的一個作業  
要實作 User-Space Thead library, 裡面有比較簡化版本的程式可以看看  
通常是會用到 setjmp/longjmp, signal 這兩種方式  
詳細可以看看這篇[文章](https://descent-incoming.blogspot.com/2020/03/user-mode-pthread-simplethread.html)有簡單實作切換 User-Space Thread 的機制

但要注意的是常常會有叫做 Pthread 的東西出現在 Thread 相關文章之中  
它只是一種規格定義, 可以提供給 User-Space / Kernal-Space 去實作  
但在搜集資料過程中, 有些文章都把 Pthread 定義成在 User-Space 的範疇了  
若要確認文章說的 Pthread 是哪個部分, 就必須看上下文才知道  

這種 User-Space Thread 就是只存在於 User-Space, 不會透過 system call 去建立 Kernal Thread  
但帶來的問題就會是, 一般來說一個 Process 中實際執行的 Kernal Thread 只有一個  
萬一 User-Space Thread 被 block 的話, 整個 Kernal Thread 也會被 block  

接著進入正題來開始介紹各種不同 Thread Model  
下面寫法都是按照 Kernal-Space Thread - User-Space Thread 順序寫的  


### 1-N (one to many)

![](/images/thread-model/1-N.png)

實際執行程式的 Kernal Thread 只會有一個  
所以當有一個 User-Space Thread 中有被 blocked 的情況, 程式就完全沒辦法執行了  
因為分給此 Process 的 Kernal Thread 就只有一個  


### 1:1 (one to one)

![](/images/thread-model/1-1.png)

一樣會發生當有條 Thread 被 blocked 的話, 那條 Thread 會卡住  
但程式依舊可以運行, 因為 Thread 之間是不會互相影影響的

以 Java 來說就是經典的 1:1 的模式  
配合 spring + tomcat 的話, 就是一個請求進來一個 Thread  
看似不錯, 但當 Thread 開太多的時候也是會造成系統處理效能降低  


### M:N (many to many)

![](/images/thread-model/M-N.png)

而顏色同樣的代表是被 Kernal Thread Schedule 安排下的 Thread 去處理  
可以看到實際上 Kernal Thread 會有三條  
其中有一條 Thread 1 處理完 C 之後再去處理 D  

但這圖上的 M:N 也只是簡易版本的安排方式, 還是會有一些問題存在  
所以會有一些變形像是 Golang 中 goroutine 的實作方式, 就優化成 M:P:N 的方式處理  
詳細可以參考 [Java’s Thread model and Golang Goroutine](https://medium.com/cymetrics/javas-thread-model-and-golang-goroutine-46f8475600ae) 或是 [The Go scheduler](https://morsmachine.dk/go-scheduler)

## 後記

關於 Thread / Process 相關的文章其實已經很多了  
這邊就是以個人特別關注的角度把它寫成一篇文章  
另外對於 User-Space Thread 實作還蠻感興趣的  
之後有機會再來試著實作看看  

## References

* [Wiki - User Space](https://en.wikipedia.org/wiki/User_space)
* [Wiki - Green threads](https://en.wikipedia.org/wiki/Green_threads)
* [Wiki - Thread(computing)](https://en.wikipedia.org/wiki/Thread_(computing))
* [What are threads (user/kernal)](https://tldp.org/FAQ/Threads-FAQ/Types.html#UserSpace)
* [Concurrent Programming with Ruby and Tuple Spaces](https://www.slideshare.net/luccastera/concurrent-programming-with-ruby-and-tuple-spaces)
* [第七天 Thread(執行緒)--下](https://ithelp.ithome.com.tw/articles/10203786)