---
title: 初學 Go 該注意的事
categories: Golang
date: 2022-01-09 14:42:39
tags: [golang]
header-img: /images/banner.jpg
catalog: true
---

## 前言

strcut 和 receiver 的內容在之前的[學習 Golang 的心得 - Receiver](/2021/04/18/go-practice-1/) 就已經有提到過，這邊會快速帶過。整篇內容不會講太多細節，主要是可以清楚了解 Go 有哪些比較特別的用法，有些主題的原理我會再額外開文章去轉寫詳細內容。

## struct 

在 Go 裡面並沒有 class 的概念，取而代之的是 struct，有學過 C / C++ 對這東西應該很了解，基本上就是一種資料結構，而在 Go 裡面會大量用到 struct。

直接來看一個 struct 使用範例，就會看到印出 `{jack}` 出現。

```go
package main

import "fmt"

type User struct {
	Name string
}

func main() {
	user := User{
		Name: "jack",
	}
	fmt.Println(user)
}
// {jack}
```

如果想更詳細看到 struct 對應的欄位名稱，可以改用 `fmt.Println("%#v\n", user)`，就可以看到 `main.User{Name:"jack"}` 這個結果出現。

## receiver

接著若我想用 function 去修改我的名字的話，可以這麼做。

```go
package main

import "fmt"

type User struct {
	Name string
}

func (user *User) changeName() {
	user.Name = "hi"
}

func main() {
	user := User{
		Name: "jack",
	}
	user.changeName()
	fmt.Printf("%#v\n", user)
}
```

可以看到特別的地方在於 function name 前面有一個類似參數的東西，那個叫做 receiver，另一個是 pointer 的部分，詳細的內容建議到[學習 Golang 的心得 - Receiver](/2021/04/18/go-practice-1/) 了解一下，裡面也有提到 Go 裡面是只有存在 pass by value。

## interface

interface 可以來定義執行的動作，Go 是 duck typing 的一種類型，只要當前的方法和屬性有符合 interface 定義的結構，那就可以被使用。

```go
package main

import "fmt"

type User struct {
	Name string
}

func (user *User) changeName(newName string) {
	user.Name = newName
}

type Action interface {
	changeName(newName string)
}

func doSomething(a Action, newName string) {
	a.changeName(newName)
}

func main() {
	user := User{
		Name: "jack",
	}
	doSomething(&user, "hi2")
	fmt.Printf("%#v\n", user)
}
```

但這邊會看到一個比較特別的是用 `&user` 傳進去才可以使用，那是因為 `changeName` 這個 function 是 pointer type 的 User 實作的，並不是 value type 的 User 實作的，也就是 *User 有 changeName，但 User 沒有 changeName 可以使用，更詳細的之後再開一篇來說明。

## callback

在 Go 中 function 是 First-class function，所以 function 可以被當作參數儲存下來。

```go
package main

import "fmt"

func main() {
	a := func() {
		fmt.Println("cool")
	}

	a()
}
```

也就意味著可以當成 callback 的方式去運行。

```go
package main

import "fmt"

func cool(inp string, cb func(result string)) {
	newStr := fmt.Sprintf("%s:%s", inp, "hihihi")
	cb(newStr)
}

func main() {
	cool("yo?", func(result string) {
		fmt.Println(result)
	})
}
```

## defer

Go 中有一個 defer 方法，可以讓你 defer 後面接著 function 在執行的 function 的 scope 結束前去執行，直接來看範例。


```go
package main

import "fmt"

func cool() {
	fmt.Println("yoyo")
}

func main() {
	fmt.Println("start")
	defer cool()
	fmt.Println("end")
}
// start
// end
// yoyo
```

通常都會用在讀檔完成後，去用 defer 呼叫 `f.close`，確保會把檔案給關閉。另外 defer 是 LIFO 的概念，也就是以 stack 的概念去看待。再來一個比較特別的用法，因為 defer 接收的參數是 function，所以可以透過在 defer 的 function 裡面回傳 function 用來計算執行 defer 本身 function 執行時間，類似以下方式。

