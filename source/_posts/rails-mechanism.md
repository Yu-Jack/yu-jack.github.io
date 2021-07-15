---
title: Ruby & Rails 運行機制和 single or multi-thread 淺談
categories: Ruby
date: 2021-07-04 12:40:00
tags: [ruby, rails, Puma, GIL]
header-img: /images/banner.jpg
catalog: true
---
## 介紹

筆者在學習新的語言時  
在了解完語言的一些特色後, 會開始稍微研究此語言的運行機制  

以筆者最熟悉的 Node.js 來說  
一定會談論到 Node.js Event Loop  
像是 Node.js Event Loop 是 Single Thread, 但 Node.js 本身不是等等原理  
透過了解這些原理, 可以避免寫 code 的時候遇到一些問題  
舉例來說想在 Node.js 裡面 sleep 5 秒的話, 一定會搭配 Promise 的機制避免 Block Event Loop  

那這篇主要是淺談, 畢竟對 Ruby 這個語言還不深入  
也順便把這篇當作紀錄, 之後有更深的了解也會更新在這篇或挑主題深入說明  

此篇用的 Ruby 版本為 2.7 的版本  
尚未談論到 Ruby 3 引入的新機制, 這等筆者對 Ruby 有比較多的了解後再說了 XD  

## Ruby Single Thread?

Ruby 這個語言很有趣  
它是不是 Single Thread 是由它的 Interpreter 去決定的  
舉例來說 Ruby 有以下幾種 Interpreter  

1. MRI (Ruby 安裝後 Default 使用這個)
2. Jruby
3. Rubinius

等等很多, 這篇就不一一列出來  
根據不同實作方式, Ruby 的行為就完全會不一樣  

> 題外話: Python 也有 GIL  

以這個 example code 來看的話  

```ruby
require 'benchmark'

Benchmark.bm do |x|
  x.report('w/o') do
    10_000_000.times{ 2+2 }
  end

  x.report('with') do
    a = Thread.new{ 5_000_000.times{ 2+2 } }
    b = Thread.new{ 5_000_000.times{ 2+2 } }
    a.join
    b.join
  end
end
```

透過 Ruby 和 JRuby 去執行會得到兩個不一樣的結果  
Ruby 執行結果的時間兩者是一樣的  
JRuby 執行結果的時間是開 Thread 比較快  

這個原因牽扯到 MRI 裡面有一個 Global Interpreter Lock (GIL)  
簡單來說在 MRI 下, 每一次只會有一個 Thread 在運行  
所以你開兩個 Thread 的話, 並不是同時執行, 而是切換 Thead
很像是輪流去執行這兩個 Thread  

也就是說掌握 Lock 的 Thread 就掌握了執行的權利  
而剛剛提到切換的行為我們稱之為 Context Switching  

再來讓我們看一個例子
```ruby
require 'benchmark'

Benchmark.bm do |x|
  x.report('w/o') do
    items = []
    10_000_000.times{ items << 1 }
    puts "\n item length: #{items.length}"
  end

  x.report('with') do
    items = []
    a = Thread.new{ 5_000_000.times{ items << 1 } }
    b = Thread.new{ 5_000_000.times{ items << 1 } }
    a.join
    b.join
    puts "\n item length: #{items.length}"
  end
end
```

這個用 Ruby 和 Jruby 得到的結果也會不一樣  
Ruby (MRI): 兩者都會拿到 10000000  
Jruby: 沒開 Thread 會是拿到 10000000, 有開 Thread 每一次都拿不一樣  

原因也是因為 Ruby 有 GIL 的機制存在, 所以不會導致 race condition 出現  
但因為 Jruby 是真正以 mutil-thread 去執行, 所以就會出現 race condition 出現, 進而導致結果不一樣  
而如果想再 Jruby 裡面解決這件事情, 必須加上 Mutex 的機制去保證一次只會有一個 Thread 在處理共同資料  
類似以下方式就可以正常運作, 但如果你的 rails 是跑在多台機制上面, 就又會需要其他機制去處理共同資料問題  

```ruby
require 'benchmark'

mutex = Mutex.new

Benchmark.bm do |x|
  x.report('w/o') do
    items = []
    10_000_000.times{ items << 1 }
    puts "\n item length: #{items.length}"
  end

  x.report('with') do
    items = []
    a = Thread.new{ 
        mutex.synchronize {
            5_000_000.times{ items << 1 } 
        }
    }
    b = Thread.new{ 
        mutex.synchronize {
            5_000_000.times{ items << 1 } 
        }
    }
    a.join
    b.join
    puts "\n item length: #{items.length}"
  end
end
```

