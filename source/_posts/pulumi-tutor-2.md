---
title: Pulumi Service 與 File System Backend 差異
date: 2022-03-13 22:00:17
categories: DevOps
tags: [pulumi]
header-img: /images/banner.jpg
catalog: true
---

<style>
    .emgithub-container code.hljs {
        color: unset;
        background: unset;
        line-height: 18px;
    }
</style>

## 前言

在前一篇 [Pulumi 導入教學介紹#state-and-backend](/2022/02/22/pulumi-tutor/#state-and-backend) 中有提到不同 Backend 的差異。

但每一個不同的 Backend 有各自的優缺點，當然最好的是選用 Pulumi Service 他們本加自己的 Backend，詳細優點說明可以看 [Deciding On a Backend](https://www.pulumi.com/docs/intro/concepts/state/#deciding-on-a-backend) 的說明。

這篇就是實際來操作直接使用 pulumi host service 跟用 file system 的差異去驗證 Pulumi 說明的是否正確，不過有些點我沒有頭緒驗證，所以只能驗證一些能重現的情境 XD

## Concurrent  

通常在執行 `pulumi up` 的時候，有可能會出現同時有兩個人在運行，我們就來直接看實際差異吧！

以下是用 tmux synchronize-panes 去做同時操作，所以會有左右各一個畫面出現。

### S3 Bucket

當我同時執行 `pulumi up`，Pulumi 會先嘗試去建立 lock file，會發現是互相鎖起來的。

![](/images/pulumi-tutor-2/01.png)

原因是在 Update 的程式碼裡面，有一段呼叫 Lock 程式碼。

<script src="https://emgithub.com/embed.js?target=https%3A%2F%2Fgithub.com%2Fpulumi%2Fpulumi%2Fblob%2Fc5a4321b61f4f3b02701c57ea2c262773c9d2f2a%2Fpkg%2Fbackend%2Ffilestate%2Fbackend.go%23L457-L478&style=github&showBorder=on&showFileMeta=on&fetchFromJsDelivr=on"></script>

這個 Method 在建立 Lock 的同時，前後都會檢查一次 Lock，所以才互相撞到。

<script src="https://emgithub.com/embed.js?target=https%3A%2F%2Fgithub.com%2Fpulumi%2Fpulumi%2Fblob%2Fc5a4321b61f4f3b02701c57ea2c262773c9d2f2a%2Fpkg%2Fbackend%2Ffilestate%2Flock.go%23L105-L129&style=github&showBorder=on&showFileMeta=on&fetchFromJsDelivr=on"></script>
### Pulumi Service

當我改用 pulumi 時會發現，有一邊被 reject 掉，另一邊接著就會成功執行，個人猜測應該類似用 increment ID + unique key 去避免 concurrent request。

另外還有跟 Concurrent 無關的優點，是直接用 Pulumi Serviec 就可以不需要設定 `PULUMI_CONFIG_PASSPHRASE` or `PULUMI_CONFIG_PASSPHRASE_FILE` 算是蠻方便的。

![](/images/pulumi-tutor-2/02.png)

## 後記

很可惜目前只能想到這 Case 去驗證，之後等到實作遇到更多的案例再來分享在這了！