```go
package main

import (
	"fmt"
	"time"
)

func cool() func() {
	fmt.Println(time.Now())
	return func() {
		fmt.Println(time.Now())
	}
}

func main() {
	defer cool()()
	time.Sleep(2 * time.Second)
}
// 2022-01-07 23:33:10.983361 +0800 CST m=+0.000175862
// 2022-01-07 23:33:12.984566 +0800 CST m=+2.001384914
```


## panic  & recovery

在 Go 裡面可以用 panic 的方式直接終止程式運行。

```go
package main

import (
	"fmt"
)

func cool() {
	panic("bad")
}

func main() {
	cool()
	fmt.Println("yoo?")
}
```

即便改用 goroutine 的方式，整個程式還是會被終止。

```go
package main

import (
	"fmt"
	"time"
)

func cool() {
	panic("bad")
}

func main() {
	go cool()
	time.Sleep(2 * time.Second) // 因為 goroutine 啟動需要一點時間，不加這行的話，還是會執行到最下面。
	fmt.Println("yoo?")
}
```

那麼被終止就會有對應可以回復的方式，就是透過 recovery 去接錯誤，但 recovery 只能用在 defer 接的 function 後面，而且一定要在 panic 之前呼叫才可以。

```go
package main

import (
	"fmt"
)

func main() {
	defer func() {
		err := recover()
		fmt.Println("got error")
		fmt.Println(err)
	}()
	panic("bad")
	fmt.Println("yoo?") 
}
```

但要注意的是，panic 後面得程式是不會繼續執行下去的，另外 panic & recovery 是有 scope 關係的，如果上面的程式用別的 goroutine 去執行 panic 則不會正確抓到，如下範例。

```go
package main

import (
	"fmt"
)

func cool() {
	panic("bad")
}

func main() {
	defer func() {
		err := recover()
		fmt.Println("== got error ==")
		fmt.Println(err)
		fmt.Println("== got error ==")
	}()
	go cool()
}
// == got error ==
// <nil> // 沒抓到
// == got error ==
// panic: bad
```

若是放到同個 scope 則可以運作正常。

```go
package main

import (
	"fmt"
	"time"
)

func cool() {
	defer func() {
		err := recover()
		fmt.Println("== got error ==")
		fmt.Println(err)
		fmt.Println("== got error ==")
	}()
	panic("bad")
}

func main() {
	go cool()
	time.Sleep(1 * time.Second)
}
// == got error ==
// bad
// == got error ==
```

## init

通常在寫 class 的語言時，會習慣有 construct 的東西存在，當在 new 一個東西時去執行一些動作。雖然 Go 沒有 class，但有類似的東西可以使用，也就是透過 `init`，會發現以下程式不用實際去呼叫 `init` 這個 function 也能被執行到。

```go
package main

import (
	"fmt"
)

func init() {
	fmt.Println("this is init")
}

func main() {}
```

以執行的順序來說，即使在上面有初始化一些資料，init 也會蓋過

```go
package main

import (
	"fmt"
)

var a = "1"

func init() {
	a = "123"
	fmt.Println("this is init")
}

func main() {
	fmt.Println(a)
}
// this is init
// 123
```

## buffered / unbuffered channel

channel 主要是被設計在不同 goroutine 之間溝通的一種方式，並不是採用以往認知的共享記憶體，然後還要設計去限制一次只能有一個 thread 去對共享記憶體中的資料做讀寫，這種複雜的方式，在 Go 裡面不同 goroutine 的溝通是更加簡單的。

先來對名詞簡單定義一下，後面會有更完整的總結說明。

* unbuffered channel: 無法指定大小，讀寫操作必須是一對的
* buffered channel: 可以指定這個 channel 塞多少大小的資料

再來對語法簡單說明一下

* `<- ch` 代表是從 channel 中讀出資料
* `ch <-` 代表是把資料塞到 channel 中

### unbuffered channel

