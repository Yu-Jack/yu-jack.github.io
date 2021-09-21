---
title: Go local package 設置
categories: Golang
date: 2021-09-21 12:53:00
tags: [golang, package]
header-img: /images/banner.jpg
catalog: true
---

## 介紹

這篇主要是介紹如何在本地不同資料夾下面，去引用別的資料夾的 go package 使用  
好處在於如果 clone 別人 source code 下來想要改的話，可以利用這種方式直接引用修改後的 source  
就不用自己還要推到 repository

## 實作

這是我主要的程式 `main.go`，裡面會去使用我自己建立的 package
```go
package main

import (
	"github.com/Yu-Jack/go-hello"
)

func main() {
	hello.Cool()
}
```

而 go.mod 目前設置如下
```sh
module example/hello-2
go 1.16
```

接著跑 `go get github.com/Yu-Jack/go-hello` 把專案載下來後，`go.mod` 就會變這樣  
```sh
module example/hello-2
go 1.16
require github.com/Yu-Jack/go-hello v0.0.0-20210921041315-798ac1b7038c // indirect
```

如果出現 `410 Gone` 以及 `fatal: could not read Username for 'https://github.com': terminal prompts disabled` 的錯誤，有以下幾個可能原因  
* 第一個因為 https 預設是禁止的，所以建議用 ssh，所以在 gitconfig 要下這個指令去改 `git config --global url."git@github.com:".insteadOf "https://github.com/"`，不過這個方式記得要把自己的 ssh key 上傳到 github 上    
* 第二個是 GOPROXY & GOSUMOB 設定，別透過 proxy 去拿就可以  
	```
	# 原本
	GOPROXY="https://proxy.golang.org,direct"
	GOSUMDB="sum.golang.org"

	# 改成，既得用 export 的方式，直接 go env -w 是無法改的 
	GOPROXY="direct"
	GOSUMDB="off"
	```
	[解法來源-issuecomment-546503518](https://github.com/golang/go/issues/35164#issuecomment-546503518)
* 若不想用第二種方式，可以用第三種設定 `go env -w GOPRIVATE="github.com/Yu-Jack"` 直接指定 repository 的位置即可，之後要移除可以透過 `go env -u GOPRIVATE`

目前這樣設置的方式就是去讀從 gihub clone 下來的程式，通常會被放在 GOPATH 的路徑 (pkg/github 裡面)  
但通常會有權限問題，所以只能讀取，那如果想要隨意優改的話可以這樣做 (這裡不考慮改權限)  


先把另一個專案 `github.com/Yu-Jack/go-hello` clone 到你想儲存的地方  
這邊假設存在 `/Users/{usernme}/Downloads/go-hello` 底下  
接著把剛剛的 `go.mod` 增加一行，去修改指向的位置，這邊就用絕對位置，但相對位置也是可以  
```
replace github.com/Yu-Jack/go-hello => /Users/{usernme}/Downloads/go-hello
```

接著嘗試修改 clone 下來的專案，[Github 原始程式碼](https://github.com/Yu-Jack/go-hello)如下  
可以修改一些字串後並重新跑 `go run main.go` 就會發現有成功吃到修改的部分  
```go
package hello

import (
	"fmt"
)

func Cool() {
	fmt.Println("hello") // 可以改成 fmt.Println("hello yujack")
}
```

## References 

[Can I work entirely outside of VCS on my local filesystem?](https://github.com/golang/go/wiki/Modules#can-i-work-entirely-outside-of-vcs-on-my-local-filesystem)