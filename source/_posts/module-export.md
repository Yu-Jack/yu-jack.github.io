---
title: Module Export
date: 2017-10-19 00:32:54
categories: NodeJs
tags: [nodejs, ecma6]
header-img: /images/banner.jpg
catalog: true
---
稍微紀錄一下在 nodejs 裡面 module.exports 和 require
以及在 ECMA6 的 export 和 import 的使用方式

<!--more-->

## nodejs

首先先在 a.js 裡面 export 出一個 object 裡面包含一個 click function
然後再 b.js 裡面用 require a.js，這時候會有兩種使用方式

```javascript=
// a.js
module.exports = {
    click: () => {
        console.log('Hi')
    }
}

// b.js
// 第一種
const a = require('./a.js')
a.click()
// Hi

// 第二種
const {click} = require('./a.js')
click()
// Hi
```

另外一種使用方式也可以達到同樣效果

```javascript=
// a.js
module.exports = () => {
    // 這裡可以處理一些初始化的東西
    return {
        click: () => {
            console.log('Hi')
        }
    }
}

// b.js
// 第一種
const a = require('./a.js')()
a.click()
// Hi

// 第二種
const {click} = require('./a.js')()
click()
// Hi

```

接下來就用不同種例子，看看使用方式

```javascript=
// a.js
module.exports = [1, 2, 3]

// b.js
const a = require('./a.js')
console.log(a)
// [1, 2, 3]
```

```javascript=
// a.js
module.exports = {
    name: 'Hi'
}

// b.js
const a = require('./a.js')
console.log(a.name);
// Hi
```


## ECMA6

我把上面的例子轉換成 ECMA6 import 和 export 的方式
但是有些地方會有些許不同

```javascript=
// a.js
export default {
    click: () => {
        console.log('Hi')
    }
}

// b.js
import a from './a.js'
a.click()
// Hi
```

```javascript=
// a.js
const click = () => {
    console.log('Hi')
}
export {
    click
}

// b.js
import {click} from './a.js'
click()
// Hi
```

也可以搭配 as 和 * 去做 import (無法跟 export default 做搭配)

```javascript=
// a.js
const click = () => {
    console.log('Hi')
}
export {
    click
}

// b.js
import * as a from './a.js'
a.click()
// Hi
```


接下來就用不同種例子，看看使用方式

```javascript=
// a.js
export default [1, 2, 3]

// b.js
import a from './a.js'
console.log(a);
// [1, 2, 3]
```

```javascript=
// a.js
const a = [1, 2, 3]
export {
    a
}

// b.js
import {a} from './a.js'
console.log(a);
// [1, 2, 3]
```

```javascript=
// a.js
export default {
    name: 'hi'
}
// 等同於
const a = {
    name: 'hi'
}
export default a

// b.js
import a from './a.js'
console.log(a.name);
// Hi
```