先來簡單看一個範例。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)
	go func() {
		time.Sleep(2 * time.Second)
		fmt.Println(<-ch)
	}()
	fmt.Println("start")
	ch <- "11"
	fmt.Println("end")
}
// start
// 11
// end
```

這個範例除了 main thread goroutine 之外，還用了 go 開了一個 goroutine 出來，那印出的順序是按照順序的，也就說明這是一個同步行為，接著我們試著拿掉中間 go 的部分。

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string)
	fmt.Println("start")
	ch <- "11"
	fmt.Println("end")
}
// start
// fatal error: all goroutines are asleep - deadlock!
```

可以發現在執行 `ch <- "11"` 那一行就噴出 fatal error 了，原因是 unbufferd channel 是同步的關係，所以是會 block 當前 goroutine 的，以這個 case 來說，我們只有 main goroutine，並沒有其他 goroutine，就代表沒有其他地方可以執行讀取 channel 的指令，整個程式就會壞掉。

這也是在網路上常看到說，unbuffered chhanel 的讀寫必須是要一組的，有個地方讀，就要有個地方寫，不過我們再看一個範例。

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string)
	fmt.Println("start")
	go func() {
		for {
		}
	}()
	ch <- "11"
	fmt.Println("end")
}
// start
```

會發現這個範例只有寫入，卻沒有讀取，但不會噴出 error，雖然還沒讀到原始碼，但 Go 應該是認定雖然 main goroutine blocked，但有其他 goroutine 還在運行，代表期待其他 goroutine 會讀取這個 channel 資料，既然還有 goroutine 還活著，整個程式就不會陷入 deadlock。

所以實際上判定不是說，一定要有讀寫一組，而是當你用了一邊的讀/寫，那麼 Go 就期待有另一個地方也執行對應的寫/讀，若完全沒有 goroutine 存在，就代表不會有另一邊行為的出現，就會陷入 deadlock。

### buffered channel

再來說到 buffered channel，直接來看範例。

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string, 2) // 指定大小
	fmt.Println("start")
	ch <- "11"
	ch <- "11"
	fmt.Println("end")
}
// start
// end
```

可以看到這個 case 跟前一個不同，是不需要額外開 goroutine 出來的，那如果我們塞往 channel 多塞一筆資料呢？

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string, 2)
	fmt.Println("start")
	ch <- "11"
	ch <- "11"
	ch <- "11"
	fmt.Println("end")
}
// start
// fatal error: all goroutines are asleep - deadlock!
```

會發現情況變得跟 unbuffered 的情況一樣，這時候因為沒有其他 goroutine，所以就出現 deadlock，所以一樣故意加一個新的 goroutine，他就不會噴出 error，如下。

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string, 2)
	fmt.Println("start")
	go func() {
		for {
		}
	}()
	ch <- "11"
	ch <- "11"
	ch <- "11"
	fmt.Println("end")
}
```

所以 buffered channel 的特性，在塞滿之前是不會期待有其他 goroutine 去對 channel 操作，也意味這 buffered channel 在滿之前，會是非同步的行為，滿了之後就會 block 當前 goroutine，行為等同於 unbuffered channel，那如果在沒滿和滿之間的話呢？其實是可以在當前 goroutine 直接去做操作，如下範例。

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string, 2)
	fmt.Println("start")
	ch <- "11"
	fmt.Println(<-ch)
	ch <- "12"
	fmt.Println(<-ch)
	ch <- "13"
	fmt.Println(<-ch)
	fmt.Println("end")
}
// start
// 11
// 12
// 13
// end
```

但另一個特別的點是，如果 buffered channel 裡面是沒有任何資料的話，使用 `<- ch` 也是會 block 當前的 goroutine，unbuffered channel 也是一樣的邏輯，如下範例。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string, 2) // or ch := make(chan string, 2)
	go func() {
		fmt.Println("got it")
		time.Sleep(2 * time.Second)
		ch <- "hi"
	}()
	<-ch
	fmt.Println("end")
}
```

