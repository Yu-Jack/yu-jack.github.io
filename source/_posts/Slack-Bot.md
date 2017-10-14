---
title: Slack Bot
categories: Bot
date: 2017-10-14 13:54:17
tags: [Slack, Bot, Chat Bot]
---



在開始玩弄 Slack Bot 之前，必須要先去[申請頁面](https://api.slack.com/apps)建立一個 APP

![](https://i.imgur.com/mKD5GhV.png)


申請完之後，可以看到 Features 那邊有很多不同的功能
這次主要會針對 Slash Command、Incoming Webhooks 以及 Interactive Components 做練習

![](https://i.imgur.com/xXeTr5w.png)

<!--more-->

## Slash Command

### 介紹

Slash Command 就是在 Slack 的聊天室下指令，例如
```
/deploy server
```
就會觸發到遠端伺服器，伺服器解析 command 後，再去近一步做一些行為

### 建立新指令

下圖就是設定 Slash Command 的地方
我們設定了 command 為 /test，然後會用 __POST__ 觸發到遠端的 https://your.website.com/test

![](https://i.imgur.com/zrWlBqF.png)

比較重要的地方是，Request URL 一定要是 HTTPS，如果不是 HTTPS 一律拒絕，在 Slack 官方文件上面有以下這段說明

> NOTE: If your Slack app is set to be distributable or is part of the Slack app directory, the URL you provide must be use HTTPS with a valid, verifiable SSL certificate. Self-signed certificates cannot be used. See below for more information.

按下 Save 之後，回到頁面會看到，就代表建立完成了

![](https://i.imgur.com/CHfShmx.png)

### 安裝進到你的 team 

按下 Install App to Workspace，就會到授權頁面，然後點下 Authorize 即可安裝完成

![](https://i.imgur.com/aXWYu8r.png)

安裝後在 channel 會出現訊息，通知說已經把 App 加入進來了

![](https://i.imgur.com/VQ0s5oF.png)



這時候在聊天室裡面打下 /test 會出現我剛剛建立的 command 和 Description
不過輸入之後，並不會有任何反應，原因是因為我們還沒有設置好伺服器端的設定

![](https://i.imgur.com/QLYSIqc.png)


### 開始寫程式去接受 slash command

這邊用 nodejs 示範建立一個簡單的伺服器去接受 slash command

SSL 的建立容許我這邊就不做示範了 XD (有點麻煩

```javascript=
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.post('/test', (req, res, next) => {
    console.log(req.body);
    console.log(`User    :  ${req.body.user_name}`);
    console.log(`Text    :  ${req.body.text}`);
    console.log(`Command :  ${req.body.command}`);
                                       
    return res.json({
        text: 'Command is successful'
    })
})
app.listen(8080)
```


在輸入視窗輸入以下指令後

```
/test Hi I'm from slack
```

伺服器端會得到

![](https://i.imgur.com/JoUUwJa.png)

完整的 JSON 格式如下
```javascript=
// 敏感資訊我都以 X 先馬掉了
{
    token: 'XXXXXXXXXXXXXXXXXXXXXXX',
    team_id: 'XXXXXXXXX',
    team_domain: 'XXXXXX',
    channel_id: 'XXXXXXXXX',
    channel_name: 'announcement',
    user_id: 'XXXXXXXXX',
    user_name: 'yujack',
    command: '/test',
    text: 'Hi I\'m from slack',
    response_url: 'XXXXXXXXXXXXXX',
    trigger_id: 'XXXXXXXXXXXXXX' 
}
```

而在輸入窗那邊會看到

![](https://i.imgur.com/DbDiMPt.png)

代表指令有成功到伺服器上面了，然後回傳一個 "Command is successful" 
指令完成後，一定會想問一個問題

『我想要通知其他人，我觸發了這個指令，我不想要只有我看到，那我該怎麼做？』

這時候就是下一個功能 Incoming Webhooks


## Incoming Webhooks

### 介紹

Incoming Webhook，可以直接讓你用 curl 的方式去發訊息到某一個 chaneel 裡面


### 啟用

啟用 Incoming Webhooks 功能

![](https://i.imgur.com/dQjIn5A.png)

啟用之後，會在下面看到一個範例，還有新增 Webhook 的地方

![](https://i.imgur.com/qr9riue.png)

點選 "Add New Webhook to Workspace"，會到授權頁面
這裡會出現，你想要把訊息可以傳送到哪一個地方
那這裡我就選擇 general 作為範例

![](https://i.imgur.com/BfQRZa0.png)

### 使用
在 terminal 貼上以下指令

```shell=
curl -X POST -H 'Content-type: application/json' --data '{"text":"Hello, World!"}' https://hooks.slack.com/services/XXXXXXXX
```

在你設定要傳送的那個 channel 就會出現訊息了

![](https://i.imgur.com/zfH08LK.png)

那有了這個 Webhooks 之後，剛剛的 nodejs server 就可以稍微做更改
這樣的話就可以告訴那一個 channel 的人說，你執行了什麼樣的指令 ~

```javascript=
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/test', (req, res, next) => {
    console.log(req.body);
    console.log(`User    :  ${req.body.user_name}`);
    console.log(`Text    :  ${req.body.text}`);
    console.log(`Command :  ${req.body.command}`);
                                       
    const command = `curl -X POST ` +
        `-H 'Content-type: application/json' ` +
        `--data '${JSON.stringify(req.body.slack_message)}' ` +
        `https://hooks.slack.com/services/XXXXXXXXX`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        return res.json({
            text: 'Command is successful'
        })
    })
})

app.listen(8080)
```
