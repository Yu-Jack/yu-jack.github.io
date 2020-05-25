---
title: Docker Swarm 網路架構介紹 - load balancing traffic path
categories: DevOps
date: 2020-05-25 21:50:13
tags: [DevOps, network, docker, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 什麼是 Docker Swarm?

Docker Swarm 簡單來說就是可以在多個 host 管理多個 container 一種工具  
透過 Docker Swarm 你可以輕易地部署應用程式到任何一台 host 上面  
假如其中一台 host 掛了, 也會立刻在另一台 host 上面啟動新的 container  
當然 Docker Swarm 不只有這個優點  
像是還有以下幾點 sacling, service discovery, load balancing 等等優點  
這邊先給個關於 sacling, load balancing 以及 service discovery 的概念  

1. scaling
    sacling 的概念比較單純, 也就是可以自動擴展或縮減 service 數量  
    當流量過大時, 可以一次啟動較多個 service 去處理流量  
    當流量過小時, 可以減少 service 去降低機器使用量  
2. load balacning
    當流量進入到 docker swarm service 中, 會有一套機制去把進來的流量進行分散  
    例如: 透過輪詢 (Round Robin) 的方式把流量分散出去  
    也就是輪流把流量送到各個服務去 (先送 A 再送 B 再來送 A 又再送 B ... loop)
3. service discovery
    在 docker swarm 中每一個 service 可以自定義自己服務獨有的 DNS  
    接著可以讓其他 container 使用這個 DNS 去使用到服務  
    例如: https://my-dns-api/api/path, 此 DNS 在其他 container 是都可以讀取的到  

> 這邊 service 指的是 container 中運行的應用程式  

這篇會把重點放在 docker swarm 如何達成 load balancing 的流程上面去做解析  

## 啟動 Docker Swarm

docker swarm 裡面有兩種角色

1. manager
    如其名, 就是負責管理 cluster 的主機, 以及去安排每一個 service 要放在哪一台啟動  
    但除此之外, 此 manager 也會負責啟動 service 的責任  
2. worker nodes
    如其名, 就是執行 service 的地方, node 在此代表的是 host  

要啟動 docker swarm 很簡單, 透過 `docker swarm init` 就可以啟動  
此時會看到一堆訊息出現, 意思就是去到其他要加入這個 swarm 的 node 上面輸入指令  
`docker swarm join --token SWMTKN-1-4lhtz5h8x327cgdulc0n55y4oncfy2gkg8ae5sygcuwwej8z8t-2yd2du8o3e85qx4bgp1fpwell 172.17.0.3:2377`  
![docker swarm init](/images/docker-swarm/01.png)  

輸入指令後就會跳出加入成功的訊息了  
![docker swarm join](/images/docker-swarm/02.png)  

再來透過 `docker node ls` 去確認目前的狀態  
可以看到現在哪一台 node 是 leader (manager) 哪一台是 woker  
(記得要再在 manager 那台輸入會有效)  
![docker swarm join](/images/docker-swarm/03.png)  

接著我們先建立一個 API Service (3000 port)  
此 service 已經被我包成一個 image  
而要丟進去 docker swarm 中, 可以輸入以下指令  
`docker service create --replicas 2 --name="hello-a" -p 5000:3000 node-test`  

> --replicas 代表說我目前要讓他啟動 2 個 container 去運行我的 service  
> 透過 `docker service scale hello-a=3` 就可以把 container 數量改變成 3 去應付大流量  
> 降低則是可以透過 `docker service sacle hello-a=1` 去降低使用數量  
> --name 是定義此服務的名稱, 也可以在往後當成 DNS 給其他 service 進行使用  
> -p 5000:3000 是要把 container 裡面的 3000 port 轉到 host 的 5000 port
> 要注意在 docker swarm 的 host 中都必須要有此 image 才可以啟動哦！    

執行完成之後, 試著在兩台不同 node 上面輸入 `docker ps`  可以看到會有兩個 container 正在運行  
也可以透過 `docker service ps hello-a` 去檢查  
![docker service ps](/images/docker-swarm/04.png)  

接著先在 manager node 輸入 `docker service logs hello-a -f` 去查看目前 service log
接著在另一台 node 上面輸入 `curl http://localhost:5000` 會發現可以正確回傳且有 log 出現  
而且會發現 log 是按照順序出現在第一台, 接著第二台, 又回去第一台  
這就是我們一開始說到的 load balancing 的概念 (採用輪詢))  
![load balancing](/images/docker-swarm/05.png)  

## load balancing 是如何運作?  

接著我好奇這種 load balancing 到底是如何運作  
每一台機器可以擁有自己的防火牆規則, 而 iptables 就是管控這些規則的一個服務  
要知道流量是如何進行, 首先可以先從 iptables 下手  
所以我們要先知道從 5000 port 近來的流量先到了哪裡  
在其中一台 node 輸入 `iptables -L -t nat` 可以查看進來的流量會被轉去哪裡  

