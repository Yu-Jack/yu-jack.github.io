---
title: Hacker 101 CTF Write Up Part 5 - Cody's First Blog
categories: Security
date: 2019-09-14 22:28:20
tags: [CTF, security]
header-img: /images/banner.jpg
catalog: true
---

# Cody's First Blog

這題總共有 3 個 flag
<!-- more -->

## 0x00

一開始畫面長這樣  
![](/images/ctf/part5-blog-1-01.png)

裡面有提到好像是用 php 建立的  
試著提交看看 `<?php echo phpinfo(); ?>`  
就得到第一個 FLAG 了，但好像沒有像想像中一樣可以直接 phpinfo  
![](/images/ctf/part5-blog-1-02.png)
![](/images/ctf/part5-blog-1-03.png)

## 0x01

接下來看一下 source code 發現一個特別的地方  
1. 被註解掉的 admin path 
![](/images/ctf/part5-blog-2-01.png)

Path: http://34.74.105.127/8a10550a14/?page=admin.auth.inc  
發現看到可以登入的地方  
![](/images/ctf/part5-blog-2-02.png)

嘗試輸入 username 看會不會有列舉的漏洞 
以及輸入一些弱密碼嘗試登入  
全部都不行，暫時就先擱置不看  
![](/images/ctf/part5-blog-2-03.png)

這邊就開始有點卡住了 ... 
回去首頁看看有什麼特別的東西  
有一句話有提到有用到 `include` 這個 function  
而剛剛的參數中 `?page=admin.auth.inc` 是登入用的 php  
接下來這邊試著改成 `?page=admin.inc` 發現就 bypass 登入的機制到 admin 頁面了  
然後就發現 FLAG 以及可以 approve 剛剛 submit 的 comment  
![](/images/ctf/part5-blog-2-04.png)

## 0x02
按下 approve，是一個 GET Url  
嘗試對 approve 做 SQL Injection 檢測發現沒有問題  
![](/images/ctf/part5-blog-3-01.png)

接下來回到首頁，檢視原始碼發現一個特別的東西  
一開始輸入的參數被 approve 後顯示在這裡  
有點特別，但因為不能執行所以沒什麼用就先擱著不動  
![](/images/ctf/part5-blog-3-02.png)

接下來嘗試對 page 參數亂打  
![](/images/ctf/part5-blog-3-03.png)

看來的確是用 include 去引入別的檔案  
而且還會再參數後面再加入 .php 的副檔名  

這邊嘗試用 php://filter 看能不能讀取原始碼  
結果發現不能 QQ
![](/images/ctf/part5-blog-3-04.png)

看到 include 後回想起首頁提到的  
這個 server 不能對外連線，也只有作者可以上傳檔案  
以及他都是用 include 去引用檔案  

這裡聯想到一件事情  
include 是不是也能用 http:// 去把檔案引入並執行呢?  
於是這邊嘗試引用 `http://34.74.105.127/8a10550a14/?page=http://localhost/admin.inc`  
發現可以引用成功，但還是沒有提供什麼資訊  
![](/images/ctf/part5-blog-3-05.png)

但因為用 include 配合 `http://` 會有一個特色  
假如 test2.php 內容為
```php=
<?php $body = "<?php echo phpinfo(); ?>" ?>
<p><?php echo $body ?></p>
```

test3.php 內容為
```php=
<?php include("test2.php") ?>
```

直接讀取 test2.php 的時候，是沒辦法執行 `phpinfo()`  
只會出現這樣的結果  
![](/images/ctf/part5-blog-3-06.png)

讀取 test3.php 時  
這邊會出現跟直接讀取 test2.php 一樣的結果  
![](/images/ctf/part5-blog-3-08.png)

但如果把 test3.php 改成用 `http://` 協議會怎麼樣呢?  
```php=
<?php include("http://localhost:7888/test2.php") ?>
```
它會把 test2.php 顯示的結果，當成原始碼繼續使用下去  
結果就會變成可以成功執行 phpinfo 了  
![](/images/ctf/part5-blog-3-07.png)

那因為剛剛一開始頁面也有一樣的邏輯出現  
首頁也有顯示 `<?php echo phpinfo(); ?>`  
![](/images/ctf/part5-blog-3-02.png)

那如果說有辦法，讓這個頁面在被 include 一次的話  
就可以成功執行 phpinfo() 了  
所以 payload 會改成以下
`http://34.74.105.127/8a10550a14/?page=http://localhost/index`  
然後就成功可以執行了  
![](/images/ctf/part5-blog-3-09.png)

重新輸入一個參數 `<?php readfile("index.php") ?>` 並且 approve  
回到首頁檢視原始碼發現 FLAG !
![](/images/ctf/part5-blog-3-10.png)