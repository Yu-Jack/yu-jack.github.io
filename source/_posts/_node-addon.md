---
title: 如何建立 Node.js C++ Addons
categories: NodeJs
date: 2019-05-25 21:48:26
tags: [nodejs, addon, C++]
header-img: /images/banner.jpg
catalog: true
---

這裡簡單的筆記如何去建立一個 Node.js 的 C++ Addon  
範圍包含如何實作以及使用 Addon 後效能提升

## 建立 Node.js Addon
(此處 node 版本為 v10)
1. `npm install node-gyp -g`
此為把 c++ 檔案編譯成給 node 使用的套件

2. 建立檔案 `binding.gyp`
`sources` 為指定哪幾個 c++ 檔案
`target_name` 為編譯完成後的名稱，此為 cal.node
如果改為 hello，就會變成 hello.node
屆時引用的時候就要引用 hello.node
```javascript=
{
    "targets": [{
        "target_name": "cal",
        "sources": ["cal.cc"]
    }]
}
```

3. 建立 `cal.cc`
```cpp
// cal.cc
#include <node.h>

namespace demo {
    using v8::FunctionCallbackInfo;
    using v8::Isolate;
    using v8::Local;
    using v8::Object;
    using v8::Value;

    void Method(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        int j = 0;
        for (int i = 1; i < 1000000000; i++) {
            j = i;
        }
        args.GetReturnValue().Set(j); // 設定 function 回傳結果
    }

    void Initialize(Local<Object> exports) {
        // 設定要 export 的方法
        // 以及 export 的方法的名字 (在 node 中會以 .go() 的方式執行)
        // 如果把以下的 "go" 替換成 "cal"，在 node 中就要改以 .cal() 的方式執行
        NODE_SET_METHOD(exports, "go", Method);
    }

    NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

}  // namespace demo

```

4. 執行 `node-gyp build`
執行完成後會在 `./build/Release/cal.node` 看到被建立出的 Addon 套件  

5. 在 Node.js 引用此 Addon 
```javascript
// main.js
var cal = require('./build/Release/cal.node');
console.log(cal.go());
```

6.  執行 `node main.js` 
即可看到結果為 999999999

## 簡單效能比較  

在建立另一個 `main2.js` 檔案
```javascript
let j = 0;
for (let i = 1; i < 1000000000; i++) {
    j = i;
}
console.log(j);
```
執行以下兩個指令  
1. `time node main.js`
![](https://i.imgur.com/onIYa0h.png)
2. `time node main2.js`
![](https://i.imgur.com/9RvHNrY.png)

可以看到再以計算上來說
用 C++ 去執行速度快了一大截 (畢竟 C++ 是編譯型語言)