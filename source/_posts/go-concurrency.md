---
title: Go Concurrency Patterns
categories: Golang
date: 2022-10-04 21:11:30
tags: [golang, concurrency]
header-img: /images/banner.jpg
catalog: true
---

## 介紹

這篇主要是前陣子讀完 Concurrency in Go 的一些心得。裡面提到很多關於 Concurrency 實作的一些技巧，讀完之後有特別實作出來，可以參考個人的 repository [go-concurrency-patterns](https://github.com/Yu-Jack/go-concurrency-patterns)。

以下是個人從書中擷取出來認為比較核心的技巧和觀念，本文不會提及太多 Patterns，詳細可以上面的 repository 看看唷！

## 核心技巧

書中提到的 Patterns 都是最大化利用 channel 的特性去達成。

先舉書中第一個 Generator Pattern 來做說明。可以發現以下 generateData function 是負責去建立和關閉 channel，而外面則是用 range 去讀 channel。

```go
func generateData() <-chan int {
	data := make(chan int)

	go func(data chan int) {
		for i := 0; i < 10; i++ {
			data <- i
		}

		close(data)
	}(data)

	return data
}

func main() {
	data := generateData()

	for d := range data {
		fmt.Println(d)
	}
}
```

其實這是利用了 channel 的兩特性而結合的一種 pattern

1. 不能向已關閉的 channel 進行寫入
2. 可以向已關閉的 channel 進行讀取

正是因為以上兩點，所以書中才會建議建立 channel 的人是要負責關閉的，而不是讀取又或是其他地方去關閉。以第 2. 點來說，透過 range 讀取 channel 的話，當 channel 被關閉時，是會跳出 range 這個 loop 的。即使不用 range，用 v, ok := <- data 中的 ok 也能夠知道 channel 究竟有沒有被關閉。

所以在讀取部分可以很大限度避免 panic 出現，而在寫入的部分更可以透過指定 function 回傳是只能讀的 channel，進而避免外面使用的人出現 panic 的情況。

## 核心觀念

核心觀念則是要防止 goroutine leak，因爲 goroutine 在 go 中其實是一個不太佔資源的東西，但是若只是因為他不佔資源，而隨意使用還是會造成很大的後果。

所以要如何正確關閉 goroutine 就變得非常重要，以最基本的就是透過 done channel 以及 timeout 去關閉 channel。

先從 done channel 來看看，舉下面例子來說，我從 channel 讀到一定數量想要跳掉，但我又不是建立 channel 的人，該怎麼去關閉呢？其實可以透過傳入 done 這個 channel 並讓裡面的 goroutine 使用 select 去監聽。透過這種方式的話，即使外面 function 沒有把 channel 讀完，只要透過 defer close(done) 的方式，確保外面 function 結束時一定會去關閉。

```go
func generateData(done <-chan struct{}) <-chan int {
	data := make(chan int)

	go func(data chan int) {
		defer close(data)

		i := 0
		for {
			select {
			case <-done:
				return
			case data <- i:
				i++
			}
		}

	}(data)

	return data
}

func main() {
	done := make(chan struct{})
	data := generateData(done)

	counter := 0
	for d := range data {
		fmt.Println(counter, d)
		counter++
		if counter == 5 {
			close(done)
			break
		}
	}
}
```

如果不關閉的話，就會一直卡在 data <- i 這邊，而裡面的 goroutine 永遠都不會結束。也就意味著，萬一這個 function 被呼叫一百萬次，而每次都是讀一半就結束然後不關閉的話，就會有一百萬個 goroutine 卡在那邊，這也是非常消耗資源的一件事情。

再來看看 timeout，其實也是類似的概念，只是把原本吧 select case <-done: 的地方換成 <-time.After(10 * time.Second)。這樣能夠預防萬一 generateData 執行太久，外面一堆 function 都在等著讀取，進而導致一堆 goroutine 排隊等著讀取的現象發生，就像呼叫一百萬次，結果這一百萬個都要等待 generateData 產完資料，這也是一件非常消耗資源的事情。

另外透過 timeout 也能盡量避免資源被吃掉的問題出現，但如果你是本身流量就很大那完全就是另一回事了。然後透過 timeout 也可以防止 deadlock 的問題出現，原因是有些資源會互卡，在互卡的情況下，如果不設置 timeout，就會永遠 pending 在那邊。當然不是說設定 timeout 是最佳解，只是一種預防程式掛掉的方式，實際還是得找為什麼資源會互卡這件事。

## 後記

個人還蠻推薦看這本書，這篇省略蠻多東西，但有把我覺得最重要的東西提出來。

另外有把書中提到的 Pattern 整理在 [go-concurrency-patterns](https://github.com/Yu-Jack/go-concurrency-patterns)，有興趣的可以讀看看。