可以看到開一個新的 goroutine 要去寫資料進去，但原本的 main goroutine 就停在 `<-ch`，直到把資料寫進去 channel，main goroutine 才繼續執行下去，接著若我把中間 goroutine 拿掉的話，則會出現 deadlock，因為已經沒有任何 goroutine 存在，也就代表不可能有人可以把資料寫到 channel。

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string, 2)
	<-ch
	fmt.Println("end")
}
// fatal error: all goroutines are asleep - deadlock!
```

### 簡單總結

* unbuffered channel
    當執行讀寫其中一個動作，會 block 當前 goroutine，若同時沒有其他 goroutine 則會陷入 deadlock
* buffered chhannel
    當 channel 沒滿的時候，是可以在同一個 goroutine 中讀寫多次，若寫到滿時，則會 block 當前 goroutine，若同時沒有其他 goroutine 則會陷入 deadlock。但 channel 是空的時候，執行讀取也會 block 當前 goroutine，若同時沒有其他 goroutine 也會陷入 deadlock。

## sync flow

直接先看以下範例。

```go
package main

import (
	"fmt"
)

func main() {
	go func() {
		fmt.Println("cool")
	}()
	fmt.Println("end")
}
// end
```

可以看到最終只有 end 被印出來，並沒有等待另一個 goroutine 中的 `cool`，那是因為 main goroutine 已經結束，所以就跳出整個程式，這 part 要討論的是要如何去把同步流程，等到 `cool` 出來之後，整個程式才結束執行。

### Channel

如果要讓程式停下來等，就可以利用 unbuffered channel block 的機制去實現，如下範例。

```go
package main

import (
	"fmt"
)

func main() {
	done := make(chan bool)
	go func() {
		fmt.Println("cool")
		done <- true
	}()
	<-done
	fmt.Println("end")
}
```

### WaitGroup

另一個是 WaitGroup，主要提供 `Add` `Wait` `Done` 三個 function，只要 `Add` 多少次，就得需要做對應次數的 `Done`，否則 `Wait` 的那一行就會一直等下去，簡單來說。

* Add (int): 增加幾次計數
* Done: 等同於 Add (-1) 的概念
* Wait: blocked 直到 Add & Done 總合起來為零為止

先看下面正常使用的範例。

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		fmt.Println("cool")
		wg.Done()
	}()
	wg.Wait()
	fmt.Println("end")
}
```

若如果有兩個 `Add`，配合一個 `Done` 的會就會卡住，如下範例。

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		fmt.Println("cool")
		wg.Done()
	}()
	wg.Wait()
	fmt.Println("end")
}
// cool
// fatal error: all goroutines are asleep - deadlock!
```

從這範例可以發現跟 channel 的機制其實很相似，以這個 case 來說，已經沒有任何 goroutine 可以執行 `Done` 的動作，就會被歸類在 deadlock 了。

## context

在寫 Go 時，可以很常看到 function 第一個參數就是 context，然後會一直被傳下去。

而這個 context 基本上是被設計同步不同 goroutine 流程或是夾帶資訊到不同 goroutine / function 之中的一個東西，我們先個看個 context 可以如何使用去夾帶資訊。


```go
package main

import (
	"context"
	"fmt"
)

func cool(ctx context.Context) {
	fmt.Println(ctx.Value("aa"))
}

func main() {
	ctx := context.Background()
	ctx = context.WithValue(ctx, "aa", "123")
	cool(ctx)
}
```

上面範例就是把一個 key-value 綁在 context 傳下去，讓其他接收到的人都可以讀取同樣的資訊，其實像是在 Go http server，每一個請求都是開一個新的 goroutine，並把對應的 request body 資訊綁在 context 裡面往下傳，所以我們才可以直接在 contex 去讀取請求。

另一個是同步流程，假設我們想一次停止所有 goroutine，就很適合用 context 是去處理，如下範例。

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	go func(ctx context.Context) {
		fmt.Println("start-1")
		<-ctx.Done()
		fmt.Println(time.Now())
		fmt.Println("end-1")
	}(ctx)

	go func(ctx context.Context) {
		fmt.Println("start-2")
		<-ctx.Done()
		fmt.Println(time.Now())
		fmt.Println("end-2")
	}(ctx)

	time.Sleep(1 * time.Second)
	cancel()
	time.Sleep(1 * time.Second)
}
```

