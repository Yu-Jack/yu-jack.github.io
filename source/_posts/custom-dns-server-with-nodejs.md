---
title: 自建 DNS Server (Node.js)
categories: DevOps
date: 2020-06-09 14:36:34
tags: [w3HexSchool, dns, nodejs]
header-img: /images/banner.jpg
catalog: true
---

## 前言

因工作上需要幫忙協助建立一個 DNS Server 去測試以下一個情境  
當發 request 的時候解析 Domain 成 IP 這一段  
如果 timeout 或是時間太久的話, 相關發 request 的套件會如何處理 exception  

## 安裝教學

在安裝之前, 請先確認是否已經有安裝 Node.js, 有的話可以繼續往下看  

1. `mkdir nodejs-dns-server`  
2. `cd nodejs-dns-server`  
3. `npm install native-dns`  
4. 建立檔案, dns.js  
    ```javascript
    const dns = require('native-dns');
    const server = dns.createServer();

    server.on('request', function (request, response) {
        // console.log(request)
        response.answer.push(dns.A({
            name: request.question[0].name,
            address: '你想要解析後的 IP',
            ttl: 600,
        }));
        setTimeout(() => {
            response.send();
        }, 1000)
    });

    server.on('error', function (err, buff, req, res) {
        console.log(err.stack);
    });

    server.serve(53);
    ```
5. `node dns.js`

這樣就建立出一個 DNS Server  
另外要注意的是, DNS Server 預設是 UDP 53 port 哦！  

## 測試

測試有分成兩種方式, 擇一即可  

1. 更改發 request 套件時用的 dns server
2. 更改網路的 dns 設定

### 更改發 request 套件時用的 dns server

這邊測試用 Node.js 的 Axios 去進行測試  
這裡是透過 interceptors 去攔截 Request 然後透過自建 DNS 去解析出 IP  
相關程式如下

```javascript
const dns = require("native-dns");
const axios = require("axios")
const https = require("https")
const net = require("net");
const URL = require ("url");

function resolveARecord(hostname, dnsServer) {
    return new Promise(function (resolve, reject) {
        var question = dns.Question({
            name: hostname,
            type: "A"
        });
        var request = dns.Request({
            question: question,
            server: { address: dnsServer, port: 53, type: "udp" },
            timeout: 2000
        });
        request.on("timeout", function () {
            reject(new Error("Timeout in making request"));
        });
        request.on("message", function (err, response) {
            // Resolve using the first populated A record
            for (var i in response.answer) {
                if (response.answer[i].address) {
                    resolve(response.answer[i]);
                    break;
                }
            }
        });
        request.on("end", function () {
            reject(new Error("Unable to resolve hostname"));
        });
        request.send();
    });
}

axios.interceptors.request.use(function (config) {
    var url = URL.parse(config.url);

    if (!config.dnsServer || net.isIP(url.hostname)) {
        // Skip
        return config;
    } else {
        return resolveARecord(url.hostname, config.dnsServer).then(function (response) {
            config.headers = config.headers || {};
            config.headers.Host = url.hostname; // put original hostname in Host header

            url.hostname = response.address;
            delete url.host; // clear hostname cache
            config.url = URL.format(url);

            return config;
        });
    }
});

axios.get(`https://hostA.examplewqeeqweqweqwe.org`, { httpsAgent: agent, dnsServer: '127.0.0.1' }).then(({data}) => {
        console.log(data);
}).catch((error) => {
    console.log(error)
})
```

這樣一來, 當對此 domain `hostA.examplewqeeqweqweqwe.org` 發 request 的時候  
就會被導入到你在上面 `dns.js` 程式輸入的任何 IP 了  

### 更改網路的 dns 設定  

此設定要注意, 因為是改 wifi 設定  
所以所有的 domain 都會透過自建的 dns server 去解析  
所以假設你 dns server 給的 ip 是 1.1.1.1  
那麼你用瀏覽器開的 youtube.com 也會被解析成 1.1.1.1  
然後就連到 1.1.1.1 而不會連線到真正 youtube.com 的 IP 了  

設定方式, 這邊只介紹 Mac 的設定方法  

1. 點擊 System Preferences > Network 會到連線設定的地方  
2. 並點選 Advanced (進階), 會看到上面有一排 Wi-Fi TCP/IP DNS 等等的 Tab  
3. 點入 DNS 這個 Tab  
4. 點選 `+` 後輸入 127.0.0.1 後按下 OK 以及套用即可完成  
    ![Wi-Fi DNS Setting](/images/custom-dns/01.png)
5. 回復設定時, 先點選 127.0.0.1 在按下 `-` 就可以, 系統會自己填入預設用的 dns server IP  
