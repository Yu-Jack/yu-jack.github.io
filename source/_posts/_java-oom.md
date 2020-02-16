---
title: java.lang.OutOfMemoryError Java heap space? 怎麼解?
categories: DevOps
date: 2020-02-24 21:07:54
tags: [java, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

因為工作關係，其實不只會碰到 node.js  
有時候還會協助其他專案，而有的專案就是用 java 寫的  
很久之前在伺服器噴出一個 `OutOfMemoryError: Java heap space` 的錯誤  
就開始尋錯之旅了 ...  

但這裡不會真實把工作上的專案的 bug 記錄在這裡 XD
只會以簡單的程式去表達當時除錯的流程  
基本上發摟這方法，應該能夠鎖定問題點  
不行的話 ... 您看看就好 XD

## 還原案發現場

先上一段程式來模擬可以噴出 OutOfMemoryError  
此程式是無限迴圈地往 Map 裡面塞東西  
```java
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class Test {

    public static void main(String args[]) throws Exception {

        Map<Integer, String> map = new HashMap<Integer, String>();
        Random r = new Random();

        while (true) {
            map.put(r.nextInt(), "value");
        }
    }
}
```

透過 `javac Test.java` 編譯成功後  
再透過 `java -Xmx12m Test` 去執行指令  
這裡的 `-Xmx12m` 是一個關鍵，這裡指定了這個 java 程式  
能使用的 heap memory 的上限為 12M  
此時執行完指令的時候會噴出以下錯誤  
```
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
        at java.util.HashMap.resize(HashMap.java:703)
        at java.util.HashMap.putVal(HashMap.java:662)
        at java.util.HashMap.put(HashMap.java:611)
        at Test.main(Test.java:13)
```

這樣可以看到噴出此錯誤訊息  
這代表說假設你電腦本身記憶體空間 8G  
但你分配給 java 應用程式的記憶體只有 12 MB 的時候  
它不會跨過這個 12 MB 限制，即使電腦還有將近 8G 的記憶體空間，它是不會超過 12 MB  
總歸一句話，使用的記憶體超出了我們設定給他的限制會導致 OOM (Out of Memory)  

> 這裡可以注意到叫做『Heap Space』  
> 也就是程式運行時 JVM 可調配讓程式使用的記憶體空間  
> Class 實例化的 Instance 也是被放在這個區域  
> 除了 Heap 之外，還有 PermGen 的設定  
> PermGen 指的是 Memory 永久保存區
> 是存放 Class, Meta Info 的地方  
> 如果太小可能就會在 pre compile 的階段把 PermGen 弄爆

## 解決方法  

通常記憶體不夠，就是給他開大加下去！  
但萬一你的程式剛好是無窮迴圈地往某一個地方塞東西  
這樣加大記憶體就沒有任何意義了  
因為這屬於程式上的 Bug，要解決的不是記憶體  
而是~~寫出這程式的人~~解決程式邏輯的 Bug 才對

但如果是本身記憶體真的不夠用  
那就是加上記憶體試試看，如果加了好幾 XXG 上去依舊不能用  
就開始要分析出錯的原因了  

至於要如何分析, 雖然 log 會噴出 Exception 的訊息  
但總不會一直蹲在 log 前面看 Exception 哪天噴出來  
就算 log 以雲端方式保存，Exception 能分析的程度還是有限  

所以可以加上以下指令把當時噴出 OOM 的詳細狀況 dump 出來  
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp
會把在 OOM 的時候, 把整個 heap 等等當下執行詳細的狀況儲存變成一個檔案
以上述的範例來說，使用的完整指令為  
`java -Xmx12m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp Test`  
這樣出現 OOM 的時候，就會往 /tmp 底下放入一個副檔名為 .hprof 可分析檔案  
```
java -Xmx12m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp Test

java.lang.OutOfMemoryError: Java heap space
Dumping heap to /tmp/java_pid57606.hprof ...
Heap dump file created [19050199 bytes in 0.163 secs]
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
        at java.util.HashMap.resize(HashMap.java:703)
        at java.util.HashMap.putVal(HashMap.java:662)
        at java.util.HashMap.put(HashMap.java:611)
        at Test.main(Test.java:13)
```

> 不過要注意的是  
> 當應用程式越龐大的時候，產生出來的 hprof 就會越大  
> 高達 GB 等級以上也是很常見的  
> 所以伺服器保留適當的空間就很重要  

這時再透過 java 內建的一個分析程式 jvisualvm 去分析這個檔案就可以找到出現 OOM 的地方  
通常 jvisualvm 是位在 java home 裡面 bin 底下的位置，以 Mac 來說是在這個路徑底下  
`/Library/Java/JavaVirtualMachines/jdk1.8.0_65.jdk/Contents/Home/bin/jvisualvm`
Widnwos 則是會在 `C:\Program Files\Java\jdk1.8.0_65`  
> 這前提是你沒有自行更改安裝的位置  
> 有更改安裝位置的話，那你自己應該就知道在哪了 XD  


打開後長這樣，然後開啟剛剛 dump 出來的 hprof 檔案  
![](/images/java-oom/java-oom-01.png)

在裡面會看到一個『Thead casuing OutOfMemoryError exception: main』  
![](/images/java-oom/java-oom-02.png)

點選 main 後就可以看到錯誤的地方  
![](/images/java-oom/java-oom-03.png)

點上面 class 可以獲得比較詳細的資訊，包含使用記憶體多少的量都能夠知道  
![](/images/java-oom/java-oom-04.png)

以上是簡單介紹針對 OOM 除錯的一個心得和介紹  

## 後記

實際上並沒有一個銀彈可以順利地解決 OOM 的方法  
必須找到是程式的邏輯 Bug 導致 OOM  
又或是本身程式就是需要比較大的記憶體  
又或是第三方的 Library 寫不好  
又或是流量太大開太多 Thread  
原因有很多種，只能透過分析的方式找到引起的主因  
否則，單純加大記憶體不會解決根本原因  
不然只持推遲爆炸的時間點而已 (汗...  

不管哪種語言排除 OOM 的流程都是大同小異  
這邊就先記錄以 Java 的方式 (畢竟剛好工作上碰到