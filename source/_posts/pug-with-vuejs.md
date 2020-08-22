---
title: 前後端尚未分離前導致的效能問題 (nodejs + pug + vue)
categories: Vue
date: 2020-08-22 10:33:54
tags: [vue, pug, w3HexSchool]
header-img: /images/banner.jpg
catalog: true
---

## 前言

在 vue 剛出來那時候, 還不盛行前後端分離的架構  
在那時某些專案選擇了用 nodejs + pug + vue 混合式的架構  

在 node.js render 的時候, 給予一個 template  
然後在此 template 去寫 vue 的元件來達成這個混合架構  
但這種混合架構在使用 vue 的 props 去賦值時, 可能會出現很嚴重的效能問題  

## 如何重現  

通常在使用 nodejs + pug render 的情況下, template 內容大致如下

```pug=
div.container
    div.content
        p this is message
```

加了 vue 之後大致上會變成這樣  

```pug=
div.container
    content-component(message="")
```

這裡隱藏了一個會影響效能的 Bug  
但我們先來說說, 加上了 pug 的情況下, 是如何運行  
首先, 透過 nodejs + pug 會先去渲染成 html  
這個 html 就是在進入頁面的時候, 伺服器給予的
所以上面的內容會變成如下  

```html=
<div class="container">
    <content-component message="this is message"></content-component>
</div>
```

你的瀏覽器就會接收到以上的內容  
接著 vue 就會開始去 parse content-component  
但是當 message 的內容過大的時候, 就會導致 vue parse html 時間過長  

## 實際案例

這裡用一個例子舉例, 在後端我建構一個這樣的物件  
```javscript=
let obj = {}
for (let i = 0; i < 200000; i++) {
    obj[i] = "qowiejqowiejr"
    obj[i+"www"] = "qowiejqowiejr"
    obj[i+"sss"] = "qowiejqowiejr"
    obj[i+"aaa"] = "qowiejqowiejr"
    obj[i+"ssssqwe"] = "qowiejqowiejr"
    obj[i+"qwrwwww"] = "qowiejqowiejr"
    obj[i+"qwrwsss"] = "qowiejqowiejr"
    obj[i+"qwrwaaa"] = "qowiejqowiejr"
    obj[i+"qwrwssssqwe"] = "qowiejqowiejr"
}
// 並在此 express route 去 render 出 pug
app.get('test', (req, res) => {
    res.render("index", {messge: JSON.stringify(obj)})
})
```

這裡可以看到當這個 props 給太大, 導致 html 的大小達到  89.6 MB  
![](/images/pug-vue/version_01-01.png)

因為這裡太大無法顯示, 這裡用小一點的看一下從 Server 回傳的 HTML 如下  
所以當資料太大放在 props 的時候, 就會導致 html 大小越來越大  
![](/images/pug-vue/version_01-01-a.png)

接著用 chrome 的 performance 去分析效能會看到 Scripting 就高達 14s  
![](/images/pug-vue/version_01-02.png)

接著再往下看是哪些 Scripting 影響到要執行那麼久  
這裡就看到是 vue parse html 需要花上 14s, 才能 parse 完成  
也就是你要等超過 14s, 你才看得到 component 的內容  
![](/images/pug-vue/version_01-03.png)

## 改善方法  

要改善這個效能問題, 可以透過不要在 pug 裡面直接用 props 的方式給予值  
改成在 mounted 或是其他 life cycle 情況下去取得值還會更快  
在 vue template 裡面就會變成這樣  

``` 
<script>
import axios from "axios";
export default {
    data () {
        return {
            message: ""
        }
    },
    mounted() {
        axios.get("/test-get-data").then(response => {
            this.message = response.data
        })
    }
}
</script>
```

在 pug 中就可以把 props 拿掉  
```pug=
div.container
    content-component
```

這樣解析成 html 就變成下面這樣, 就可以讓 HTML 大小變小  
```html=
<div class="container">
    <content-component></content-component>
</div>
```

從這裡可以看到大小縮小, 後來用 mounted 取得資料是 53MB  
等於說我們讓 vue 少去 parse 這 53MB 的字串了  
![](/images/pug-vue/version_02-01.png)

然後 Scripting 的時間直接變成剩下 873 ms  
![](/images/pug-vue/version_02-02.png)

往後繼續看 parse html 只剩 2ms  
![](/images/pug-vue/version_02-03.png)

## 後記
以前 vue 1.0 剛出來的時候, 先暫時套用在某個專案上  
後來資料量大了才發現不能透過這樣 render 會導致 html 太大  
但現在大多都是前後端分離的架構, 所以會比較少遇到這個問題  
剛好最近在舊的專案上面遇到這個 Bug, 順帶紀錄一下  