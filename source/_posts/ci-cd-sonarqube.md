---
title: CI/CD 實現 - Sonarqube 篇
date: 2021-01-17 16:14:40
categories: DevOps
tags: [jenkins, DevOps, Sonarqube, CI/CD]
header-img: /images/banner.jpg
catalog: true
---

## 前言

究竟如何評估一個專案狀態是好是壞, 是否有持續成長變得更好?
在沒有數據化的情況下, 也只能依靠感覺去評估專案是否有往好的方向前進
那麼如果想要評估, 該依什麼樣的角度去思考呢?
筆者認為 Code Analytics 以及 Test Coverage 是一個能**參考**的結果

特別是 Test Coverage 的部分, 這得依據 Testing 寫得好壞去評估
萬一一個 Testing 是沒有任何斷言(assert)的話, 這樣 Test Coverage 也是 100%
這就沒有任何參考價值了

專案變得更好, 這句有點抽象
那我們來想想, 什麼樣叫做爛專案

1. 程式碼可讀性非常差, 接手後沒人看得懂
2. 註解寫的亂七八糟, 沒有任何參考價值
3. 變數函式命名都是靠擲筊想出來的, 只有通靈王才讀得懂
4. 漏洞一堆, 框架都提供 ORM 讓你用結果還自己組 sql 導致 sql injection
5. 架構設計上沒有預先思考, 同樣程式碼一直重複在所有地方
6. 沒有自動化測試, 改一個地方後雙重間接地影響到其他功能  ....... 等等

其實還有很多, 但就簡單列幾個
那問題就來了, 專案一開始爛沒關係, 凡是給別人一個機會看他會不會變得更好
聽起來只要上面列的幾點, 有持續改善就是越來越好, 但我們要怎麼知道?
這就會需要 Code Analytics 以及 Test Coverage 的從旁幫助

透過每次提交新的程式碼去獲取以下數據, 就可以知道每一次新提交的程式碼是否有改善

1. Test Coverage
2. Testing 數量
3. 是否有漏洞問題出現
4. 是否有程式碼壞味道
5. 是否有明顯的 Bug

但這實際改善還是得配合 Code Review 才能做到  
比如說是程式設計架構好不好, 這還是得透過『人』去處理, 畢竟事在人為  
獲取以上數值只是拿來量化專案
工具只是一種輔助, 實際能幫助的還是有限的  
如果寫的人不看建議也不想修改 ...... 那我會先建議你先喝杯茶再說了  

那這邊使用的工具會是使用 Sonarqube + Jenkins + Slack
Jenkins + Slack 上次 CI/CD 那篇就提過, 所以這裡不會提到太多
這裡會以 Sonarqube 掃描和如何在 Jenkins 上使用為主軸

## Sonarqube 介紹

Sonarqube 就是一款 Code Analytics 的工具
可以幫你獲取上述幾點的數據, 也會告訴你當有漏洞或壞味道出現時應該怎麼修改程式

這邊快速簡介 Sonarqube 的運行架構, Sonarqube 會有所謂 scanner 以及 server
scanner 就是專門去掃程式用的, 掃完程式的結果會放置 server 
而我們就會登入到這台 server 去看程式掃出來的結果

這是掃描專案的主畫面, 可以看到上面有出現兩個 Bug
![](/images/ci-cd-sonarqube/images-01.png)

這個 Bug 點進去會看到這樣的圖
![](/images/ci-cd-sonarqube/images-02.png)

我事先先寫了一個無窮迴圈的程式
這時 sonarqube 就有幫我掃出來問題
再往下點進去, 他會有一個說明告訴你為什麼他會找到這個 Bug
他會給你一個正例和反例讓你了解問題在哪
![](/images/ci-cd-sonarqube/images-03.png)

以上為其中一個例子, 其他還有很多規則像是 Security Hopspot
以下圖來說, 他就會告訴你在寫 express 的時候, 要注意不要寫入過於敏感的資訊
也告訴你不要嘗試以為用 encode 的方法存入就沒問題, 因為還是會被 decode 出來
![](/images/ci-cd-sonarqube/images-04.png)