但是這個 Thread 如果是在操作 I/O (network, sql) 等等情況時  
Lock 會被釋放並讓其他 Thread 可以有執行的權利  
就可以達成很像平行化執行的感覺, 可以看看這個範例  

```ruby
require 'benchmark'
require 'uri'
require 'net/http'

uri = URI('https://google.com.tw')

Benchmark.bm do |b|
    b.report('w/o') do
        res1 = Net::HTTP.get_response(uri)
        res2 = Net::HTTP.get_response(uri)
    end
  
    b.report('with') do
        a = Thread.new{ Net::HTTP.get_response(uri) }
        b = Thread.new{ Net::HTTP.get_response(uri) }
        a.join
        b.join
    end
end
```

執行會發現有開 Thread 的那個明顯快上一倍的時間  
但這並不是因為他同時開兩個 Thread 去執行  
而是執行第一個 Thread 時, 發現是 I/O operation 所以把 Lock 釋放  
讓第二個 Thread 可以接著去運行  

> 這邊先多提到一點  
> 在 Ruby 2.7 下, Thread Model 是 1-1 (one-to-one) 的形式  
> 而這牽扯到作業系統的 User-Space Thread 和 Kernal-Space Thread  
> 這邊就先想成, 當 Ruby 開了一個 Thread 它就是到作業系統開了 Thread 去執行  
> 只是 Ruby 在有 GIL 的狀況下, 一次只會有一個 Thread 被執行  
> 而關於 User-Space / Kernal-Space Thread 則會另外說明, 目前並不會影響後續的閱讀  
> 但假如這篇是在講 Go 的話, 這一點就必須先說明, 否則會不好理解 Go 實作的原理  
> 有興趣可以看看筆者這篇 [Thread Model](/2021/07/14/thread-model)

那目前對 Ruby 的認知大概是這樣 (依舊在研究中 XD)  
這邊提供幾篇關於 GIL 的文章可以閱讀  

