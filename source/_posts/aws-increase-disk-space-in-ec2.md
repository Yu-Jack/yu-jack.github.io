---
title: 如何增加 EC2 硬碟大小 (Expand the disk space in EC2)
categories: AWS
date: 2020-01-06 23:10:13
tags: [aws, ec2, disk]
header-img: /images/banner.jpg
catalog: true
---

## 前言

在使用 AWS 服務時，有時候會因為 log 量太大導致硬碟大小不夠  
此時會需要把硬碟增加大小，以免整台機器爆掉  
接下來會針對如何增加硬碟大小做說明  

<!-- more -->

## 確認硬碟大小方法

可以透過 `df -h .` 指令確認硬碟目前使用的大小  
這時候可以看到硬碟配置的大小  
![](/images/aws/aws-ec2-disk-01.png)

接下來可以透過 `lsblk` 回找最大上限的配置可以是多少
上面 xvda 就是最多可以有多少大小
下面 xvda1 就是實際上目前有多少大小
![](/images/aws/aws-ec2-disk-02.png)

看另一個例子，以下圖的 xvdi 和 xvdi1 來說  
可配置最大上限為 8G，但目前正在使用的最大上限為 1023 MB  
![](/images/aws/aws-ec2-disk-03.png)

## 增加硬碟大小

到 EC2 的頁面點選要更新的 EC2，點選右下角 disk  
![](/images/aws/aws-ec2-disk-04.png)

點進去之後，就進入到另一個頁面，點選 Action > Modify，會看到以下頁面，就可以增加大小了  
![](/images/aws/aws-ec2-disk-05.png)

接下來要到 EC2 裡面把實際上使用的大小擴充到可配置的最大空間  
以剛剛的 xvdi 為例的話，需要執行以下兩個指令才可以擴充
```
sudo growpart /dev/xvdi 1
sudo resize2fs /dev/xvdi1
```
這樣大小會直接擴充至可配置的最大上限，如果不想要配置到最大的話  
可以在後面加上幾 G 去做限制，如下
```
# 擇一
sudo resize2fs /dev/xvdi1 2G
sudo resize2fs /dev/xvdi1 2048M
```