再來就是我們比較注意的點, 也就是是否這些問題和 Test Coverage 都有記錄起來
這裡都會記錄每次掃描到的問題, 所以透過折線圖會清楚了解到目前專案是不是累積越來越多問題
可以看到 04:25 掃描的結果和 04:30 掃描的差異結果
![04:25](/images/ci-cd-sonarqube/images-05.png)
![04:30](/images/ci-cd-sonarqube/images-06.png)

再來就是 Test Coverage, Sonarqube 其實也提供讓你把 Unit Test 的結果丟上去並去做紀錄
從下圖中可以看到 2020/12/18 當時有掃描了 2 個 unit test, 且 Test coverage 都是 100%
![](/images/ci-cd-sonarqube/images-07.png)

而圖中上面可以看到目前總共用 6 個 Unit Test, 且總體的 Test coverage 都是 100%
所以除了每次分別紀錄的 Test coverage 之外, 也會告訴你總體的 Test coverage 是否有在成長

## 整合後流程使用說明

有一點非常重要先提到, 因為 Sonarqube 掃描多 branch 版本是需要錢的
但我只有 community 的版本可以用, 也就是上面只有一個 branch 可以用
所以做法上, 我會把一個 branch 放成一個 project

假設專案叫做 test, branch 有 test1 和 test2
在 Sonarqube server 上就會建立兩個 Project 去做掃描

1. test:test1
2. test:test2

而為何以這種方式建立

原因是這整套系統使用的基本需求就是會掃描開發者各自的 branch  
但為了讓開發者各自的 branch 第一次掃描也會被 Sonarqube 算在**新提交的程式碼**的前提下  
必須先掃描一次 develop branch 的版本到 Sonarqube 當做基底  

這樣當下次開發者掃描各自的 branch 時, 就可以從第一次開始計算  
那為了不讓各自開發者互相影響到, 所以會以 {project_name}:{branch_name} 去開 Sonarqube project  

我們來舉個例子看一下  
目前有兩支 AB 程式都各有一個 Bug  
但在 master/develop branch 中, 只存在一支程式 A, 在另一個 branch test 中存在另一支程式 B  
如果今天我直接以 branch test 去掃描會發生什麼事情? 

在 New Code 是不會看到任何指標
![](/images/ci-cd-sonarqube/images-11.png)

而在 Overall Code 卻會看到兩個 Bug
![](/images/ci-cd-sonarqube/images-12.png)

那我們預期的結果是什麼?  
我們想要在 Overall Code 中出現 AB 程式, 但在 New Code 只想要出現 B 程式  
也就是我們得先以 master/develop 先掃描一次之後, 再去掃描另一個 branch test 才會有這樣的效果  

![](/images/ci-cd-sonarqube/images-14.png)
![](/images/ci-cd-sonarqube/images-13.png)

整體流程圖如下

藍色區域是 MainPipeline 執行  
紅色區域是 SonarqubeJob 執行  
被藍色包起來代表, 觸發點是 MainPipeline, 執行過程會去呼叫 SonarqubeJob  

![](/images/ci-cd-sonarqube/flow.png)


## Jenkins + Sonarqube

主要是透過 Jenkins pipeline 的方式去運作
這邊就附上上面流程中的兩個 Job 的 pipeline

1. (MainPipeline) 主要流程的 pipeline
	https://gist.github.com/Yu-Jack/f7f03ca8dccdd04bed4a1428e48eb7af

2. (SonarqubeJob) 專門掃描程式的 pipline, 而因為後面專案有使用 java 和 nodejs, 所以會根據參數決定要用哪一個去掃描
	https://gist.github.com/Yu-Jack/f7f03ca8dccdd04bed4a1428e48eb7af#gistcomment-3591103

> 為了不想讓文章看起來太長, 所以就全部都放 gist

而特別要注意的是在 Jenkins 裡面的 Sonarqube 環境設置, 包含以下三點

1. Jenkins plugins
	去外掛管理程式裡面安裝 `SonarQube Scanner` `nodejs` 兩個 plugins