1. [The Ruby Global Interpreter Lock](http://ablogaboutcode.com/2012/02/06/the-ruby-global-interpreter-lock)
2. [Ruby 无人知晓的 GIL](https://ruby-china.org/topics/28415)
3. [[筆記] Threads in Ruby](https://medium.com/@jinghua.shih/筆記-rubys-threads-e746038b71c8)
4. [[筆記] Threads in Ruby (2)](https://medium.com/@jinghua.shih/筆記-threads-in-ruby-2-1ce404485a4e)

接著講到 Ruby 就一定要談談 Rails 的部分  

## Rails 包含哪些東西

這裡用 Rails 6 的預設去說明  
雖然我們都只講 Rails, 但其實它裡面還包含了很多不同層面的東西  
往下之前我們必須先定義好幾項名詞  

Rails 是一種 Web Framework, 並不是一個 Appliction Server  
而運行我們 Rails 程式的 Server, 我們會把它稱為 Application Server  

那 Application Server 是什麼呢?  
可以運行程式的商業邏輯並處理 HTTP 請求, 我們就可以稱之為是 Appliaction Server  

在 Rails 安裝的 gem 中裡面會看 Rack & Puma 兩個東西
* Puma 屬於 Application Server
* Rack 屬於一種中間件, 統一接口讓所有 Application Server 都能透過統一的 Interface 去跟程式溝通

所以到目前為止整體架構如下  

Ruby - 程式語言  
MRI - 實作 Ruby 底層運行的一種機制  
Rails - Web Framework  
Rack - 中間件, 統一接口讓所有 Application Server 都能透過統一的 Interface 去跟程式溝通溝通  
Puma - Appliction Server  

但有趣的地方在於, 我查了很多資料  
在 Puma 和 Heroku 官網說 Puma 是一種 Web Server  
在其他部落格或是 StackOverflow 中, 都會把 Puma 說是一種 Application Server  
不過就以我理解來說, 把 Puma 的定位想成 Application Server 會比較妥當  
在跟別人的討論過程中, 也有人提出因為 Application Server 也是 Web Server 的一種  
所以我在猜這應該是為啥 Puma 官網歸類在 Web Server 的原因  

那這裡定義的 Web Server 又是什麼呢?  
處理靜態檔案, 例如 Nginx / Apache 就非常適合這種應用, 它們也就屬於 Web Server 的範疇  
除此之外, Nginx / Apache 也很適合處理大量 Request  
並且可以當作 Reverse Proxy 把 Request bypass 到 Application Server  
也就是我們俗稱的 Load Balancer  

綜合以上會出現其中一種架構  
Nginx (Web Server) -> Puma (Appliaction Server) -> Rack -> Rails Appliaction  

可以參考以下文章

1. [A Web Server vs. an App Server](https://www.justinweiss.com/articles/a-web-server-vs-an-app-server/)
2. [Rails Server options](https://stackoverflow.com/questions/4113299/ruby-on-rails-server-options)
3. [Why do I need Nginx with Puma](https://stackoverflow.com/questions/50516699/why-do-i-need-nginx-with-Puma)
4. [Why Do We Need Application Servers in Ruby? (Like Puma)](https://www.rubyguides.com/2019/08/Puma-app-server/)
5. [Rack Explained For Ruby Developers](https://www.rubyguides.com/2018/09/rack-middleware/)
6. [Custom (400 / 500) Error Pages in Ruby on Rails -> Exception Handler (文章中間有提到 Rails 架構)](https://medium.com/ruby-on-rails-web-application-development/custom-400-500-error-pages-in-ruby-on-rails-exception-handler-3a04975e4677)


## Rails 機制

接著我們會說明 Rails 和 Puma 有哪些比較特別的機制

> 這裡目前還是以 Rails 和 Puma 官網的資料做整理  
> 若有我沒提到的部分, 非常歡迎留言, 我會再重新整理出新的內容  
> 不然目前只會以個人學習到的部分去做紀錄

Rails 針對每一個請求都會重新去 new 出一個 instance  
也就是你宣告在 Controller 裡的 instance 變數, 是只給當下的請求使用  
下一個請求拿到的資料就會是原本預設設定好的, 而不會跟前一個請求有相依性  

接著來說說 Puma 作為 Application Server 做了哪些事情

> Puma serves the request using a thread pool.  
> Each request is served in a separate thread,  
> so truly concurrent Ruby implementations (JRuby, Rubinius) will use all available CPU cores.
> Originally designed as a server for Rubinius, Puma also works well with Ruby (MRI) and JRuby.

依照官網說明, Puma 原本是被設計給 Rubinius 去使用的  
而這裡的 Rubinius 也就是我們提到, 透過不同的實作機制可以讓 Ruby 變成一個可以真正執行 multi-threads 的機制  
透過 Puma & Rubinius 組合, 就可以完全處理運用所有 CPU 資源  

至於 Ruby (MRI) 的話, 只要是處理關於 blocking I/O (例如 Network 相關的)    
Puma 則是會盡可能讓他們以平行化的方式完成  

不過這邊我們來看看一個高 CPU 運算的 rails 案例 (Puma min & max thread: 5)    
我定義一個 function, 並在 rails controller 去呼叫, `fib(37)` 大約花費 2 秒內

```ruby
def fib(n)
    return n if n < 2
    fib(n-2) + fib(n-1)
end
```

當我透過 Ruby (MRI) 去執行的時候, 同時開兩個網頁呼叫 URL  
得到的結果是, 兩個頁面都花了將近 4 秒以後才回傳回來  
其實這就是 GIL Context Switching 而造成的影響  
這裡也符合一開始我們 example code 的結果  

但如果 Puma 的 min & max thread 改成 1 的話  
第一個 request 會是 2 秒  
第二個 request 會是 4 秒  
因為 Puma 最多同時只能處理一個請求, 另一個請求就只好等前一個處理完畢  

如果要更詳細說明 Puma 機制的話  
每當有一個 TCP 請求近來, Puma 每一個 Worker 會有一條專門接收請求的 Thread  
這個 Thread 是單條且獨立於 Puma 中的 Thread Pool, 這裡把它稱之 Receive Thread  

每當 Receive Thread 讀取完請求後, 會把請求放入到一個 todo list 之中  
接著當 Thread Pool 裡面有 free/waiting Thread 就會撿去處理  

上面的流程是在 `queue_requests: true` 這個情況 (預設行為)  
若是為 false, 就會變成請求一進來直接被放入到 todo, 接著由 Thread Pool 去讀取請求  

> 更詳細的說明可以直接看 [Puma Architecture](https://github.com/Puma/Puma/blob/master/docs/architecture.md)  


## 後記

這篇說的東西有點多也有點雜, 有些東西也是輕描淡寫的帶過  
之後看到更深入之後, 應該會根據不同部分去做深入介紹  