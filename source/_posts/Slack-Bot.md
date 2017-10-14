---
title: Slack Bot
categories: Bot
date: 2017-10-14 13:54:17
tags: [Slack, Bot, Chat Bot]
---

在開始玩弄 Slack Bot 之前，必須要先去[申請頁面](https://api.slack.com/apps)建立一個 APP

![](https://i.imgur.com/mKD5GhV.png)

申請完之後，可以看到 Features 那邊有很多不同的功能
這次主要會針對 __Slash Command__、__Incoming Webhooks__ 以及 __Interactive Components__ 做練習

<!--more-->
![](https://i.imgur.com/xXeTr5w.png)

在開始正式介紹之前，我們可以思考一個情境
身為工程師，就是會想要降低人工干涉的事情，大量自動化
那今天，我想要自動部署我的 server 的話，可以怎麼做呢?

這裡可以透過 Slash Command + Incoming Webhooks 做到，步驟如下
1. 在 Slack 上面打上 /deploy ticket master (用 Slash Command 通知 server)
2. Server 就會接收到需要 deploy tickey server，然後切換到 master branch 上面
3. pull 最新版本之後，完成此次更新
4. 通知公司同仁，更新已結束 (用 Incoming Webhooks 通知)

這流程就會是我們所想要的，當然中間還可以透過 jenkins 去部署其他台伺服器
用 slack 部署 server，超方便 der (但感覺拿來訂便當更好用 XD

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

到這裡不禁會想到一個問題，我能不能不把 branch 記起來
我直接讓 server 告訴我，我在選一個我想要的去 deploy 呢?

這時候，Interactive Components 就派上用場了
這個功能可以接收使用者選擇了什麼選項，然後進一步去分析
接下來就要介紹 Interactive Components 

## Interactive Components

### 介紹

這是一個互動式的功能，在 Slack 上面可能會跳出

1. Message Button : 例如是否同意這個意見?
2. Menus          : 例如訂 A 便當 or B 便當?
3. Dialogs        : 例如通知?

當使用者點選了某一個按鈕或是選擇了其中一個選項
就會 post 到 server 上，跟 server 說使用者做了什麼選擇
學會 Interactive Componet 之後，我們自動化流程就可以改成

1. 在 Slack 上打 /show ticket (用 Slash Command 通知 server)
2. Server 回傳 ticket server 所有的 branch (用 Incoming Webhooks 通知)
3. 使用者點選其中一個 branch 進行 deploy (用 Interactive Components 接收使用者點選哪一個 branch)
4. Server 就會接收到需要 deploy tickey server，然後切換到 master branch 上面
5. pull 最新版本之後，完成此次更新
6. 通知公司同仁，更新已結束 (用 Incoming Webhooks 通知)

### 啟用

![](https://i.imgur.com/OUfUkGZ.png)


### 使用

在使用 Interactive Componets 之前，要先學會如何製作選項或是按鈕給使用者點選
Slack 官方有提供地方可以客製化不同的按鈕或是表單的地方，[點這進去](https://api.slack.com/docs/messages/builder)
我客製化了這個訊息

```javascript=
{
    "text": "Would you like to play a game?",
    "attachments": [{
        "text": "Choose a game to play",
        "fallback": "You are unable to choose a game",
        "callback_id": "wopr_game",
        "attachment_type": "default",
        "actions": [{
            "name": "game",
            "text": "Chess",
            "type": "button",
            "value": "chess"
        }]
    }]
}
```

拿到訊息之後，利用 Incoming Webhooks 送出到使用者端給使用者點選

![](https://i.imgur.com/8DtwtPG.png)


點選之後伺服器會發 POST 到 https://your.website.com/interactive
伺服器就會收到以下資訊

```javascript=
// Before JSON.Parse
{
    payload: '{"actions":[{"name":"game","type":"button","value":"chess"}],"callback_id":"wopr_game","team":{"id":"XXXXXXXXX","domain":"XXXXXX"},"channel":{"id":"XXXXXXXXX","name":"general"},"user":{"id":"XXXXXXXXX","name":"yujack"},"action_ts":"1507970582.644321","message_ts":"1507970575.000002","attachment_id":"1","token":"XXXXXXXXXXXXXXXXXXXXXXX","is_app_unfurl":false,"type":"interactive_message","original_message":{"text":"Would you like to play a game?","bot_id":"XXXXXXXXX","attachments":[{"callback_id":"wopr_game","fallback":"You are unable to choose a game","text":"Choose a game to play","id":1,"actions":[{"id":"1","name":"game","text":"Chess","type":"button","value":"chess","style":""}]}],"type":"message","subtype":"bot_message","ts":"1507970575.000002"},"response_url":"https:\\/\\/hooks.slack.com\\/actions\\/XXXXXXXXX\\/XXXXXXXXX\\/XXXXXXXXXXXXXXXXXXXXXXXXX","trigger_id":"XXXXXXXXX.XXXXXXXXX.XXXXXXXXXXXXXXXXXX"}'
}

// After JSON.parse
{
    payload: {
        actions: [{
            name: 'game',
            type: 'button',
            value: 'chess'
        }],
        callback_id: 'wopr_game',
        team: {
            id: 'XXXXXXXXX',
            domain: 'XXXXXX'
        },
        channel: {
            id: 'XXXXXXXXX',
            name: 'general'
        },
        user: {
            id: 'XXXXXXXXX',
            name: 'yujack'
        },
        action_ts: '1507970582.644321',
        message_ts: '1507970575.000002',
        attachment_id: '1',
        token: 'XXXXXXXXXXXXXXXXXXXXXXX',
        is_app_unfurl: false,
        type: 'interactive_message',
        original_message: {
            text: 'Would you like to play a game?',
            bot_id: 'XXXXXXXXX',
            attachments: [
                [Object]
            ],
            type: 'message',
            subtype: 'bot_message',
            ts: '1507970575.000002'
        },
        response_url: 'https://hooks.slack.com/actions/XXXXXXXXX/XXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXX',
        trigger_id: 'XXXXXXXXX.XXXXXXXXX.XXXXXXXXXXXXXXXXXX'
    }
}
```

按鈕會消失，然後顯示你在 server 上面回傳的完成資訊
收到資訊之後，就可以知道使用者點選了什麼按鈕或是選擇了什麼選項
根據這些選項伺服器在做一些處理就可以完成了

![](https://i.imgur.com/JaE9My4.png)

伺服器上面的程式會長這樣 (這邊單純印出來而已，沒有做後續處理

```javascript=
app.post('/interactive', (req, res, next) => {
    console.log(req.body);
    return res.json({
        text: 'Command is successful'
    })
})
```

## 結論

我用了一個情境讓大家比較好思考如何把這三個功能串起來
雖然我還是覺得用在訂便當上面很方便就是了 (?

不過有些細部關於真正如何部署或是 SSL 的部分這裡就不會說明了
那個會需要花到一兩篇文章的篇幅去介紹

如果有任何問題，請歡迎一起來討論 ~