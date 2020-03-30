---
title: 如何啟用 AWS EC2 Ipv6 ?
categories: AWS
date: 2020-03-30 11:50:13
tags: [aws, ec2, ipv6]
header-img: /images/banner.jpg
catalog: true
---
## 前言 

要讓 ec2 支援 ipv6 要先注意以下三點事項  
確認好這三點可以先 Marked 一下待會要額外做哪一些設定  

1. 確認 ec2 instance type 是否支援 ipv6, 可參考 [Instance Types](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html)
2. 確認 ec2 instance 是在 public subnet 還是 private subnet
    * public subnet → 要用到 internet network gateway  
    * private subnet → 要用到 egress-only network gateway
3. 確認 ec2 建立的方式, 以下有兩點要注意
    * 2016.09 後 Linux 不需要多作設定
    * 如果機器是用 AMI 建立的話, 需要手動設定 ipv6 的設定才能啟用 ipv6
        其他版本 OS 使用方法可以參考 [Configure IPv6 on Your Instances](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-migrate-ipv6.html#vpc-migrate-ipv6-dhcpv6)

## 啟用 ipv6

啟用 ipv6 有以下幾個步驟要走  

1. VPC 需要啟用 ipv6, 按下 Add IPv6 CIDR 讓它自動產生一組
    ![vpc cidr](/images/ec2-ipv6/ec2-ipv6-01.png)
2. Subnet 需要設定 ipv6 CIDR, 這邊注意到圖中的 00
    是可以從 00 01 02 這樣慢慢設定上去, 另外這個 00 是以 16 進位表示
    ![subnet cidr](/images/ec2-ipv6/ec2-ipv6-02.png)
3. 設定 Route Table 對外的部分
    Desitination: `::/0`  
    以下二擇一, 根據 ec2 所在的環境判斷  
    (Private Subnet) Target: egress-only network gateway  
    (Public Subnet) Target: Internet network gateway  
4. 設定 ec2 的 Security Group, Outbound 的部分要設定
    Desitination: `::/0`  
    Type: `All Traffic`  
    Protocol: `All`  
    Port range: `All`  
5. 指派 ipv6 給 ec2, 按下 Assign New IP 之後留空, 再按下 `Yes, Update` 讓它自己指派  
    ![ec2 ipv6](/images/ec2-ipv6/ec2-ipv6-03.png)

接下來最後一點, 就要看機器狀況, 如同一開始提到的兩個情況

1. 2016.09 後 Linux 不需要多作設定 
2. 如果機器是用 AMI 建立的話, 需要手動設定 ipv6 的設定才能啟用 ipv6
    其他版本 OS 使用方法可以參考 [Configure IPv6 on Your Instances](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-migrate-ipv6.html#vpc-migrate-ipv6-dhcpv6)

這邊就介紹用 Ubuntu 14 版本啟用的方式

## Ubuntu 14 版本啟用 ip v6 的方式

1. 修改 /etc/network/interfaces.d/eth0.cfg 內容
    請在 iface 的下面一段加上 `up dhclient -6 $IFACE` 
    ```sh=
    # 原本
    auto eth0
    iface eth0 inet dhcp
    
    # 修改後
    auto eth0
    iface eth0 inet dhcp
        up dhclient -6 $IFACE
    ```
2. 接著 `sudo reboot` 
3. 輸入 `ifconfig` 確認 ipv6 是否正確, 如果不正確, 輸入 `sudo dhclient -6` 啟用 ipv6

其他版本 OS 使用方法可以參考 [Configure IPv6 on Your Instances](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-migrate-ipv6.html#vpc-migrate-ipv6-dhcpv6)

## References

1. [Migrating to IPv6](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-migrate-ipv6.html#vpc-migrate-ipv6-example)