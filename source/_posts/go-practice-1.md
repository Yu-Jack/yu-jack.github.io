---
title: 學習 Golang 的心得 - Receiver
categories: Golang
date: 2021-04-18 20:29:49
tags: [golang]
header-img: /images/banner.jpg
catalog: true
---

## 介紹

程式語言共通的特性像是 for-loop, if-else, declaration 之類的  
又或是 go 的 type 宣告是在後面 `var num int`, 而 java 是 `Int number`  
又或是 go 中大寫代表 `public` 小寫代表 `private`  
這種只是單純因為語言特性不同而導致寫法不同, 通常不會是大問題  
基本上只要 google 一下大概就知道差別了  

而我覺得學習語言最先要了解的是, 這個語言最獨有特性是什麼
原因是這些獨有特性通常都會被廣泛用在任何地方  
等於說看其他人程式之前, 如果不先了解獨有的特性就會不容易看懂  

個人覺得最先了解的應該是 Receiver 的概念  

## 正文

在說 Receiver 之前, 我們得先談談 struct 這個東西
先說 go 並沒有 class 的概念存在, 反而是存在 struct  
寫過 C 的人應該會了解 struct, 簡單來說就是定義資料的結構  
像我定義一個資料結構是叫做 User 裡面有一個參數叫做 Name

```go
type User struct {
    Name string
}
```

接著透過以下方法去使用 struct, 就會看到 jack 被印出來  

```go
package main
import "fmt"
user := User {
    Name: "jack",
}
func main() {
	user := User{
		Name: "jack",
	}
	fmt.Println(user)
}
```

那如果我想透過 function 去更改我的名字呢?  
透過以下 function 就可以實現  

```go
package main
import "fmt"
type User struct {
	Name string
}
func changeName(user *User) {
	user.Name = "hi"
}
func main() {
	user := User{
		Name: "jack",
	}
	changeName(&user)
	fmt.Println(user)
}
```

看到上面的 `*` `&` 時, 要注意到 go 語言有指標的概念存在  
指標這東西講起來也複雜, 我直接實際帶例子看看差別  
你會發現下面的例子, 我移除掉 `*` `&` 這兩個符號後, 依舊印出來是 jack  
結果跟上面例子不一樣, 這就是指標的特性  
當你呼叫 function 用指標當作參數的話, 當裡面更改參數時, 是會連同修改到外面傳進來的參數  
套在 js 概念時, 其中一個例子就是當 js function 中對傳進來的『物件中參數做更動，而不是重新賦值』時  
也會連同修改到外面傳進來的參數, 簡單來說, 就是改到同一塊記憶體位置  

> 但要注意的是, Go 並不是 pass-by-reference
> 『Everything in Go is passed by value』, 有興趣可以看看[官網解說](https://golang.org/doc/faq#pass_by_value)

```go
package main
import "fmt"
type User struct {
	Name string
}
func changeName(user User) {
	user.Name = "hi"
}
func main() {
	user := User{
		Name: "jack",
	}
	changeName(user)
	fmt.Println(user)
}
```

接著要講到重點了, 上面的 function 可以改寫成另一種型態  

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
	fmt.Println(user)
}
```

第一次看到看到參數可以寫在 function name 前面很特別吧 XD  
但仔細比對, 雖然在 function 宣告上其實是很相似
佔看之下只是把 paramters 的部分移動到 function name 前面而已

```go
func (user *User) changeName() {
	user.Name = "hi"
}
func changeName(user *User) {
	user.Name = "hi"
}
```

但這確有很大不同的意義  
其中是一個是使用的方式大有不同, 這就是 receiver 中的一個特色  
當你把 function 參數搬到前面時, 他就變成 receiver 的一種  
也就是，當你的資料結構為 `User` 時, `changeName` 就是你所屬的一個 function

```go
user.changeName() // 對應到上面第一個 changeName
changeName(user) // 對應到上面第二個 changeName
```

但這個 receiver 可以根據你資料的結構去進行變化  
也就是說, 你可以再定義一個新的資料結構, 但 method name 也取一樣  
以下面例子來說, User 有自己的 changeName function, School 有自己的 changeName function  
在 go 裡面會根據資料結構的定義去找到相對應的 function 去執行  

```go
func (user *User) changeName() {
	user.Name = "hi"
}
func (school *School) changeName() {
	school.Name = "hi"
}
```

## 後記

以上就是 go receiver 的介紹, 這在 go 中非常常見  
也是我寫過的語言中最為特別的一種應用方式, 畢竟 go 並沒有 class 的觀念存在  
『硬要』用 java 去解釋的話, 就會變成 User 是一個 class, 而 changeName 是我 instance 實例化後的一個 method  
但還是要強調, 用其他語言去解釋只是比較容易解釋, 但本質上是不一樣的  

接著下一篇會提到 interface & struct 的交互應用  
因為這個交互應用可以對應到 unit test 中如何去做 mock 有關係  