2. Sonarqube scanner
	scanner 的部分在掃描程式的 pipeline 中透過以下方式設定 scannerHome
	```
	environment {
	    scannerHome = tool name: 'sonarqube-scanner-test'
	}
	```
	詳細的這個 `sonarqube-scanner-test` 名稱
	可以在 `管理 Jenkins > Global Tool Configuration > SonarQube Scanner` 裡面發現
	
3. Sonarqube server
	server 的部分在掃描程式的 pipeline 中透過以下方式設定 server 位置
	```
    environment {
			sonarqube_server = 'http://sonarqube:9000'
	}
    ... other code
    ... other code
    ... other code
	withSonarQubeEnv('local-sonarqube')
	```
	上面的 `sonarqube_server` 是為了打 api 暫時先設置的
	下面的 `local-sonarqube` 可以在 `管理 Jenkins > 設定系統 > SonarQube servers` 裡面發現

## Demo

利用 MainPipeline 去 build 參數  
![](/images/ci-cd-sonarqube/images-08.png)

下面提供測試用的參數

第一組測試參數
branch: feature/test-3
git_repository_name: sonarqube-test-demo
project_type: nodejs

![](/images/ci-cd-sonarqube/images-10.png)

第二組測試參數
branch: feature/test-4
git_repository_name: sonarqube-test-demo-java
project_type: java

![](/images/ci-cd-sonarqube/images-09.png)


有興趣想玩玩的, 我也有包成 docker-compose.yml 可以去使用, 可以按照以下步驟去實驗  
jenkins 和 sonarqube 的帳號密碼皆為 admin:root  

1. `docker run -d --name="demo_backup" jk82421/jenkins_server:v1`
2. `docker cp demo_backup:/var/jenkins_home_backup/jenkins_home ~/Downloads/jenkins-sonarqube-test`
    把我的備份的 jenkins_home 先複製出來
3. 把 docker-compose 的 `{Your_downloaded_jenkins_home}` 改成  `/Users/name/Downloads/jenkins-sonarqube-test`
    記得 name 這裡要填你自己的
4. 執行 docker-compose up,  docker-compose.yml 如下
    ```yml
    version: "3.7"

    services:
    sonarqube:
        image: jk82421/sonarqube_server:v2
        ports:
        - 9000:9000
    jenkins_server:
        image: jenkins/jenkins:lts
        volumes:
        - {Your_downloaded_jenkins_home}:/var/jenkins_home
        ports:
        - 8080:8080
        - 50000:50000
    ```
5. 最後記得停止和刪除一開始備份的東西
    ```sh
    docker stop demo_backup
    docker rm demo_backup
    ```
6. Jenkin 網頁在 http://localhost:8080
    Sonarqube 網頁在 http://localhost:9000

以下紀錄 jenkins 和 sonarqube 有調整的部分

### sonarqube 部分

1. 帳號密碼為: admin:root
2. 幫 admin 建立一組 api token (00f31133302ea8d7fdec5e3ff72fbb67d3b7632d)
3. 記憶體最大都調整到 1024mb

### jenkins 部分

1. 帳號密碼為: admin:root
2. 安裝 Sonarqube scanner
3. 環境有設置 Sonarqube scanner 的名稱, 以及設定 api token credential
4. 安裝 nodejs plusgin
5. 環境有設置 nodejs 的名稱
 
### docker container 部分

1. 內存建議需要調到 4GB 以上 (因為 sonarqube + es 需要比較大的內存, 個人是調到 8GB)

### 問題紀錄

過程中有到以下兩個常噴的錯誤  
這兩者問題發生跟記憶體不足是有關係的  
若遇到則把 docker container 或是使用的 host 記憶體加大應該可以解決問題  

```
SonarQube Process exited with exit value [es]: 137
```

```
2021.01.17 06:37:35 WARN  web[][o.s.s.a.EmbeddedTomcat] Failed to stop web server
org.apache.catalina.LifecycleException: A child container failed during stop
```

## 後記

這版本還有一些地方要進行調整

1. 例如拉 branch 的方式, 應該要配合 credential 去處理
2. 目前 repository 是寫死的, 應該要變成可調動的參數

這些就先留給未來的我慢慢調整拉