---
title: CI/CD 實現 - bitbucket & Jenkins 篇
categories: DevOps
date: 2020-02-17 05:07:54
tags: [jenkins, DevOps, w3HexSchool, CI/CD]
header-img: /images/banner.jpg
catalog: true
---

## 前言

試想一下，我們把專案 push 上去後  
接下來就是要進行本地測試
測試完成後，把專案推上去，把 PR 發給相關人員通過後  
需要把大家的 branch 都合併  
然後我們就要把這個程式放到正式環境  
這一整個行為被稱為 CI/CD  

CI 就是上述提到的版控、程式碼分析、建置、自動化測試
CD 就是把要 Release 的程式放到正式環境去，讓真正的使用者使用

雖然大家都狂說 CI/CD 是很屌很猛  
但其實工程師當久了  
版控、程式碼分析、建置、自動化測試、部署這一整套流程  
自然而然能夠自動化就自動化，才沒在管叫做 CI/CD (雖然有了這名詞溝通上很方便就是了XD
而且每個公司的 CI/CD 流程都會根據架構服務有所變形  

CI/CD 工具只是輔助，重點是整套流程要出來才對  
根據不同流程，會有不同的 CI/CD 工具可以應用  
應該先釐清公司的服務和架構該如何做到 CI/CD 再來去想用哪些工具  
假如說公司都已經全都 container 化，那用 drone 或許是一個不錯的選擇  
又或是現階段架構不大，可以採用人工介入的半自動 CI/CD 來減少全自動化的成本等等  
在這推薦筆者覺得觀念寫得不錯的文章[架構師觀點: 你需要什麼樣的 CI / CD ?](https://columns.chicken-house.net/2017/08/05/what-cicd-do-you-need/)

這篇文章主要是記錄筆者有在使用 CI/CD 流程的一部分筆記  

## 流程圖

大致上流程如下
1. 本地端把程式 push 到 bitbucket  
2. bitbucket 接收到 push 的通知後，把此消息告訴 jenkins server
3. jenkins 收到從 bitbucket 來的消息後，開始把程式 pull 下來
4. jenkins pull 成功後，開始執行 test
5. 成功執行完 test 後，執行部署
6. 部署成功後發送通知給 slack

流程圖如下，但第 5 個步驟的部署並不會有實際例子  
這會在後記部分進行說明  
![](/images/jenkins/flow.png)

## 準備

以下四點要事前準備
1. jenkins 可以使用 docker 安裝的，這樣就不會污染到本機環境了  
2. 專案是需要用到 npm，所以必須進到 jenkins 裡面安裝 node.js  
3. 專案則是使用 bibucket，所以需要自己準備好 bitbucket repository  
4. 此篇是使用『Slack App』去做發布訊息，所以需要一個 Slack App 的 Oath Token 去做認證  
可以參考筆者之前的[文章](/2017/10/14/Slack-Bot/)去建立 Slack App

### jenkins 安裝

透過此指令 `docker run -it -p 8080:8080 -u root jenkins/jenkins:lts`  
安裝 jenkins 最新版，並以 root 的角色登到 container 裡面  
接下來用 root 的使用者安裝 node.js  
```sh=
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs
```

接下來用瀏覽器開啟 http://localhost:8080 去把 jenkins 給初始化  
進到頁面首先會要求你輸入初始密碼  
使用以下指令把密碼取得，並複製上去即可完成  
`cat /var/jenkins_home/secrets/initialAdminPassword`  
後面就是新增一個 admin 帳號和密碼就不截圖說明了  

### bitbucket 專案

準備一個 node.js 專案，透過 `npm init` 去初始化  
然後在 package.json 的 scripts 裡面添加一行 test 指令  
然後把此專案的 bitbucet 連結準備好  
```javascript
"scripts": {
    "test": "echo 'Start CI/CD!'"
}
```

### 取得 Slack App Oath Access Token

請到 https://api.slack.com/apps 點選要使用的 Slack App 去取得 Oath Access Token
![](/images/jenkins/slack-01.png)

這邊需要此權限『chat:write:bot』
![](/images/jenkins/slack-02.png)

## jenkins & bitbucket 串接  

### jenkins 設定

首先進到 jenkins 的管理頁面，這裡以 http://localhost:8080 為主  
首先為了要 bibucket 任何 push, merge 動作能夠在 jenkins 這邊去識別以下的條件  
『當 jenkins 設定當 bibucket [push/merge/...等等] master 會建置，其餘 branch 不會建置』  
就先必須安裝 bitbucket plugins 去做這件事情，不安裝的話 jenkins 無法識別 bitbucket 的通知  
點選左邊『管理 jenkins』，然後點選『管理外掛程式』，把 bitbucket 先安裝好  
除此之外要做到 slack 通知，也把『Slack Notification』此外掛裝好  
![](/images/jenkins/jenkins-plugins-01.png)
![](/images/jenkins/jenkins-plugins-02.png)


回到 jenkins 首頁按下左上角『新增作業』，選擇 free style  
![](/images/jenkins/jenkins-01.png)

往下滑到原始碼管理，選擇 git  
把剛剛準備好的 bitbucket 連結貼上去  
然後應該會出現下列的錯誤訊息，代表需要帳號密碼才可以存取此 repository  
![](/images/jenkins/jenkins-02.png)

點選圖中的 add 去新增使用者帳號密碼  
![](/images/jenkins/jenkins-03.png)

輸入成功後，會跳回去剛剛的畫面，輸入正確的話就不會出現錯誤訊息  
> 下圖的 branch 設定意義是指  
> 當 bitbucket master 有變更的時候，會觸發此建置  
> 但要注意，此設定要搭配 bitbucket plugin 合用才會有效喔  

![](/images/jenkins/jenkins-04.png)

接下來往下滾動會看到『建置觸發程序』，勾選圖中那兩樣，並保留排程空白  
![](/images/jenkins/jenkins-05.png)

再往下把看到建置，請點選『新增建置步驟』>『新增 shell』  
![](/images/jenkins/jenkins-06.png)  

輸入以下 shell  
```sh=
cd $WORKSPACE # 移動到專案的目錄
npm run test # 執行 test 指令
```
![](/images/jenkins/jenkins-07.png)

接下來為了要把建置的結果通知給相關人員  
請點選『新增建置後動作』>『Slack Notification』
![](/images/jenkins/jenkins-08.png)

這邊先勾選成功會通知即可  
![](/images/jenkins/jenkins-09.png)

接下來會看到各個要輸入資訊的地方，先把除了 Credential 以外的填完  
![](/images/jenkins/jenkins-10.png)

此 Credential 必須要用到剛剛得到的 Oath Access Token  
這裡點選 add，進去後類型選擇『Secret Text』，並把 Token 填入  
![](/images/jenkins/jenkins-11.png)

> 這邊補充一下  
> 如果不想要每一個專案都設定一次  
> 可以回到 jenkins 首頁，點選裡面的設定  
> 可以設定全域，這樣所有專案就可以吃同一個設定  
> 就不需要讓每一個專案都設定 oath channel 等等的東西了  
> 但基本的設定還是要設置，像是在『建置成功』『建置失敗』的情境下要發送通知  
> 這種如果不設定的話，訊息是不會發送到 slack 的

接下來按下右下角 Test Connection  
成功的話就會在 slack 上面看到 jenkins 的訊息了  
最後按下儲存  

接下來要設定能夠讓 bitbucket 呼叫到我們 jenkins 的 api  
在此之前我們需要先建立 api token  
點選『使用者』>『點選剛建立的 admin』
即可取得 api token  
![](/images/jenkins/jenkins-12.png)

![](/images/jenkins/jenkins-13.png)

『按下 Add new token』，馬賽克那一串就是 api token 了  
![](/images/jenkins/jenkins-14.png)

### Bitbucket 設定

到 bitbucket 的專案設定裡面，點選 webhook  
![](/images/jenkins/bitbucket-01.png)

把此 url 設定進去  
`http://[jenkins 帳號]:[jenkins api token]@[jenkins url]:[jenkins port]/git/notifyCommit?url=[bitbucket branch]`
如果 jenkins 帳號是 `admin`，api token 是 `12345`  
然後 jenkins url 是 ngrok or public ip，這邊以 `1.1.1.1` 為範例  
port 是 `8080`，branch 是 `https://user@bitbucket.org/user/ci-cd-test.git`
全部綜合起來，連接應該要如下  
`http://admin:12345@1.1.1.1:8080/git/notifyCommit?url=https://user@bitbucket.org/user/ci-cd-test.git`
![](/images/jenkins/bitbucket-02.png)
> 如果沒有自己 server 的人  
> 可以用 [Ngrok - Connect to your localhost!](/2017/11/08/ngrok/) 讓 bitbucket 連線到你的 jenkins server

建立完成後，點選『View Request』就可以看有沒有 branch 被推上來  
![](/images/jenkins/bitbucket-03.png)

### 實作結果

接下來到專案內，隨意修改並進行 push，就會看到下面有列出 request 進來  
![](/images/jenkins/bitbucket-04.png)

在 jenkins 上面就會看到有建置開始在運行了  
左下角出現 #6 就是正在建置的號碼  
![](/images/jenkins/jenkins-15.png)

點選進去後，可以看到 commit 的 log  
![](/images/jenkins/jenkins-16.png)

點選『Console Output』，最下面可以看到剛剛專案的 `Start CI/CD` 就出現了
![](/images/jenkins/jenkins-17.png)

Slack 裡面也會出現建置成功的通知  
![](/images/jenkins/jenkins-18.png)


## 後記

這樣就算是打通 CI/CD 粗略流程了  
實際上 CI 還要包含跑測試以及跑程式掃描  
而 CD 還要有部署到伺服器  
以 CD 來說可以利用 `ssh root@1.1.1.1 "echo 1"` 直接執行遠端伺服器的指令  
去連到另一台伺服器去跑已經撰寫好了 deploy shell  
或是有的使用 k8s 去做部署  
又或是你家的 production server 就直接放在 jenkins server 上 XD  
這些東西都是要根據每個公司不同的伺服器架構去決定要如何去撰寫  
這裡就不詳細介紹該如何去實作了  