---
title: How to use mapping template with API Gateway in AWS
categories: AWS
date: 2017-10-24 00:02:20
tags: [API Gateway, aws]
header-img: /images/banner.jpg
catalog: true
---
[Update] 2017-11-08 原本文章的 mapping 方式再依些特別狀況會出錯，在文章最下面加入了最新的 mapping 方式

最近需要在 API Gateway 上面作 request 和 response 的參數調整
這裡紀錄一下一些基本的使用語法
[官方網站](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html#util-template-reference)也有提供使用方式還有一些例子
或是可以直接到 [Apache Velocity Template Language](http://velocity.apache.org/engine/devel/vtl-reference.html)

<!--more-->

### if else

```
{
    #if ($variable == "cool")
        "variable" : "$variable"
    #else if ($variable == "hot")
        "variable" : "$variable"
    #end
}
```

如果參數是 cool 的話，顯示出來是
```javascript=
{
    "variable": "cool"
}
```

### type

以上一個 case 來說，把 variable 改成是 1
```
{
    "variable": "$variable"
}
```

這樣顯示出來會是
```javascript=
{
    "variable": "1"
}
```

但是如果改成這種格式
```
{
    "variable": $variable
}
```
這樣顯示出來會是
```javascript=
{
    "variable": 1
}
```

這邊要注意的是，如果格式是以下這樣，然後參數是 "test"
```
{
    "variable": $variable
}
```
這樣顯示出來會是
```javascript=
{
    // 這會直接讓 API Gateway mapping template 直接爆炸
    "variable": test
}
```

### key

如果把 $variable 設成 "test"，並用以下的 template
```
{
    "$variable": "$variable"
}
```
結果會是
```javascript=
{
    "test": "test"
}
```


### foreach and keySet

資料如下
```javascript=
{
    "data": {
        "book": [{
            "title": "cool",
            "serial": 123
        }, {
            "title": "hot",
            "serial": 321
        }]
    },
    "comment": "Hi"
}
```

我想要把他轉換成以下的格式，該怎麼用 mapping template
```javascript=
{
    "book_library": [{
        "name": "cool",
        "number": 123
    }, {
        "name": "hot",
        "number": 321
    }],
    "message": "Hi"
}
```

mapping template 可以這樣寫
```javascript=
#set($root = $input.path("$"))
{
    // keySet 可以拿到這層所有的 key
    // 這裡可以拿到 data 和 comment ($rootKey)
    #foreach($rootKey in $root.keySet())
        #if($rootKey == "data")
            "book_library": [
                #foreach($elem in $root.get($rootKey))
                {
                    // 這層可以達到 title 和 serial
                    #foreach($i in $elem.keySet())
                        #if($i == "title")
                            "name": "$elem.get($i)"
                        #elseif($i == "serial")
                            // 因為要讓這裡是數字，所以不加上雙引號
                            "number": $elem.get($i)
                        #end
                    #if($foreach.hasNext),#end             
                    #end
                }    
                #if($foreach.hasNext),#end
                #end
            ]
        #elseif ($rootKey == "comment")
            "message": "$root.get($rootKey)"
        #end


    // 這是為了讓
    // {
    //     "test": 123
    // }
    // 最後面的 123 加逗點用的
    // 如果是會後一個，就不會加逗點了
    #if($foreach.hasNext),#end
    #end
}
```

### 更好的寫法

在 aws 官網中，除了拿到 raw payload 之外
還可以利用 `$input.json()` 的寫法拿到格式更完整的資料
因為在原本的方式中，如果拿到的字串包含 `\n`，這會讓 API Gateway 爆炸
雖然可以透過 `$util.escapeJavaScript` 的方式避免
但在每一個地方都加上 `$util.escapeJavaScript` 也是很蠢
所以新的寫法會像是這樣

1. 第一個地方是 `#set($count = $foreach.count - 1)` 這是為了拿到 `index`

2. 第二個地方寫法就比較特別，拿到 `index` 之後，`$input.json($)` 這樣是拿到整個 payload (JSON)
如果 `$rootKey = 'book_library'` 那這樣寫`$input.json("$['$rootKey']")` 等於 `$input.json("$['book_library']")` 的寫法，就可以拿到陣列了。
那如果要拿第一個的話
`$input.json("$['$rootKey'][0]")` 這樣就能拿到, 如果用變數取代的話，可以寫成
`$input.json("$['$rootKey'][$count]")`
拿到陣列後，要拿陣列裡面的物件就可以這樣寫
`$input.json("$['$rootKey'][0]['$i']")` 等同於 `$input.json("$['$rootKey'][0]['title']")`

3. 第三個就是讓剩餘的都直接拿出來就結束了


要特別注意的點是，不用加上 "" 在 `$input.json()` 外面了
因為用 `$input.json()` 拿的已經是完整格式了
`String` 就是 `String`，不用像上面的方式還要加上 "" 去讓他變成字串
`Boolean` `Int` 等等全部都是，也不用擔心 `\n` 這個出現
```javascript=
#set($root = $input.path("$"))
{
    // keySet 可以拿到這層所有的 key
    // 這裡可以拿到 data 和 comment ($rootKey)
    #foreach($rootKey in $root.keySet())
        #if($rootKey == "data")
            "book_library": [
                #foreach($elem in $root.get($rootKey))
                {   
                    // ============= Here =================
                    #set($count = $foreach.count - 1)
                    // ============= Here =================         
                        
                    // 這層可以達到 title 和 serial
                    #foreach($i in $elem.keySet())
                        // ============= Here =================
                        #if($i == "title")
                            "name": $input.json("$['$rootkey'][$count]['$i']")
                        #elseif($i == "serial")
                            "number": $input.json("$['$rootkey'][$count]['$i']")
                        #end
                        // ============= Here =================
                    #if($foreach.hasNext),#end             
                    #end
                }    
                #if($foreach.hasNext),#end
                #end
            ]
        #elseif ($rootKey == "comment")
            // =============== Here ==============
            "message": $input.json("$.$rootkey")
            // =============== Here ==============
        #end


    // 這是為了讓
    // {
    //     "test": 123
    // }
    // 最後面的 123 加逗點用的
    // 如果是會後一個，就不會加逗點了
    #if($foreach.hasNext),#end
    #end
}
```