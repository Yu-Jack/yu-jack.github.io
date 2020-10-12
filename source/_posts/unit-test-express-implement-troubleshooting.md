---
title: express unit test 一些技巧教學以及困難點
categories: Test
date: 2019-12-22 13:29:29
tags: [Test, unit test, sinon, test double]
header-img: /images/banner.jpg
catalog: true
---

## 前言

[上一篇](https://yu-jack.github.io/2019/12/10/unit-test-express/)我們講到使用 sinon 搭配 express 的使用基礎  
今天會介紹的是關於在 nodejs 的 express unit test  
實作 unit test 的幾個技巧以及可能會遇到的問題  
該如何解決問題，並依靠 sinon 去達到希望的功效  

<!-- more -->

## stub 同一個 object

在開始寫 unit test 之後  
會開始發現一件事情，就是需要對同一個物件重複做 stub  
在 a.test.js 需要 stub 一次  
在 b.test.js 又需要 stub 一次  

直覺上測試程式可能會變成以下的樣子  
```javascript
// login.test.js
const apiServiceStub = sinon.stub(apiService);
describe("[登入功能]", () => {
    it("登入成功", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceStub.login.withArgs("123").resolves({
            status: 0
        });
        await loginController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入成功",
        });
        sinon.assert.calledOnce(res.json);
    })
    it("登入錯誤", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceStub.login.withArgs("123").resolves({
            status: -1
        });
        await loginController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入失敗",
        });
        sinon.assert.calledOnce(res.json);
    })
})
// register.test.js
const apiServiceStub = sinon.stub(apiService);
describe("[註冊功能]", () => {
    it("註冊成功", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceStub.register.withArgs("123").resolves({
            status: 0
        });
        await registerController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "註冊成功",
        });
        sinon.assert.calledOnce(res.json);
    })
    it("註冊錯誤", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceStub.register.withArgs("123").resolves({
            status: -1
        });
        await registerController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "註冊失敗",
        });
        sinon.assert.calledOnce(res.json);
    })
})
```

我們在 login.test.js 以及 register.test.js  
都對 apiServer 進行 stub 的動作  
而這兩個檔案在獨立分別跑測試的時候是會成功的  
但一起執行的時候卻會爆出以下的錯誤  
`TypeError: Attempted to wrap which is already wrapped`  
代表說，我們對同一個 object 重複做了 wrap  
![](/images/unit-test/problem-1.png)
> 可到個人的 [github 下載程式](https://github.com/Yu-Jack/unit-test-practice)，並執行 `npm run w1`  
> 就可以看到錯誤訊息了


要解決這個問題的話  
我們必須透過 stub 指定的 method  
再加上透過 restore 的方式釋放被 wrapped 物件的方法  
如果不 restore 的話，物件就會一直是 wrappred 的狀態  
然後就一直沒有辦法回復到原本物件應該有的狀態  
所以更改過後程式碼如下
```javascript
// login.test.js
let apiServiceLogin
describe("[登入功能]", () => {
    before(() => {
        apiServiceLogin = sinon.stub(apiService, "login");
    })

    after(() => {
        apiServiceLogin.restore();
    })

    it("登入成功", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceLogin.withArgs("123").resolves({
            status: 0
        });
        await loginController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入成功",
        });
        sinon.assert.calledOnce(res.json);
    })
    it("登入錯誤", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceLogin.withArgs("123").resolves({
            status: -1
        });
        await loginController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入失敗",
        });
        sinon.assert.calledOnce(res.json);
    })
})
// register.test.js
let apiServiceRegisterStub;
describe("[註冊功能]", () => {
    before(() => {
        apiServiceRegisterStub = sinon.stub(apiService, "register");
    })

    after(() => {
        apiServiceRegisterStub.restore();
    })
    it("註冊成功", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceRegisterStub.withArgs("123").resolves({
            status: 0
        })
        await registerController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "註冊成功",
        });
        sinon.assert.calledOnce(res.json);
    })
    it("註冊錯誤", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceRegisterStub.withArgs("123").resolves({
            status: -1
        })
        await registerController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "註冊失敗",
        });
        sinon.assert.calledOnce(res.json);
    })
})
```

主要著手解決的地方在於兩點
1. `before` -> 把 stub 的地方改放這 (不過個人實驗過，不放這也沒問題，放這只是比較有統一性)
2. `after` -> 加上 `restore`，在做完測試的時候把整個物件給釋放出來
這點如果沒有做到的話，會導致在另一個 xxx.test.js 在使用同一個物件的方法時  
爆出已經被 wrapped 過後的錯誤訊息  
> 可在[個人專案](https://github.com/Yu-Jack/unit-test-practice)下執行 `npm run w2` 即可看到錯誤訊息
> 裡面的範例是把 login.test.js restore 給註解掉後
> 故意讓 register.test.js 去對 login 做 stub 而不是 register
> 此時因為 login.test.js 做過一次 stub
> register.test.js 再做一次 stub 就會出現錯誤了 
> 成功的結果可以執行 `npm run c1`  看到

## 檢測 API URI

透過 `sinon.stub` 的 `withArgs` 功能可以確定  
當我們程式在執行的時候，所呼叫的 api URI 是否正確  
```javascript
axiosPostStub.withArgs("http://localhost:7070/api/login", data).resolves({
    status: 0
})
```
當程式呼叫錯誤的 API URI 的時候  
就不會回傳我們預設給的回傳值  
就會導致程式後續失敗，這就是反向驗證了我們 API URI 是否正確的方式  

> 可在個人專案下執行 `npm run c2` 即可看到結果

## 驗證 axios 的攔截器  

有時候我們會為 axios 加上攔截功能  
但如果要測試攔截功能，就又必須要有 server 才能辦到  
此時可以在 test case 裡面加上 `http.createServer` 做到這件事情
```javascript
// network.js
const axios = require("axios");

axios.interceptors.request.use((config) => {
    console.log(("do something for request"));
    return config;
});

axios.interceptors.response.use((response) => {
    console.log(("do something for response"));
    return response.data;
});

module.exports = axios;

// network.test.js
let server;
describe("[network 功能]", () => {
    afterEach(() => {
        server.close();
        server = null;
    })

    it("測試攔截功能(interceptors)", (done) => {
        server = http.createServer((req, res) => {
            const data = {a:1}
            res.end(JSON.stringify(data));
        }).listen(4000, () => {
            network.post("http://localhost:4000").then((data) => {
                done();
            })
        })
    })
});
```

配置好以上程式之後，可以在 terminal 看到兩個 console.log 的訊息  
這就代表我們的攔截器有被執行到  
個人認為攔截器測試獨立寫出來一個就可以  
不用特地讓其他測試案例都一定要執行到這功能，不然就不叫 unit test 了  
> 可在[個人專案](https://github.com/Yu-Jack/unit-test-practice)下執行 `npm run c3` 即可看到結果  

## 測試 callback function

有些時候我們會需要把一些在用 callback function 的程式  
包起來改用 Promise 的方法使用，如下
```javascript
const obj = {
    test: function(data, callback) {
        callback(data);
    }
}
const test = () => {
    return new Promise((res, rej) => {
        obj.test("qqqq", (data) => {
            res(data)
        })
    })
}
async function main() {
    let data = await test();
    console.log(data);
}
main()
// qqqq
```

在這種 callback 底下，可以透過 `sinon.yields` 去進行測試  
`sinon.yields` 的功能，就是可以強制讓你的 callback 被執行  
而不會去執行原本 function 內 callback 應該要執行的內容  
而且後面所帶的參數會變成你設定在 `yields(data1, data2)` 後面的 data1 data2  
這邊展示一個範例
```javascript
const obj = {
    test: function(data, callback) {
        console.log("running");
        callback(data);
    }
}
obj.test("test", (data) => {
    console.log(data);
})
// running
// test
```

讓我們把程式加上 `sinon.yield` 試試看
```javascript
const sinon = require("sinon")
const obj = {
    test: function(data, callback) {
        console.log("running");
        callback(data);
    }
}
sinon.stub(obj, "test").yields(1)
obj.test("test", (data) => {
    console.log(data);
})
// 1
```

程式會 log 出 1 這個值  
但是 running 並不會執行到  
非常符合 stub 的原則，就是會覆寫 function 原本的行為  
然後再透過 yields 的方法，可以直接你所撰寫觸發 callback 的行為  
而不會去執行 obj.test function 本身的行為

所以依此類推，我在後面多加幾個參數  
原本的 callback 回來的參數只會有一個，其餘為 `undefined`  
```javascript
const obj = {
    test: function(data, callback) {
        callback(data);
    }
}
obj.test("test", (data1, data2, data3) => {
    console.log("data1: " + data1);
    console.log("data2: " + data2);
    console.log("data3: " + data3);
})
// data1: test
// data2: undefined
// data3: undefined
```

但是如果透過 `sinon.yields` 去強制給於另外兩個參數呢?  
```javascript
const sinon = require("sinon")
const obj = {
    test: function(data, callback) {
        callback(data);
    }
}
sinon.stub(obj, "test").yields(1, 2, 3)
obj.test("test", (data1, data2, data3) => {
    console.log("data1: " + data1);
    console.log("data2: " + data2);
    console.log("data3: " + data3);
})
// data1: 1
// data2: 2
// data3: 3
```

callback 的時候，另外兩個參數也會跟著進來  

那透過把 callback 包成 promise 的案例又該怎麼測試呢?  
範例如下，必須在執行 function 之前  
先加上 `sinon.stub(obj, "test").yields(1)` 就可以了
```javascript
const sinon = require("sinon")
const obj = {
    test: function(data, callback) {
        callback(data);
    }
}
sinon.stub(obj, "test").yields(1)
const test = () => {
    return new Promise((res, rej) => {
        obj.test("qqqq", (data) => {
            res(data)
        })
    })
}
async function main() {
    let data = await test();
    console.log(data);
}
main()
// 1 (因為已經被 yields 改成 1 了)
```

## 測試涵蓋率 (test coverage)  

做測試的時候當然少不了 test coverage  
node.js 有一款叫做 nyc 的可以檢測 test coverage  
配製方法非常簡單，以下兩個步驟即可
1. 下載 nyc `npm install nyc`
2. 把 nyc 放置於 mocha 前面 `nyc mocha ....`  
如果要想看 html 結構的報告的話，`nyc --reporter=lcov --reporter=text-summary mocha ...`

![](/images/unit-test/nyc.png)

> 可在[個人專案](https://github.com/Yu-Jack/unit-test-practice)下執行 `npm run nyc` 即可看到結果  

## 結語

以上介紹幾個在實際撰寫 unit test 會遇到的困難點以及解決方法  
未來還有遇到的話，會在陸陸續續補上來！  

