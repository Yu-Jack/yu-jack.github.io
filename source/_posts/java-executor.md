---
title: Java Executor、TheadPoolExecutor 設定參數基本介紹
categories: Java
date: 2019-02-19 11:31:09
tags: [Java, Executor, Thread Pool, TheadPoolExecutor]
header-img: /images/banner.jpg
catalog: true
---

## 前言

Thread Pool 的概念和使用 Database 的 Connection Pool 是很類似的概念
就像 Connection Pool 的使用方法是去 Pool 裡面取得一個 Connection 使用
使用完之後就關閉此 Connection，並把這個 Connection 丟回 Pool 之中讓其他程式使用

Thread Pool 也是這種概念，但在 JDK 1.5 之前的版本中是沒有一個管控的方式
幾乎都是用 new Thread 的方式去創建使用
在 JDK 1.5 之後的版本則是出了 Exectuor 去管控 Thread Pool

<!-- more -->

## ThreadPoolExecutor 介紹

Java 提供了 ThreadPoolExecutor 能讓我們客製化定義不同的使用模式
以下為 ThreadPoolExecutor 的設定即使用方法
以及取用 Queue Size 以及 Thread Name 的方式

```java=
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    int corePoolSize,
    int maxPoolSize,
    long keepAliveTime,
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    RejectedExecutionHandler handler
);

System.out.println("Queue size is: " + executor.getQueue().size());

executor.execute(new Runnable() {
    public void run() {
        System.out.println("running");
        System.out.println("Thread Name: " + Thread.currentThread().getName())
    }
})
```

* corePoolSize
    核心 Thread 的數量，基本上 Thread 數量不會低於此數字
* maxPoolSize
    Thread Pool 的最大數量，如果所有 Thread 都被執行的話
    Task 會被塞到 Queue 之中等到有空閒的 Thread 為止
    決定 maxPoolSize 的數量最好是根據系統資源去計算出來
    `Runtime.getRuntime().availableProcessors();`
* keeyAliveTime
    當閒置時間超過此設定的時間的話，系統會開始回收 corePoolSize 以上多餘的 Thread
* unit
    keepAliveTime 的時間單位，可以使用 `TimeUnit.SECONDS`
* workQueue
    決定當所有 Thread 都被執行時，Task 在 Queue 之中會以何種形式等待
* handler
    Queue 已滿且 Thread 已達到 maxPoolSize 之後會以什麼樣的方式處理新的 Task

### BlockingQueue 詳細介紹

基本規則為

1. 如果當前的 Thread 小於 corePoolSize，則 Executor 首先會新增 Thread，而不會把 Task 丟到 Queue 之中 (基本上就是直接運行的意思)
2. 如果當前的 Thread 大於等於 corePoolSize，則 Executor 首先會把 Task 加到 Queue 之中等待
3. 當 Task 無法再被加入到 Queue 之中的話，則 Executor 首先會創建新的 Thread，直到超過 maxPoolSize 為止
4. 超過 maxPoolSize 時，任務會被拒絕

BlockingQueue 有三種類型

#### 直接提交

代表類型: synchronousQueue
基本上就 Queue Size 就是 0
會直接把 Task 提交給 Thread，如果不存在可用 Thread，則新建一個
如果此類型有設置 maxPoolSize 的話，是有可會拒絕新的 Task
所以通常使這種類型，會建議 maxPoolSize 不要做上限設定

#### 無界隊列 (Unbounded Queue)

代表類型: LinkedBlockingQueue
Queue 的大小是無限制的
特別注意的是因為大小是無限制，所以萬一 Task 執行時間過長
會導致有大量個 Task 卡在 Queue 之中動彈不得，進而導致 OOM 的發生
`Executors.newFixedThreadPool` 採用的就是此種類型的 Queue

#### 有界隊列 (Bounded Queue)

代表類型: ArrayBlockingQueue
Queue 的大小是有限制的
但要注意的點是，這個 Queue 大小必須和 Thread Pool 相互搭配才可以發揮出比較好的效能
使用大的 Queue Size 和小的 Thread Pool Size
雖然可以有效降低 CPU 使用率，但會降低 QPS
而使用小的 Queue Size 和大的 Thread Pool Size
雖然可以提昇 QPS，但會降低 CPU