> 這裡科普一下, iptables 至少會有三種表格 filter nat mangle  
> filter 是流量進到主機本身去決定要不要 accept or drop or forward 用的  
> nat 是流量跟此台主機並無太大關係, 主要是做來源與目的 ip & port 的轉換, 轉到更後面的伺服器  
> mangle 屬於特殊表格, 會去標記某些規格並去改寫封包  
> 詳細可以看[鳥哥的教學](http://linux.vbird.org/linux_server/0250simple_firewall.php#netfilter_chain)

從圖中最下面那條規則可以發現流量被導入到 172.19.0.2:5000 這邊去了  
那麼 172.19.0.2 又是哪一台呢?
![iptables -L -t nat -nv](/images/docker-swarm/06.png)  

接著用 `ifconfig` 查看目前網路介面可以發現  
有一條 172.19.0.1 那一個網路介面, 看來跟這個非常有關係, 名字則是 docker_gwbridge  
這是此 node 建立 container 之後, 跟這個 container 建立連線用網路介面  
所以代表 node 裡面一定有一個 container 的 ip 是 172.19.0.2  
![ifconfig](/images/docker-swarm/07.png)  

透過 `docker network inspect docker_gwbridge`  
看看是哪一個 container 掛在此 ip 上面  
![docker network](/images/docker-swarm/08.png)  

這裡發現有一個被隱藏起來的 container 名叫做 `ingress-sbox`  
所以看起來流量是先進入這個 container 然後再把流量分配到真正的 service  
那麼 ingress-sbox 是透過什麼方式把流量導入過去呢?  

透過 `nsenter --net=/var/run/docker/netns/ingress_sbox`  可以進去到此 container 的網路介面去  
在裡面輸入 `iptables -L -t nat` 以及 `iptables -L -t mangle`  
關於 iptables 詳細路由順序介紹可以看[鳥哥的教學](http://linux.vbird.org/linux_server/0250simple_firewall.php#netfilter_iptables)去理解, 這邊就不多作介紹  
![iptables mangle](/images/docker-swarm/09.png)  
![iptables nat](/images/docker-swarm/10.png)  

這邊就直接把路釐清  

1. 封包先進入到 mangle 這張表的 PREROUTING  
2. 發現 5000 port 被標記著 0x102 這條規則
3. 透過輸入 `ipvsadm -L` 可以找到此條規則的設計  
    `printf "%d\n" 0x102` = 258 
    就發現這裡指向兩個 ip, 而這兩個 ip 就是我們真正 service 的 ip 了  
    流量就是在這邊開始進行 Load Balancing 被導入過去  
    ![iptables nat](/images/docker-swarm/11.png)  
4. 那因為進入到 mangle 這個 table 就把流量導走了, 所以就用不到 nat 那一張表格  

> 這邊 Load Balancing 是透過 IPVS 去達成的  
> 詳細 IPVS 介紹可以看看[此篇教學](https://www.hwchiu.com/ipvs-1.html)

這邊就確認一下 10.0.0.5 和 10.0.0.6 是不是真的是 container ip  
在各自 host 透過 `docker inspect container-id` 可以查看到各自 container 的 ip  
可以發現裡面確實是有 10.0.0.5 和 10.0.0.6
![host-a-container](/images/docker-swarm/12.png)  
![host-b-container](/images/docker-swarm/13.png)  

## 總結

1. 流量先進入到 host 的 5000 port
2. 發現 host 有一條規則是把流量導入到 ingress_sbox container  
3. 在 ingress_sbox container 裡面又再把流量導入到真正的 service container  

詳細流程可以參照以下這張圖去比對, 請看黃色那一條虛線的路 (有標記數字)  
搞懂 load balancing 的概念後, 下一篇將會解析 docker swarm 如何做到 service discovery (custom DNS)  

![flow](/images/docker-swarm/14.png)  

## References

1. [Blocking ingress traffic to Docker swarm worker machines](https://ops.tips/blog/blocking-ingress-traffic-to-docker-swarm-worker-machines/)
2. [iptables](http://wiki.weithenn.org/cgi-bin/wiki.pl?IPTables-Linux_Firewall)
3. [How Docker Swarm Container Networking Works – Under the Hood](https://neuvector.com/network-security/docker-swarm-container-networking/)
4. [nsenter 命令簡介](https://staight.github.io/2019/09/23/nsenter%E5%91%BD%E4%BB%A4%E7%AE%80%E4%BB%8B/)
5. [Docker Swarm Reference Architecture: Exploring Scalable, Portable Docker Container Networks](https://success.docker.com/article/networking)