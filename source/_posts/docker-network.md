---
title: Docker 網路介紹
categories: DevOps
date: 2020-05-18 21:50:13
tags: [DevOps, network, docker, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

在使用 docker 的時候最常出現網路連線的問題  
要如何連線到 container 裡面啊, 要如何讓 container 之間互連線等等  
要解決這些問題之前, 又要先了解 docker 的網路設置方法有哪些  
而這些設置方法各自有可以達成什麼樣的功效  

## None

None 代表的就是沒有網路, 也就是外部使無法訪問此 container 的服務  
此 container 也無法訪問到外部的網路服務  

## Host

在 A 電腦上面運行 container B  
然後透過 `docker run --network="host" image` 運行時  
在電腦 A 上面是可以直接讀取到 localhost:8080  
並不需要設置什麼 `-p 8080:8080` 的 port forwarding 的方式即可使用  
透過 host 設置方法, 就是直接使用 host 的網路介面, 甚至可以進行修改  
但此這是方法並不建議使用在正式環境上  

只是這邊要特別注意, 只有在 linue 的環境下才能使用 host 的指令  
詳細可以看 [docker 官網](https://docs.docker.com/network/host/)的解釋
> The host networking driver only works on Linux hosts  
> and is not supported on Docker Desktop for Mac, Docker Desktop for Windows, or Docker EE for Windows Server.  

## Bridge (預設網路介面)

![bridge network](/images/docker/bridge.png)

如上圖所示, bridge 就是在各個 container 之間架起一個橋樑  
可以想像成在這個橋樑之間的城市, 都擁有自己的街道名, 在這裡就是都有各自的 IP  
城市之間都可以各自溝通, 也就是 container 可以使用各自擁有的 IP 進行溝通  
而 host 算是獨立在這整個系統之外的地方, 要與這個 container 進行連線溝通必須先經過登記  
這個登記就是在運行 container 的時候設置 `docker run -p targetPort:hostPort` 這個屬性  
透過把 targetPort 轉換到 hostPort, 例如說 8080:3000  
這樣在 container 裡面的 3000 port 就可以在 host 的 8080 port 讀取到服務了  

<br>

而這個 bridge 還有一種方式, 是可以自訂字 bridge 的名稱, 這也是官方最推薦的一種方式  
可以想像原本預設 bridge 是官方自定義的一種名稱, 但我們是可以透過以下指令客製化這個 bridge 的名字  
`docker network create -d bridge custom-bridge`  
當我們客製化 bridge 的名字後, 當 container A & B 透過以下方式使用這個 custom-bridge 的時候  
`docker run --network="custom-bridge" imageA`  
`docker run --network="custom-bridge" imageB`  
就代表也只有他們彼此在使用這個網路介面, 在這個狀況下 container A & B 之間溝通的方式  
就可以透過 container ID 去進行溝通, 例: `http://containera-id:port`  
但在這使用預設的 bridge 是無法達成的, 必須要用自訂義的才可以  

<br>

除此之外, container A 和 B 之間也是能透過自定義的名字去進行溝通  
`docker run --network="custom-bridge" --name="container-a" imageA`  
`docker run --network="custom-bridge" --name="container-b" imageB`  
當我在啟用 container 的時候自定義名字時  
他們之間就可以用 `http://container-a:port` 以及 `http://container-b:port` 進行溝通了

快速總結

1. 使用預設 bridge 以及預設 name -> 只能使用 container ip 互相連線
2. 使用自定義 bridge 以及預設 name -> 可以透過 container ip & id 互相連線
3. 使用自定義 bridge 以及自定義 name -> 可以透過 container ip & id & name 互相連線

## Overlay  

此種網路配置是希望在不同 host 之間的 docker dameon 能夠互相連線  
並且讓 host 裡面的 container 都連到同一個網路, 進而讓 container 互相溝通  

> docker dameon 可以想像成運行 docker container 的程序  

![overlay network](/images/docker/overlay.png)

在 docker overlay 的網路概念就一定會提到 docker swarm  
而 docker swarm 也是 docker container cluster 的管理工具  
那因為 docker 官網針對 overlay network 的概念是綁定在 docker swarm 上介紹  

詳細的 docker swarm 下篇會講到架構  
以及在 docker swarm 的架構下網路是如何流動的  

## References

1. [Docker Network Overvie](https://docs.docker.com/network/)
2. [給新手的 Docker 網絡入門](https://cowsay.blog/post/j0773pki/)