### Queue 飽和 RejectExecutionHandle 介紹

再來要介紹當 Queue 飽和之後，可以根據不同 handle 做出不一樣的行為
以下總計有四種使用方式

#### 終止策略 (AbortPolicy)

***此為預設 Policy***
使用該 Policy，飽和時會拋出 RejectedExecutionException
調用者可以用以下自行定義方式處理異常

```java=
executor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
    @Override
    public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
        System.out.println("Get you!");
        r.run();
        System.out.println("Done in handler");
    }
});
```

#### 拋棄策略 (DiscardPolicy)

不做任何處理直接拋棄

#### 拋棄舊任務策略 (DiscardOldestPolicy)

把 Queue 之中最頭的元素拋棄，並在嘗試重新提交 Task

#### 調用者運行策略 (CallerRunsPolicy)

簡單來說，飽和後會直接由調用 Thread Pool 的主 Thread 自己來執行這個 Task
但在這個期間，主 Thread 就無法再度提交 Task
從而讓 Thread Pool 有時間把正在處理的 Task 給完成

## 創建 Thread Pool 的四個常用方法

這四個常用的方法都是透過 ThreadPoolExecutor 的不同參數所實作而成的

1. `public static ExecutorService newFixedThreadPool(int nThreads)`
    創建固定數量的 Thead，提交 Task 的時候如果未達 `nThreads` 的數量的話，則會一直新建 Thread
    達到 `nThreads` 時，之後的 Task 則會進入到佇列中

    ```java=
    public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }
    ```

2. `public static ExecutorService newCachedThreadPool()`
    Thread 的數量預設上限為 2^31 - 1，如果當 Thread 大於 Tasks 數量的時候
    就會開始去回收那些等了超過 60 秒還沒有 Task 進來的 Thread
    問題是，這個 `newCachedThreadPool` 是屬於動態新建所以萬一 Task 一直大於 Thread 數量的話則會一直新建
    這樣很容易耗光機器資源，使用這個最好的狀況是 Task 的執行時間是短的才比較適合

    ```java=
    public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
    ```

3. `public static ExecutorService newSingleThreadExecutor()`
    創建一個 Single Thread，因為此 Thread 被使用的話其他都會是在佇列中等待，所以效能會下降

    ```java=
    public static ScheduledExecutorService newSingleThreadScheduledExecutor() {
        return new DelegatedScheduledExecutorService
            (new ScheduledThreadPoolExecutor(1));
    }
    ```

4. `public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize)`
    支持定時以及週期性執行 Task 的需求

    ```java=
    public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
        return new ScheduledThreadPoolExecutor(corePoolSize);
    }
    ```

    看看 Parent Class

    ```java=
    public ScheduledThreadPoolExecutor(int corePoolSize) {
        super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
              new DelayedWorkQueue());
    }
    ```

但是基本上不是很推薦使用以上這四種方法去定義 Thread Pool
在阿里巴巴的 Java 開發手冊中也有提到，如果要新建 Thread
請透過 ThreadPoolExecutor 的方式去自定義 Thread Pool 的使用模式
在[這篇文章](https://zhuanlan.zhihu.com/p/32867181)的樓主也是因為用了以上其中一個方法採到 OOM 的雷
所以在設定 Thread Pool 的時候要特別注意使用的情況適不適合！


## References

1. [Java Executor并发框架](https://www.cnblogs.com/vhua/p/5297587.html)
2. [一次Java线程池误用引发的血案和总结](https://zhuanlan.zhihu.com/p/32867181)
3. [如何使用ThreadPool](http://givemepass-blog.logdown.com/posts/296960-how-to-use-the-threadpool)
4. [并发新特性—Executor 框架与线程池](http://wiki.jikexueyuan.com/project/java-concurrency/executor.html)
5. [Java ThreadPoolExecutor and BlockingQueue Example](https://howtodoinjava.com/java/multi-threading/how-to-use-blockingqueue-and-threadpoolexecutor-in-java/)