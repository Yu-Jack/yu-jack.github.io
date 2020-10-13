---
title: 從 SSL 到 SSL Pinning 看完你就懂！
categories: Security
date: 2020-03-02 00:02:54
tags: [Security, SSL, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

看不懂跟我說，我想辦法補充 XD  

正文開始 ...
某天有人問我  

某: SSL Pinning (Certificate Pinning) 是什麼東西啊?  
我: SSL Pinning 是為了抵禦中間人攻擊而形成的一種防禦機制  
某: ...... 你這樣說最好是有人聽得懂  
我: 我錯了 ... 給點機會讓我重新解釋解釋  

為了要了解這個的意思  
我們要先來說說 SSL 是什麼  
而 SSL Pinning 又是要 pin 什麼東西  
然後中間人又是哪個小三??

## 什麼是 SSL?

SSL 全名是，Secure Sockets Layer  
但這是屬於舊的標準，新的標準則是 Transport Layer Security (TLS)  

但不管新舊標準，他們的目的都是同一個  
那就是保護使用者資料的安全為目的，但 ... 怎樣算保護呢?  

> 這裡提到安全其實又會切分成三個種類  
> 可用性、機密性、完整性，這個有機會再開個篇章來談談  
> 這邊就先當成是保護資料安全吧！

先來說一般的狀況，沒有 SSL 的時候  
A 跟 B 兩家房子，之間有一個傳輸通道  
是用來傳輸各種訊息或是物資，但！！！這個通道是透明的  
也就是說，其他人可以跟清楚的看到 A 跟 B 到底在秘密地交換什麼東西  
而有了 SSL 後，就是從原本的透明傳輸管道升級成非透明的傳輸管道  
這樣其他人就不容易的去看到 A 跟 B 在運送什麼東西了  

![](/images/ssl/ssl-00.png)

> 這裡就不提到 http 和 https 的概念  
> 但可以簡單說，http 有了 ssl 就升級為 https  
> http 就是透明管道
> https 就是非透明管道  

那麼 SSL 是怎麼運作的，我們首先要知道 公私鑰 的概念  
SSL 其中有一段是透過非對稱式加密的公私鑰達到認證並建立連線通道  
建立安全連線通道後，會利用對稱式加密對這之間所有資料進行加解密  

聽起來很饒口 ... 沒關係為了要了解整個概念  
我們必須先來談談對稱式加密和非對稱式加密  

首先是對稱式加密  
假如有一種加密的演算法是『把字母往後位移 k 個位子，把位移後的結果以及 k 給對方』  
所以當 A 想要告訴 B 一件事情  
A 就透過這種加密方法把 HI 這個詞，往後位移 2 個位子，就變成 JK  
當 B 收到位移數是 2 以及 JK 的時候，B 就可以透過這個位移數 2 把他回推成 HI  
這裡的 2 就是我們的 k 也就是我們的金鑰，A 和 B 都是拿到同樣的數字 2  
這就是對稱式加密的一種概念  

那非對稱式就是 A 和 B 拿到的金鑰是不同個的 (以上述例子，A 拿公鑰，B 拿私鑰)  
而公私鑰，一定是一組一對一配對起來的，如果公鑰是 O 私鑰是 P  
那絕對是 OP 為一組，不會有 WP 這種組合出現或是 OW 這種組合出現  
而如何實現這種演算法，請參考 RSA 相關的文章，這裡就不多做解釋 (不然就跑題了  

所以在 SSL 的概念裡面會有公私鑰，這裡有兩個概念  
第一種：資料透過私鑰加密，再透過公鑰解密 -> 驗證訊息來源是否真的是擁有私鑰的人  
第二種：資料透過公鑰加密，再透過私鑰解密 -> 把資料加密，並可還原資料  

在 SSL 整個通訊協議中，當瀏覽器收到伺服器 A 送來可支援的加密演算法時  
會看到利用第一種方式去驗證伺服器 A 傳送過來的資料是否真的是伺服器 A 而不是 B 的  
接下來會選擇一把對稱式加密金鑰，然後利用第二種方式加密傳給伺服器  
伺服器解密後取得這把對稱式加密金鑰，之後瀏覽器和伺服器之間的通訊就用這把對稱式金鑰加解密  

整個 SSL 建立的步驟可以分為以下三個大項

1. Authentication <span style="color: #4087c6">(藍色部分)</span>: 使用非對稱式加密演算法進行伺服器數位簽章的認證  
2. Key Exchange <span style="color: #1eb6a7">(綠色部分)</span>: 交換一把對稱式加密金鑰  
3. Encrypted Data Transfer <span style="color: #f85d72">(紅色部分)</span>: 瀏覽器和伺服器利用第二步的對稱式加密金鑰，對通訊間的資料進行加解密

可以參考下面的簡略圖，但更詳細的就不是本篇探討的地方  
詳細可以參閱[那些關於SSL/TLS的二三事(九) — SSL (HTTPS)Communication](https://medium.com/@clu1022/%E9%82%A3%E4%BA%9B%E9%97%9C%E6%96%BCssl-tls%E7%9A%84%E4%BA%8C%E4%B8%89%E4%BA%8B-%E4%B9%9D-ssl-communication-31a2a8a888a6)看更多細節  
![](/images/ssl/ssl-02.png)


> 第二個步驟的交換，可以利用伺服器憑證的公鑰加密對稱式金鑰  
> 伺服器收到這個加密後的對稱式金鑰，就可以用私鑰解密，然後取得對稱式金鑰  
> 但如果是使用 Diffie — Hellman 去交換對稱式金鑰的話  
> 就不需要用公鑰加密，私鑰解密了  
> 因為 Diffie — Hellman 可以"安全地"告訴對方密碼而不用擔心密碼被竊聽.

剛剛提到的憑證，就是我們瀏覽器上面會看到鎖頭，點開後那就是憑證  

![](/images/ssl/ssl-01.png)

執行此指令可以看到完整的憑證  
`openssl s_client -connect github.com:443 -servername github.com -showcerts`
> 因為這憑證很長一串，這裡就不截圖顯示了  
> 各位可以自行在電腦上面執行試試看  

那為什麼透過憑證可以取得到公鑰呢? 因為從私鑰中是可以算出 public key 出來的  
產生憑證的流程是，一開始產生出來的公私鑰匙，透過私鑰產出一個憑證申請檔案  
這個憑證申請檔案會包含一些申請者的資訊以及公鑰  
此檔案經過第三方的認證之後，就會成了憑證  
所以透過憑證可以把公鑰取得回來  
> 私鑰產生出來之後，是要被嚴格保管的，絕對不能洩漏出去，所以才會稱為私鑰  
> 但公鑰就沒關係了，所以才會叫做公開金鑰 (公鑰)  

## 什麼是 SSL Pinning ?

SSL Pinning 也可以稱為 Certificate Pinning  
而前面有提到一個概念，公私鑰是一對一配對的  
所以同一組公私鑰出來的憑證，這個憑證裡面的公鑰絕對是不會變的  
而 SSL Pinning 就是要把 SSL 固定起來  
這個固定就是利用公鑰的特性達到的  

假設今天我有一個 App 是專門瀏覽 github.com 用的  
github.com 憑證內的公鑰是 O 的話  
而我 App 裡面的程式，已經有預先寫好 O 這個公鑰  
所以當我瀏覽 github.com 的時候，取得憑證內的公鑰 O  
拿這個公鑰 O 去跟程式裡面寫好的 O 比對是一樣的，就繼續連線  
不一樣的話就拒絕連線，因為不一樣的話，一定是有什麼狀況發生，不要連線比較好  
這就是 SSL Pinning，確保連線的網址憑證是安全的  

而發生不一樣的狀況，通常是所謂的中間人攻擊  

## 中間人攻擊

在正常連線的狀況下，都是屬於下圖的狀況 (這邊以最單純只有 server 的架構來表示  
![](/images/ssl/ssl-03.png)

中間人攻擊，就是中間卡了一個人幫你跟伺服器進行資料交換  
這樣就代表所有東西都會被這個中間人看光光  
![](/images/ssl/ssl-04.png)

接下來可能會有一個疑惑，我都用 SSL 了，他怎麼會看到我傳送的封包?  
但其實當中間卡一個人的時候，你並不會知道中間真的有卡了一人在幫你交換資料  
以你連線到 github.com 的時候，如果你不特別去點憑證來看  
你其實並不會知道到底是怎麼一回事，讓我們看看下面 gif 的例子  

![](/images/ssl/ssl-05.gif)

左邊是我用無痕模擬被中間人攻擊的狀況，右邊則是我一般上網的狀況  
不點憑證之前，你其實很難分辨出來到底哪一種有問題  
這邊附上各個截圖，上圖為 gif 左邊，下圖為 gif 右邊
![](/images/ssl/ssl-07.png)
![](/images/ssl/ssl-06.png)

其實中間人的角色，其實就是充當伺服器再跟你進行 SSL 通道的建立  
所以對瀏覽器來說，這個中間人就是真正的伺服器，只是瀏覽器並不知情而已  

但其實現實上瀏覽器其實不會那麼笨  
因為瀏覽器本身都會有一些本來就可以信任的 Root 憑證
所以當瀏覽器遇到這種 Root 憑證怪怪的，基本上都是會拒絕連線的  

這裡會可以連線是因為我先讓我的瀏覽器無條件相信這個中間人的 Root 憑證  
Root 憑證和一般我們所講的憑證有什麼不同，後面會介紹到  

當不信任的狀況，瀏覽器就會出現以下的警告視窗  
裡面的英文訊息其實就很完整解釋，這個伺服器送回了異常的憑證，所以 Chrome 大大幫你擋掉  
不過如果你像我一樣設定好讓 Chrome 大大無條件相信的話，就不會出現這個警告視窗了  
![](/images/ssl/ssl-08.png)


某: 我們已經知道 SSL 是什麼，也知道中間人攻擊是什麼了  
某: 但我們到底要如何做到 SSL Pinning 去預防這件事情呢  
某: 是只要取得 github.com 的憑證公鑰去驗證就好了嗎  

我: 摁 ... 且慢, 其實憑證還有所謂的憑證鍊, 就像上圖點開憑證會看到很像鏈子一整串的憑證  
我: 可以回去看上面那兩個 github.com 的圖裡面的憑證的顯示方法  
某: 等等！怎麼還有啊！也解釋太久了吧  
我: 幫我充值一下時間，快要結束了  

## 憑證鍊

從圖中可以看到憑證從上到下總計有三個  
![](/images/ssl/ssl-06.png)

從上到下分別為  
1. Root Certificate: DigitCert High Assurance EV ROOT CA
2. Intermediate Certificate: DigitCert SHA2 Extended Validation Server CA
3. Leaf Certificate: github.com 

Leaf 是被 Intermediate 簽署認證  
Intermediate 是被 Root 簽署認證  

而 Root 憑證本身就會被安裝在手機以及瀏覽器以內  
但談到我剛剛有一個 github.com 被中間人攻擊的例子  
是我自行把中間人的 Root 憑證給安裝到電腦中，才會被攻擊  
實際上，其實有可能透過社交工程的方法，引誘使用者安裝這些不安全的 Root 憑證  

> 以 Android 來說，可能會在 Settings > Security > Trusted Credentials 看到很多根憑證  
> 以 Mac 電腦來說，可以在 terminal 使用 open file:///System/Library/Security/Certificates.bundle/Contents/Resources/TrustStore.html  
> 打開後就會看到裝在這台電腦上面所有信任的 Root 憑證  

那問題就來了，我要如果要做 SSL Pinning 要針對誰做 SSL Pinning 呢?  
答案其實是不用只選一個，也不一定要全部都選  
但基本上 Pinning Leaf 可以 100% 確認這一定是你的伺服器  
但如果當你的私鑰被洩漏出去，那個中間人也有辦法做出跟你一樣的公鑰出來的  
所以也會有人選擇不只 pinning Leaf，直接全部 pinning 也是一種方法  

除了 Pinning 公鑰之外，也會有人選擇 Pinning 整個憑證的方式  
以 github.com 憑證來說有以下兩種顯示方式  
1. 公鑰: o5oa5F4LbZEfeZ0kXDgmaU2K3sIPYtbQpT3EQLJZquM= (sha256 + base64 後)
2. 憑證檔:
    ```
    -----BEGIN CERTIFICATE-----
    MIIHQjCCBiqgAwIBAgIQCgYwQn9bvO1pVzllk7ZFHzANBgkqhkiG9w0BAQsFADB1
    MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
    d3cuZGlnaWNlcnQuY29tMTQwMgYDVQQDEytEaWdpQ2VydCBTSEEyIEV4dGVuZGVk
    IFZhbGlkYXRpb24gU2VydmVyIENBMB4XDTE4MDUwODAwMDAwMFoXDTIwMDYwMzEy
    MDAwMFowgccxHTAbBgNVBA8MFFByaXZhdGUgT3JnYW5pemF0aW9uMRMwEQYLKwYB
    BAGCNzwCAQMTAlVTMRkwFwYLKwYBBAGCNzwCAQITCERlbGF3YXJlMRAwDgYDVQQF
    Ewc1MTU3NTUwMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQG
    A1UEBxMNU2FuIEZyYW5jaXNjbzEVMBMGA1UEChMMR2l0SHViLCBJbmMuMRMwEQYD
    VQQDEwpnaXRodWIuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
    xjyq8jyXDDrBTyitcnB90865tWBzpHSbindG/XqYQkzFMBlXmqkzC+FdTRBYyneZ
    w5Pz+XWQvL+74JW6LsWNc2EF0xCEqLOJuC9zjPAqbr7uroNLghGxYf13YdqbG5oj
    /4x+ogEG3dF/U5YIwVr658DKyESMV6eoYV9mDVfTuJastkqcwero+5ZAKfYVMLUE
    sMwFtoTDJFmVf6JlkOWwsxp1WcQ/MRQK1cyqOoUFUgYylgdh3yeCDPeF22Ax8AlQ
    xbcaI+GwfQL1FB7Jy+h+KjME9lE/UpgV6Qt2R1xNSmvFCBWu+NFX6epwFP/JRbkM
    fLz0beYFUvmMgLtwVpEPSwIDAQABo4IDeTCCA3UwHwYDVR0jBBgwFoAUPdNQpdag
    re7zSmAKZdMh1Pj41g8wHQYDVR0OBBYEFMnCU2FmnV+rJfQmzQ84mqhJ6kipMCUG
    A1UdEQQeMByCCmdpdGh1Yi5jb22CDnd3dy5naXRodWIuY29tMA4GA1UdDwEB/wQE
    AwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwdQYDVR0fBG4wbDA0
    oDKgMIYuaHR0cDovL2NybDMuZGlnaWNlcnQuY29tL3NoYTItZXYtc2VydmVyLWcy
    LmNybDA0oDKgMIYuaHR0cDovL2NybDQuZGlnaWNlcnQuY29tL3NoYTItZXYtc2Vy
    dmVyLWcyLmNybDBLBgNVHSAERDBCMDcGCWCGSAGG/WwCATAqMCgGCCsGAQUFBwIB
    FhxodHRwczovL3d3dy5kaWdpY2VydC5jb20vQ1BTMAcGBWeBDAEBMIGIBggrBgEF
    BQcBAQR8MHowJAYIKwYBBQUHMAGGGGh0dHA6Ly9vY3NwLmRpZ2ljZXJ0LmNvbTBS
    BggrBgEFBQcwAoZGaHR0cDovL2NhY2VydHMuZGlnaWNlcnQuY29tL0RpZ2lDZXJ0
    U0hBMkV4dGVuZGVkVmFsaWRhdGlvblNlcnZlckNBLmNydDAMBgNVHRMBAf8EAjAA
    MIIBfgYKKwYBBAHWeQIEAgSCAW4EggFqAWgAdgCkuQmQtBhYFIe7E6LMZ3AKPDWY
    BPkb37jjd80OyA3cEAAAAWNBYm0KAAAEAwBHMEUCIQDRZp38cTWsWH2GdBpe/uPT
    Wnsu/m4BEC2+dIcvSykZYgIgCP5gGv6yzaazxBK2NwGdmmyuEFNSg2pARbMJlUFg
    U5UAdgBWFAaaL9fC7NP14b1Esj7HRna5vJkRXMDvlJhV1onQ3QAAAWNBYm0tAAAE
    AwBHMEUCIQCi7omUvYLm0b2LobtEeRAYnlIo7n6JxbYdrtYdmPUWJQIgVgw1AZ51
    vK9ENinBg22FPxb82TvNDO05T17hxXRC2IYAdgC72d+8H4pxtZOUI5eqkntHOFeV
    CqtS6BqQlmQ2jh7RhQAAAWNBYm3fAAAEAwBHMEUCIQChzdTKUU2N+XcqcK0OJYrN
    8EYynloVxho4yPk6Dq3EPgIgdNH5u8rC3UcslQV4B9o0a0w204omDREGKTVuEpxG
    eOQwDQYJKoZIhvcNAQELBQADggEBAHAPWpanWOW/ip2oJ5grAH8mqQfaunuCVE+v
    ac+88lkDK/LVdFgl2B6kIHZiYClzKtfczG93hWvKbST4NRNHP9LiaQqdNC17e5vN
    HnXVUGw+yxyjMLGqkgepOnZ2Rb14kcTOGp4i5AuJuuaMwXmCo7jUwPwfLe1NUlVB
    Kqg6LK0Hcq4K0sZnxE8HFxiZ92WpV2AVWjRMEc/2z2shNoDvxvFUYyY1Oe67xINk
    myQKc+ygSBZzyLnXSFVWmHr3u5dcaaQGGAR42v6Ydr4iL38Hd4dOiBma+FXsXBIq
    WUjbST4VXmdaol7uzFMojA4zkxQDZAvF5XgJlAFadfySna/teik=
    -----END CERTIFICATE-----
    ```

如果上面兩種擇一的話，選擇公鑰是會比較適合的  
因為同一把私鑰簽署出來的憑證的公鑰一定都會一樣，但如果是憑證內容就都會不一樣  
可以使用下面的指令試試看出來的結果  
```sh=
// 產出私鑰
openssl genrsa -out key.pem 2048

// 用同一把私鑰，產出兩組不同的憑證
openssl req -x509 -new -key key.pem -sha256 -nodes -keyout key.pem -out cert1.pem -days 30
openssl req -x509 -new -key key.pem -sha256 -nodes -keyout key.pem -out cert2.pem -days 30

// 顯示公鑰是一樣
openssl x509 -pubkey -noout -in cert1.pem
openssl x509 -pubkey -noout -in cert2.pem

// 顯示憑證內容是不一樣
openssl x509 -inform pem -in cert2.pem
openssl x509 -inform pem -in cert1.pem
```

這邊附上一個可以取得憑證公鑰的方法，把下面程式貼到 getPKfromDomain.sh 底下  
`sh getPKfromDomain.sh github.com`，就會出現憑證鏈全部的公鑰 (都是 sha256 + base64 後  
```
#!/bin/bash
certs=`openssl s_client -connect $1:443 -servername $1 -showcerts </dev/null 2>/dev/null | sed -n '/Certificate chain/,/Server certificate/p'`
rest=$certs
while [[ "$rest" =~ '-----BEGIN CERTIFICATE-----' ]]
do
    cert="${rest%%-----END CERTIFICATE-----*}-----END CERTIFICATE-----"
    rest=${rest#*-----END CERTIFICATE-----}
    echo `echo "$cert" | grep 's:' | sed 's/.*s:\(.*\)/\1/'`
    echo "$cert" | openssl x509 -pubkey -noout | 
        openssl rsa -pubin -outform der 2>/dev/null | 
        openssl dgst -sha256 -binary | openssl enc -base64
done
```

以 github.com 來說，結果如下
```
$ sh getPKfromDomain.sh github.com
/businessCategory=Private Organization/jurisdictionCountryName=US/jurisdictionStateOrProvinceName=Delaware/serialNumber=5157550/C=US/ST=California/L=San Francisco/O=GitHub, Inc./CN=github.com
o5oa5F4LbZEfeZ0kXDgmaU2K3sIPYtbQpT3EQLJZquM=

/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert SHA2 Extended Validation Server CA
RRM1dGqnDFsCJXBTHky16vi1obOlCgFFn/yOhI/y+ho=
```

那如果當我的手機被中間人攻擊的話，拿到的就是下面這結果  
```
/C=PortSwigger/O=PortSwigger/OU=PortSwigger CA/CN=github.com
Dl+WeZh7lkGAd7otN+2fZEKoYTap20PkS4xpiUTi61Q=

/C=PortSwigger/ST=PortSwigger/L=PortSwigger/O=PortSwigger/OU=PortSwigger CA/CN=PortSwigger CA
Dl+WeZh7lkGAd7otN+2fZEKoYTap20PkS4xpiUTi61Q=
```

## 後記

不過還是要注意的是，萬一私鑰被洩露  
然後 App 的 SSL Pinning 是寫死在程式裡面，這樣 App 就 100% 一定要升級版本，否則會出問題  
但如果你說，專門有一台憑證 API 去跟他要公鑰，其實這也會有問題  
因為攻擊者還是有辦法去偽造回傳的結果的 XD  

另外如果對模擬中間人攻擊有興趣的，可以參考 burpsuit 的使用方法去學習  
屆時再使用 openssl s_client 的時候，記得最後面加上  -proxy 127.0.0.1:8080 連到 proxy 去模擬  

## References

1. [那些關於SSL/TLS的二三事(九) — SSL (HTTPS)Communication](https://medium.com/@clu1022/%E9%82%A3%E4%BA%9B%E9%97%9C%E6%96%BCssl-tls%E7%9A%84%E4%BA%8C%E4%B8%89%E4%BA%8B-%E4%B9%9D-ssl-communication-31a2a8a888a6)
    這裡有一系列對 SSL/TLS 的概念講解，推薦大家去閱讀看看
2. [那些關於SSL/TLS的二三事(十二) — Chain of Trust](https://medium.com/@clu1022/%E9%82%A3%E4%BA%9B%E9%97%9C%E6%96%BCssl-tls%E7%9A%84%E4%BA%8C%E4%B8%89%E4%BA%8B-%E5%8D%81%E4%BA%8C-chain-of-trust-f00da1f2cc15)
3. [Android Security: SSL Pinning](https://medium.com/@appmattus/android-security-ssl-pinning-1db8acb6621e)