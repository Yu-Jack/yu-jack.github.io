---
title: Docker Swarm 網路架構介紹 - Service Discovery
categories: DevOps
date: 2020-06-02 21:50:13
tags: [DevOps, network, docker, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

在上一篇 [Docker Swarm 網路架構介紹 - load balancing traffic path](/2020/05/25/docker-swarm-load-balancing/) 介紹過當流量進來的時候流程  
接下來這篇會介紹如何讓 container 之間可以透過 DNS 的方式進行連線  

## Container IP  

還記得上一篇提到實際上運行 service 的兩個 container IP 為 10.0.0.5, 10.0.0.6  
在我們透過 DNS 之前, 我們能不能先用 container IP 去互相連線呢?  
![host-a-container](/images/docker-swarm/12.png)  
![host-b-container](/images/docker-swarm/13.png)  

> 因為筆者機器重開的原因, 接下來的 ip 可能都會有些變動  
> 原本是 10.0.0.5 10.0.0.6  
> 會換成 10.0.0.7 10.0.0.8  
> 又或是 10.0.0.9 10.0.0.10  
> 主要去注意我在講哪一個 container 以及後面括號的 ip 即可  

我們在 container-a (10.0.0.7) curl container-b (10.0.0.8) 那一台會發現無法連線  

![host-b-container](/images/docker-swarm/15.png)  

這非常詭異, 理論上 container 之間應該要可以連線  
不然上一篇的隱藏的 ingress_sbox 怎麼可以連到其他台 container 呢?  

但神奇的事就來了, Docker 官方有說明可以透過 Custom Overlay Network 的方式讓 container 互相連線  
我們先來實作 custom overlay network 讓 container 之間互相連線  
再來頗析為何只有 Default Overlay Network 的 ingress_sbox 可以連線到其他 container, 但其他 container 之間卻無法連線  

## Custom Overlay Network

透過 `docker network create -d overlay my-overlay` 建立自訂義的 overlay network  
接著再啟動 service 的時候把這個 overlay network 附加上去  
`docker service create -p 5000:3000 --network="my-overlay" --name="hello-a"  --replicas 2 node-test`  
建立完成之後, 我們先進去看一下 container 的網路介面  
會發現, 每個 container 裡面又多了一個 10.0.1.x 的網路介面  
這個就是我們自定義的 overlay network, 所以 container 之間溝通就會透過此組 IP 去溝通  
此時會發現上面 10.0.0.x 的 IP 還是會保留, 原因是那是給 ingress_sbox 去做 load balancing 使用的  
接著我們試著在 container-a (10.0.1.4) curl container-b (10.0.1.3)  
會發現有正常回傳一個 HI, 就代表連線成功了！  
![host-a-container](/images/docker-swarm/17.png)  
![host-b-container](/images/docker-swarm/16.png)  

那麼一個疑問就來了, 他是怎麼找到另一個 container-b 的呢?  
為何在原本的 overlay 環境下無法連線, 但在這個 overlay 下卻可以連線  
試著在 container-a 裡面找是否有 iptables 等等的相關設定  
後來是透過 `ip neigh` 找到區網內把 IP 解析成 MAC 地址的一個地方  
透過 ARP 的方式可以找到 container-b 正確的位置  
另外從下面圖的結果看來, 可以發現 10.0.0.x 並沒有在這裡面  
這也符合在 default overlay network 狀況下, container 之間是無法連線的  
![container ARP](/images/docker-swarm/18.png)  

按照上面邏輯 default overlay network 下的 ingress_sbox 的 ARP 解析中  
應該會出現 10.0.0.x 10.0.0.y 兩個 container IP
因為在上一篇 ingress_sbox 充當 load balancing 的角色  
ingress_sbox 必須知道 10.0.0.x 以及 10.0.0.y 的 MAC 地址在哪裡  
從下圖中就可以看到確實在 ingress_sbox 裡面是有針對 10.0.0.x/y 去做 ARP 解析的  
![ingress_sbox ARP](/images/docker-swarm/19.png)  

接著最後就是來到 custom DNS 的部分, 在 container-a 和 container-b 裡面  
是可以輸入 http://hello-a:3000 去使用的 API 服務  
在 container-a/b 中應該有一個地方會把 hello-a 這個 domain 解析成特定的 IP  
這樣才能讀取到服務, 但是這個設定在哪裡?  

這個設定其實是藏在 Docker Engine 裡面的 DNS Server  
根據 [Docker 官網 - Swarm Native Service Discovery](https://success.docker.com/article/networking#swarmnativeservicediscovery)  
在 container query hello-a 的時候  
會先到 Docker 裡面的 DNS Server 去解析這個域名  
解析成功後才會返為此域名的 IP  

以官方提供的流程圖來說, Query myservice 這個域名  
透過 Docker DNS Server 會回傳此域名的 IP 為 10.0.0.3  

![ingress_sbox ARP](/images/docker-swarm/20.png)  

至於詳細設定的部分我翻了老半天都找不到, 這可能要直接去讀 docker 源碼了...  

## 後記  

這樣一來就稍微搞懂 docker 以及 docker swarm 裡面的網路架構流程  
大致上都是透過以下幾個技術去處理掉整個流程  

1. iptables
    防火牆管控, 可以導轉流量到應該要去的位置, 或是過濾不要的流量  
2. IPVS (IP Virtual Server, tool: ipvsadm)
    Linux 核心擁有的 Load Balancing
    在上一篇的範例中, 運用在 ingress_sbox ---load balancing---> service  
3. ARP (Address Resolution Protocol)
    解析 IP 後取得真正的 MAC Address 用
    在本篇的範例中, 運用在 container 之間互相溝通
4. NAT (Network Address Translation, tool: iptables)
    運用在 iptables 裡面的機制, 可以改變封包傳送端與接收端的 IP 地址  
    在上一篇的範例中, 運用在 localhost:5000 -> ingress_sbox  
5. Embedded DNS Server
    在 container 之中, 自定義的網域會來到這邊做解析, 並取得到自定義網域下的真實 IP  
    在本篇的範例中, 運用在 query hello-a 域名時  

這邊就記錄下來, 方便以後有個思路可以循著走

## References

1. [Blocking ingress traffic to Docker swarm worker machines](https://ops.tips/blog/blocking-ingress-traffic-to-docker-swarm-worker-machines/)
2. [iptables](http://wiki.weithenn.org/cgi-bin/wiki.pl?IPTables-Linux_Firewall)
3. [How Docker Swarm Container Networking Works – Under the Hood](https://neuvector.com/network-security/docker-swarm-container-networking/)
4. [nsenter 命令簡介](https://staight.github.io/2019/09/23/nsenter%E5%91%BD%E4%BB%A4%E7%AE%80%E4%BB%8B/)
5. [Docker Swarm Reference Architecture: Exploring Scalable, Portable Docker Container Networks](https://success.docker.com/article/networking)