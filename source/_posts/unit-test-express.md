---
title: unit test 該怎麼用? 又該如何在 express 開發上實作 unit test?
categories: Test
date: 2019-12-10 23:02:14
tags: [Test, unit test, sinon, test double]
header-img: /images/banner.jpg
catalog: true
---

## 前言

<span style="color:green">[2019-12-22 Update]</span>
在[express unit test 一些技巧教學以及困難點](https://yu-jack.github.io/2019/12/22/unit-test-express-implement-troubleshooting/)裡面有針對一些技巧做說明  
以及增加測試涵蓋率的使用方式

在很久很久之前有提到過 [unit test](https://yu-jack.github.io/2017/11/01/how-to-test/)  
但那時候只有針對簡單到不能在簡單的 function 進行 unit test  
想必大家一定也不太了解 unit test 究竟要怎麼用在真正開發上面  

<!-- more -->

在真正開發上面要用到 unit test  
一定會牽扯到讀取資料庫、讀取檔案、呼叫 API 等等複雜邏輯  
難道在做測試的時候，我還要確保我的 API 可以呼叫  
資料庫可以進行連線等等後，我才能確認我的程式是否正確嗎?  
在這種情況下要做 unit test 真的是一件不簡單的事情  
更別說 test cases 跑到一半  
有人把你測試環境的 database 亂改動，或是 API  Server 的分支改掉這種鳥事了...  

這樣的話，究竟要透過什麼樣的方式可以去做到 unit test 呢?  
其實可以透過 mock 的機制，讓呼叫 API 回傳值  
回傳一個固定值，而並不需要去真正呼叫 API  

這裡所說的 mock 只是 unit test 使用到的一種方式  
其他還包含 spy 、stub、fake 等等
我們通常稱這些為 test double (測試替身)
以下會先介紹剛剛提到的 test double

> 題外話，一開始看到這名詞讓我一直想到 JOJO .. 

## Test Double - 測試替身

根據[搞笑談軟功](http://teddy-chen-tw.blogspot.com/2014/09/test-double2.html)裡面其實有提到五種，但我這邊會介紹個人常見和常用到的四種

### stub
當程式是使用到 HTTP 相關操作的，為了測試相依性降到最低
可以透過 stub 去變更發出 HTTP 程式的行為，變成不真的發出 HTTP，且可以自定義回傳的結果
還有包含讀檔的行為也是如此，利用 stub 取代真的讀檔的行為，使測試可以更關注在程式邏輯上面
而一般使用 stub 都會寫死回傳的資訊，以方便後續測試

使用情景: <span style="color:green">[假資料回傳]</span>  
HTTP Request, 讀檔, 讀取資料庫等等，後續程式還沒實作的狀況下可以用來測試程式邏輯

### spy  
此 double 是用在去紀錄 function 的行為驗證上面
被 spy 的 function 就像是被安插間諜一樣，會去收集行為
function 也會真的被執行，並不會像 stub 一樣被取代掉
以 function 裡面 post http 為例，此 post http 是會真的發送請求出去，但會被紀錄
如果是用 stub 的話，post http 則是不會發送請求出去

使用情景: <span style="color:green">[行為驗證]</span>  
因為程式是真的會執行，所以會專注在驗證程式執行的行為驗證上，例如驗證程式應該只能跑一次等等的行為上  

想了解更詳細的可以讀讀 Sinon.js 的文件內容，擷取部分原文如下  
> A test spy is a function that records arguments, return value, the 
> value of this and exception thrown (if any) for all its calls.
> from [Sinon Spy](https://sinonjs.org/releases/latest/spies/)

### mock
Mock Object 則是類似於 spy 以及 stub 的集合體
本身擁有可以取代物件的方法 (stub)，且內建 expect 方法可以驗證執行的行為是否正確 (spy)
如果只是單純要讓後續程式邏輯接受固定值的話，用 stub 即可
如果只是單純要驗證程式的行為，用 spy 即可
但如果是以上兩個混合的狀況下，則是建議使用 Mock 

使用情景: <span style="color:green">[行為驗證,假資料回傳]</span>  
當需要驗證 HTTP POST 是否有根據所需參數進行執行，但又不想要真的發出 HTTP 的時候可以使用，跟 spy 最大差別在於 spy 是會真的執行程式，但 Mock 是不會真的去執行

想了解更詳細的可以讀讀 Sinon.js 的文件內容，擷取部分原文如下    
> Mocks (and mock expectations) are fake methods (like spies) with pre-programmed behavior (like stubs) as well as pre-programmed expectations.
> Mocks should only be used for the method under test. In every unit test, there should be one unit under test.
> In general you should have no more than one mock (possibly with several expectations) in a single test.
> from [Sinon Mock](https://sinonjs.org/releases/latest/mocks/)

### fake
此物件並不像是 spy 或是 stub 會取代程式裡面的行為
而是建立一個實際可執行的 function，通常是用在建立 XHR or Server or Database 上面，但會是以更簡化的方式去實現
例如原本可能是一個寄信的程式，但因為寄信驗證這件事情本身不好處理
這邊可以做出一個 fake Object 是把寄信的訊息內容，改成寫檔，已達成寄信行為的驗證

使用情境：<span style="color:green">[簡化程式]</span>  
簡化寄信，或是簡化 DB 連線改用 In-memory 的方式等等，目的就是要簡化 prodcution code 的複雜度

想了解更詳細的可以讀讀 Sinon.js 的文件內容，擷取部分原文如下    
> the sinon.fake API knows only how to create fakes, and doesn’t concern itself with plugging them into the system under test.
> To plug the fakes into the system under test, you can use the sinon.replace* methods.
> from [Sinon Fake](https://sinonjs.org/releases/latest/fakes/)  

### 小結結語

要特別注意一件事情  
每一個測試框架針對這些 test double 可能會有一些些微的差距  
最好是針對測試框架裡面的文件進行閱讀  
去了解使用時機跟方式會比較恰當  
接下來就開始介紹關於 Sinon 這個測試框架的程式實作部分  
以及該如何搭配 express 進行 unit test  

## 實作  

接下來會透過 express 搭配 sinon 進行 unit test 的說明  
首先我們會需要一個簡單的 express server  
此 server 功能有呼叫登入 API 以及寫檔兩種功能  

為了方便進行 unit test 程式架構上，會進行拆分以模擬真實開發狀況  
登入的主要邏輯很單純  
```javascript
// server.js - listen 在 7070
const authController = require("./authController")
app.post("/login", authController.run);

// authController.js
const run = async (req, res) => {
    const {
        username
    } = {...req.body};
    const result = await apiService.login(username)
    if (result.status !== 0) {
        return res.json({
            message: "登入失敗"
        })
    }
    return res.json({
        message: "登入成功"
    })
}

// apiService.js
const login = (username) => {
    return axios.post("http://localhost:7070/api", {
        username,
    }).then((res) => res.data);
}


// 給 /login 用的, 不在測試範圍內
app.post("/api", (req, res) => {
    res.json({status: req.body.username === "123" ? 0 : 1})
})
```

在這種情況下要進行 unit test 必須要確保  
呼叫 `apiService.login` 是不會有任何問題的  
那如果要移除這層依賴，透過 test double 該如何對 `authController.run` 進行測試呢?  

### Express with Sinon Stub  

#### Sinon Stub 介紹
先介紹一下 Sinon Stub 如何使用，先看 code

```javascript
const sinon = require("sinon");
const test = sinon.stub().returns(5);
console.log(test());
// 5
```
透過 stub 這個 function 接到的回傳值會是一個 function  
而這個 function 可以自定義呼叫的時候會有什麼樣的行為  
上面的範例中，我們讓他呼叫後得到的回傳是 5  

那如果要得到類似 `{status: 0}` 這種結果呢? 方法如下  
```javascript
const test = sinon.stub().returns({status: 0});
console.log(test());
// {status: 0}
```

那如果說是要取代原本 function 的功能呢?
```javascript
const sinon = require("sinon");
const obj = {
    test: function() {
        return "this is test."
    }
}
console.log(obj.test());
// "this is test."
sinon.stub(obj, "test").resolves({status: 0});
console.log(obj.test());
// Promise { { status: 0 } }
```

透過以上方法，obj 裡面的 test function 就被取代掉  
然後讓這個 function 回傳一個 promise.resolve 的結果  

但如果說我的 function 要接收一個參數，然後指定回傳呢?  
```javascript
const sinon = require("sinon");
const obj = {
    test: function(a) {
        return "this is test: " + a
    }
}
console.log(obj.test("test"));
// this is test: test
sinon.stub(obj, "test").withArgs("123").returns({status: 0});
console.log(obj.test("123"));
// { status: 0 }
console.log(obj.test());
// undefined
```

透過 `withArgs` 可以設定，當這個 function 接收到什麼樣的參數的時候  
應該要回傳什麼樣的結果  
以上面的範例來說，只要這個 test function 的參數是 `"123"` 的話  
那他的回傳值就會是 `{ status: 0 }`  
綜合以上的方法，就可以開始實作 unit test 了  

#### 如何在 express 上使用 stub

回到正題
因為是 express 的關係，所以 req 以及 res 的物件必須先透過 stub  
把 res 的行為先透過自訂義的方式給取代  
> 這邊 req 不用的原因是，我們只取 req.body 的值
> 所以可以直接當成 json 取值就好
> 但 res 不能的原因是, express 再回傳的時候
> 會需要多 call res.json() 來把值回傳回去  

```javascript
const mockRequest = (data) => {
    return {
        body: data
    }
}
const mockResponse = () => {
    const res = {};
    res.json = sinon.stub().returns(res);
    return res;
}
```

接下來正式的測試程式來了  
```javascript
describe("[登入功能]", () => {
    it("登入成功", async () => {
        const req = mockRequest({
            username: "123",
        })
        const res = mockResponse();
        sinon.stub(apiService, "login").withArgs("123").resolves({
            status: 0
        })
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入成功",
        });
        sinon.assert.calledOnce(res.json);
    })
})
```

透過使用 `sinon.stub(apiService, "login")`  
可以把 apiService 裡面的 login function 實際行為給取消掉  
我們在後面定義了回傳一個 `Promise.resolve` 來指定被我們更改掉後應該回傳的資料  
也就是 `sinon.stub(apiService, "login").resolves(data)` 裡面的 data  
這樣我們就可以讓 `authController.run` 裡面的 `apiService.login`  
不會真正去發送 POST Request，而是會回傳我們的結果  
執行 mocha 後的結果如下  
![](/images/unit-test/mocha-1.png)

接下來我們再增加一個 test case，程式碼如下  
```javascript
const apiServiceLogin = sinon.stub(apiService, "login")
describe("[登入功能]", () => {
    beforeEach(() => {
        apiServiceLogin.reset()
    })
    it("登入成功", async () => {
        const req = mockRequest({
            username: "123",
        })
        const res = mockResponse();
        apiServiceLogin.withArgs("123").resolves({
            status: 0
        })
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入成功",
        });
        sinon.assert.calledOnce(res.json);
    })
    it("登入錯誤", async () => {
        const req = mockRequest({
            username: "123",
        })
        const res = mockResponse();
        apiServiceLogin.withArgs("123").resolves({
            status: 999
        })
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入失敗",
        });
        sinon.assert.calledOnce(res.json);
    })
})
```

這邊要注意，已經被取代掉的 function，行為已經被我們第一個 test case 給固定了  
為了要還原預設行為，必須在 `beforeEach` 加上  `reset()` 的方法  
去重置每一個 test case `apiService.login` 回傳的行為，結果如下  
![](/images/unit-test/mocha-2.png)

### Express with Sinon Spy  

#### Sinon Spy

```javascript
const sinon = require("sinon");
const spy = sinon.spy();
spy()
console.log(spy.callCount);
// 1
```

基本上所有測試替身呼叫後，都是會回傳一個可執行 function 回來  
根據前面介紹過，spy 是單純拿來做紀錄以及驗證   
上面的範例來說，就可以知道這個 function 被呼叫一次  
另外在 spy 的狀況下，function 實際行為是會被觸發，我們再來看另一段 code  
```javascript
const sinon = require("sinon");
const obj = {
    test: function(a) {
        return "this is test: " + a
    }
}
const spy = sinon.spy(obj, "test");
console.log(spy("hihi"));
// this is test: hihi
console.log(obj.test("hihi2"));
// this is test: hihi2
console.log(spy.callCount);
// 2
```
以上面的例子可以看到，程式實際上的邏輯是有被觸發成功的  
透過 spy 回傳的值，也是一個可執行的 function  
透過 `spy()` 或是 `obj.test()` 去觸發，都會被記錄起來

#### 如何在 express 上使用  spy

程式碼會增加一段對 username 進行 hash 再去做 login  
```javascript
// authControler.js
const run = async (req, res) => {
    const {
        username
    } = {...req.body};
    const result = await apiService.login(hash.sha256(username))
    if (result.status !== 0) {
        return res.json({
            message: "登入失敗"
        })
    }
    return res.json({
        message: "登入成功"
    })
}

// hash.js
const sha256 = (username) => {
    const t = ctypto.createHash("sha256");
    return t.update(username, "utf8").digest("base64");
}
```

先來跑跑看 unit test 會發現結果是錯的  
原因是因為原本設定好 login 的時候，參數應該會是帶 `"123"`  
但因為變成 hash 之後會改成 `"pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM="`  
把 unit test 裡面的 withArgs 改成 `apiServiceLogin.withArgs("pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=")` 即可  

此時我們想要針對 `hash.sha256` 進行次數監控  
```javascript
const hashSha256 = sinon.spy(hash, "sha256");
beforeEach(() => {
        apiServiceLogin.reset()
        hashSha256.resetHistory()
    })
    it("登入成功, hash 一次", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceLogin.withArgs("pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=").resolves({
            status: 0
        })
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入成功",
        });
        sinon.assert.calledOnce(res.json);
        sinon.assert.calledOnce(hashSha256)
    })
    it("登入錯誤, hash 一次", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceLogin.withArgs("pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=").resolves({
            status: 999
        })
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入失敗",
        });
        sinon.assert.calledOnce(res.json);
        sinon.assert.calledOnce(hashSha256)
    })
```

先在最前面加上 `const hashSha256 = sinon.spy(hash, "sha256");` 取完成 spy 的動作
然後在最後面加上了驗證 `sinon.assert.calledOnce(hashSha256)` 就可以完成驗證動作  
除此之外，要先在 `beforeEach` 加上 `hashSha256.resetHistory()` 去重置計算次數  

### Express with Sinon Mock 

#### Sinon Mock

不同於 stub 以及 spy  
透過 mock 回傳的東西並不是一個可執行的 function  
而是要透過此 mock 去進行設定，類似『驗證』用的東西  
以及可以像是 stub 一樣，指定在 function 被呼叫的時候，應該會有什麼樣的回傳值  
但又不同於 stub 以及 spy，mock 並不能直接去針對某一個做 mock  
而是只能會對整個 obj 做 mock  
```javascript
const sinon = require("sinon");
const obj = {
    test: function(a) {
        return "this is test: " + a
    }
};
const mock = sinon.mock(obj);
// 驗證只能最多被呼叫 2 次
mock.expects("test").atLeast(2).returns({status: 1})

console.log(obj.test());
// { status: 1 }
console.log(obj.test());
// { status: 1 }

mock.verify()
```

透過 `mock.expects("test").atLeast(2).returns({status: 1})` 去設定  
預期哪一個 method 應該回傳什麼樣的值以及設定可被執行的次數  
最後再透過 `mock.verify()` 可以啟用這個 assertion  
除此之外，如果想要回復這個被 mock 原始的 method 的話  
可以透過 `mock.restore()` 去做回覆的動作  
這樣回覆之後，就會執行原本 function 的邏輯了  

#### 如何在 express 上使用 mock

基本上程式碼跟上一個很像，但不一樣的地方在於  
我想要針對 apiService.js 去進行驗證，以及模擬回傳值  
```javascript
const apiServiceLogin = sinon.mock(apiService);
it("登入成功, hash 一次", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceLogin.expects("login").withArgs("pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=").resolves({
            status: 0
        }).once();
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入成功",
        });
        sinon.assert.calledOnce(res.json);
        sinon.assert.calledOnce(hashSha256)
    })
    it("登入錯誤, hash 一次", async () => {
        const req = mockRequest({
            username: "123"
        })
        const res = mockResponse();
        apiServiceLogin.expects("login").withArgs("pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=").resolves({
            status: -1
        }).once();
        await authController.run(req, res)
        sinon.assert.calledWith(res.json, {
            message: "登入失敗",
        });
        sinon.assert.calledOnce(res.json);
        sinon.assert.calledOnce(hashSha256)
    })
```

差別在於以下程式，透過 mock，可以去指定回傳值，以及可以兼顧驗證用的功能
```javascript
apiServiceLogin.expects("login").withArgs("pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=").resolves({
    status: -1
}).once();
```

### Express with Sinon Fake  

#### Sinon Fake

在 Sinon 官網上對於 Fake 的說明是  
一種把 spy 跟 stub 混合的一種形式  
所以這邊後面並不會介紹如何在 express 上面實作  
而是會針對這個 fake 功能做些簡單的範例而已  

```javascript
const sinon = require("sinon");
const fake = sinon.fake.returns({status: 1});
console.log(fake());
{ status: 1 }
```

跟 stub 一樣可以指定該 function 應該回傳的值  
但他也有可以取代原本 method 的功能，程式如下

```javascript
const sinon = require("sinon");
const obj = {
    test: () => {
        return "test";
    }
}
const fake = sinon.fake.returns({status: 1});
console.log(obj.test());
// test
sinon.replace(obj, "test", fake)
console.log(obj.test());
// { status: 1 }
```

透過 `sinon.replace`，可以取代掉原本 function 的實際邏輯  

## 結語

以上介紹完每一個 test double 的意思以及使用場景  
但使用場景上，我也還在思考什麼樣的場景可以搭配什麼去使用  
歡迎各位一起在下面留言進行討論  
未來會再針對實務上 unit test 遇到的困難再回來整理一篇  

## References

1. https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
2. https://dev.to/milipski/test-doubles---fakes-mocks-and-stubs
3. https://codewithhugo.com/express-request-response-mocking/
4. https://tpu.thinkpower.com.tw/tpu/articleDetails/1294
5. http://kaczanowscy.pl/tomek/2011-01/testing-basics-sut-and-docs