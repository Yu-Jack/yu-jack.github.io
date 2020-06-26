---
title: 伺服器的 ssh 設定被弄壞了, 無法登入怎麼辦?  
categories: DevOps
date: 2020-06-26 17:10:06
tags: [ssh, mount, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

有時候在調整伺服器上的 ssh service 的時候 (/etc/ssh/sshd_config)  
可能要設置 `AllowUser` 只允許誰登入  
但好死不死的, 可能就在調整的時候沒注意到錯字  
就不小心把 ssh 玩壞, 導致接下來登入的時候都完全無法登入  
最慘的情況下, 是沒有任何地方可以登入, 就連用 root 也無法  
這樣的狀況下, 可以透過卸載和掛載的方式去處理  

> 這邊發生的狀況是以 AWS EC2 的案例為主  

## 解決方法

1. 首先要把硬碟卸載下來, AWS 的 EC2 主要 root device 是掛載在 `/dev/sda1`  
    透過以下選取到 root device 之後把他 Detach Volume
    ![](/images/aws-ec2-ssh/ssh-01.png)  
    ![](/images/aws-ec2-ssh/ssh-02.png)  
2. detach 成功之後, 直接掛載在另一台可以正常登入的伺服器
3. 掛載完成之後可以在伺服器上輸入 `lsblk` 去看是否有掛載成功  
    這邊掛載成功的名字就是待會要 mount 的名字  
    通常掛載到另一台上面的話, 名字不會是 xvda1, 而會是別的名字  
    ![](/images/aws-ec2-ssh/ssh-03.png)
4. 接著就是要透過 `mount /dev/vda1 /mnt/folder` 掛載在 `/mnt/folder` 這個資料夾底下  
5. 執行完指令之後, 就可以在 `/mnt/folder` 去操作原本壞掉機器上的硬碟了  
6. 結束之後, 透過 `umount /mnt/folder` 的方式把硬碟卸載  
7. 最後在 AWS 上面把那個 root device Attach Volume 到原本那台伺服器上即可  
    但要注意的是, 記得掛載的名字一定要選 `/dev/sda1`  
    因為這是 EC2 預設的開幾的地方, 名字換別的會導致無法開機唷  