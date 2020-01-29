---
title: AWS CloudWatch Logs Insights 介紹及教學
categories: AWS
date: 2019-11-28 23:02:14
tags: [aws, CloudWatch]
header-img: /images/banner.jpg
catalog: true
---

## 前言

AWS CloudWatch 是一個可以監控日誌用以及伺服器狀態等等的服務  
其他還有像是 Alarm Events 都是從以下兩個大項目延伸出去的額外功能  
這邊就先不多作介紹，之後會寫在其他篇幅做介紹  
那 CloudWatch 主要包含以下兩個大項目  

<!-- more -->

1. Metric
    紀錄了 AWS 上面服務的狀態
    包含 EC2 的 CPU、網路使用量、記憶體用量和硬碟大小
    API Gateway API Call Count、RDS CPU 用量等等
    針對用量還可以去做 Alarm 發信，或是觸發 Lambda 等等的功能
    > 記憶體和硬碟大小需要額外設定
    > 可以參考 https://docs.aws.amazon.com/zh_tw/AWSEC2/latest/UserGuide/mon-scripts.html
2. Log
    存放 Log 的地方，伺服器的 access log 或是程式的 log 
    又或是 audit log 等等，基本上想看的 log 可以推上來做分析以及整理
    除此之外，s3 其實也是一個放 log 的好地方
    但 s3 的缺點是不能夠很便利的去線上觀看 log

今天主要介紹的是 CloudWatch Logs Insights 功能
透過 Insights 可以有效地查詢 Log 裡面的資料
甚至還可以做統計以及剖析 Log 裡面的字串進行字串統計

## 使用方式

### 範例一 - like
```
fields @timestamp, @message
| sort @timestamp desc
| filter @message like "Your Wanted Message"
```
第一行 fileds 主要指定最後出現的欄位會有什麼  
第二行 sort 是根據 timestamp 進行由大至小的排序  
第三行 filter 是針對 @message 的內容去搜尋  

最後只會顯示跟 like 後面有關的字串的結果而已  

這邊要另外注意的事情是，每一個指令都是有<span style="color: red">順序性</span>的  
以上面第三行的結果來說  
假設第四行再下了一個 `filter @message like "blablabla`  
一個跟前面完全沒有關係的訊息是找不到的  
因為在第三行就把所有訊息都過慮剩下只有 "Your Wanted Message"  
所以在第四行針對 "Your Wanted Message" 去搜尋 "blablabla" 當然就不會出現任何結果  

### 範例二 - @logStream

在整個操作 UI 上  
最上面會有一個可以選 logGroup 的地方  
但卻沒有選 logStream 的地方  

![](/images/aws/aws-cloudwatch-logs-insights-01.png)

此時會需要透過 filter 加上 @logStream 的方式才能找單獨的 stream  
```
fields @timestamp, @message
| filter @logStream = "Access Logs"
```
### 範例三 - parse

假設今天要處理 access log 的 path 做統計的話  
字串有一段內容是 "GET /login HTTP/1.1"  
我想要 parse 出 /login 的話該怎麼做呢？  
```
fields @timestamp, @message
| sort @timestamp desc
| parse '"GET * HTTP/1.1' as @path
```
第三行 透過 parse 指令加上 \* 可以把 \* 的地方變成一個變數指定到 as 後面的變數去  
這裡變數要不要加 @ 都可以，結果如下：  
![](/images/aws/aws-cloudwatch-logs-insights-02.png)

那如果想要 parse 兩個變成變數呢?  
很簡單，就是再多加一個 \* 字號在後面即可  
`| parse '"GET * */1.1' as @path, @protocol`  
![](/images/aws/aws-cloudwatch-logs-insights-03.png)


### 範例四 - stats count()

以前面的例子來說  
我想知道在短時間內有幾個 login 的話  
可以透過 stats 的指令去做統計  
```
fields @timestamp, @message
| filter @logStream = "Access Logs"
| sort @timestamp desc
| parse '"GET * */1.1' as @path, @protocol
| stats count(*) as sum by @path
```
第五行 透過 by 指令去 group by 用哪一個參數當作目標去做計算  
![](/images/aws/aws-cloudwatch-logs-insights-04.png)

當然一樣可以多個 `| stats count(*) as sum by @path, @protocol`  
![](/images/aws/aws-cloudwatch-logs-insights-05.png)

## 後記

以上介紹一些個人比較常用的指令，官網還有很多非常好用的指令  
詳細有興趣可以到官網上查查看  
https://docs.aws.amazon.com/zh_tw/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html