## select

select 能夠監聽多個 channel 的讀寫狀況，若 channel 都沒有任何動作，就會 block 當前 goroutine，如下範例。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)
	go func() {
		fmt.Println("start")
		select {
		case value := <-ch:
			fmt.Println(value)
		}
		fmt.Println("end")
	}()
	time.Sleep(2 * time.Second)
}
// start
```

若我在 Sleep 前把資料寫到 channel，那個 goroutine 就會監聽到這個動作，並往後執行。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)
	go func() {
		fmt.Println("start")
		select {
		case value := <-ch:
			fmt.Println(value)
		}
		fmt.Println("end")
	}()
	ch <- "cool"
	time.Sleep(2 * time.Second)
}
// start
// cool
// end
```

但比較特別的點是 select 可以有一個 default case，當執行的當下沒有任何 channel 有動作，那就會執行 default 的部分。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)
	go func() {
		fmt.Println("start")
		select {
		case value := <-ch:
			fmt.Println(value)
		default:
			fmt.Println("default")
		}
		fmt.Println("end")
	}()
	time.Sleep(2 * time.Second)
}
// start
// default
// end
```

接著另一個有趣的點，當 select 搭配不同類型的 channel 會有不同的結果，關鍵取決於 channel 當下是否 block。以 unbuffered channel 來說，不管在 case 讀寫，都是屬於 block 行為，就不會觸發那條 case 發生，如下範例。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)
	go func() {
		fmt.Println("start")
		select {
		case ch <- "cool": // blocked
			fmt.Println("put")
		}
		fmt.Println("end")
	}()
	time.Sleep(2 * time.Second)
}
// start
```

若要讓他往下執行，就得需要對應的讀取動作才可以。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)
	go func() {
		fmt.Println("start")
		select {
		case ch <- "cool":
			fmt.Println("put")
		}
		fmt.Println("end")
	}()
	<-ch
	time.Sleep(2 * time.Second)
}
// start
// put
// end
```

所以換到 buffered channel，在 channel 沒滿之前，case 是可以被正常觸發的。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string, 2)
	go func() {
		fmt.Println("start")
		select {
		case ch <- "cool":
			fmt.Println("put")
		}
		fmt.Println("end")
	}()
	time.Sleep(2 * time.Second)
}
// start
// put
// end
```

若 channel 是已滿的情況，再額外塞入時就會跟 unbuffered channel 一樣會被 blocked，一樣會需要其他 goroutine 先去讀取才可以觸發那條 case，我們先來看被 blocked 的情況

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string, 2)
	ch <- "cool"
	ch <- "cool"
	go func() {
		fmt.Println("start")
		select {
		case ch <- "cool":
			fmt.Println("put")
		}
		fmt.Println("end")
	}()
	time.Sleep(2 * time.Second)
}
// start
```

一樣要解除這個情況，需要去把讀出 channel 資訊才可以繼續往下執行。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string, 2)
	ch <- "cool"
	ch <- "cool"
	go func() {
		fmt.Println("start")
		select {
		case ch <- "cool":
			fmt.Println("put")
		}
		fmt.Println("end")
	}()
	<-ch
	time.Sleep(2 * time.Second)
}
// start
// put
// end
```

所以當下 case 都被 blocked 的話，且又有 default case 存在，就會一併跑到 default 去執行。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string, 2)
	ch <- "cool"
	ch <- "cool"
	go func() {
		fmt.Println("start")
		select {
		case ch <- "cool":
			fmt.Println("put")
		default:
			fmt.Println("default")
		}
		fmt.Println("end")
	}()
	time.Sleep(2 * time.Second)
}
// start
// default
// end
```

所以在使用 select 要小心監聽的 channel 的情況，若有加上 default 的條件，對於 channel 會不會 block 就需要更加理解，否則可能全部都走到 default 去了，另外如果當 select 中存在兩者一樣的 case 則是會隨機挑一條去執行，這個網路上查基本上都會有，這邊就不附範例程式碼。