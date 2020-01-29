---
title: AWS Certificate Manager 如何更換憑證 (Reimport Certificate)
categories: AWS
date: 2020-01-06 10:16:52
tags: [aws, certificate, acm]
header-img: /images/banner.jpg
catalog: true
---

## 前言  

AWS 有提供一套服務可以把申請好的憑證一次給多個服務使用  
掛載在上面的憑證可以給 load balanacer, cloudfront 等等使用  

<!-- more -->

以 load balancer 來說  
外面 https:443 進來後，要導入到 http:8080 的服務  
就會需要把憑證解開，然後進一步把流量往裡面送  
所以在 load balancer 上面就一定要掛載 private/public key 才有辦法去解開進來的流量  
像是在選 load balancer 的頁面，選擇 port forwarding 的時候就會需要選擇要掛載哪一個 certificate  
![](/images/aws/aws-acm-01.png)

而在 cloudfront 的時候  
在申請的同時也會需要填入要用哪一組憑證 (Customer Certificate)  
![](/images/aws/aws-acm-04.png)

當選入憑證的時候，Cloudfront 配給你的 domain 是 xxxxx.cloudfront.net 這種  
但憑證假設安裝的事 api.example.com 這種，會導致不安全的提示出現  
此時會需要到網域註冊商，把 CNAME api 指到 xxxxx.cloudfront.net  
到時候瀏覽 api.exmaple.com 就會出現合法的憑證了  

## 如何更新憑證

首先要進入到 AWS 的 Certificate Manager 頁面，並且點選你想要 Reimport 的憑證  
右上角會有一個藍色的『Reimport Certificate』按鈕，點選下去會到一個輸入頁面  
![](/images/aws/aws-acm-02.png)

到了輸入頁面會看到有 Certificate Body, Certificate Private Key, Certificate Chain  
接下來就把跟網域註冊商申請到的憑證一個一個貼上去即可，注意這裡要是 PEM 格式  
![](/images/aws/aws-acm-03.png)

其實在新增憑證的時候，也是一模一樣的流程  
