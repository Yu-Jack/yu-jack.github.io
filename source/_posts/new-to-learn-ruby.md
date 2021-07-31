---
title: Ruby 初學者應該要知道的幾件事
categories: Ruby
date: 2021-06-20 12:40:00
tags: [ruby]
header-img: /images/banner.jpg
catalog: true
---

## 介紹

因近期工作關係會需要寫到 Rails, 所以開始學習 Ruby 這個語言  
這篇文章會列出個人覺得學習 Ruby 這個語言, 要先知道的幾樣東西以及符號  
內容比較適合學過一種語言的讀者  

## Function 執行

以個人經驗來說, 學習 Ruby 第一件讓我很困惑的地方就是關於 function 執行的方式  
在寫過的 JavaScript, Java, Go 三個語言中, 這是差異最大的地方  
在 JavaScript 定義 function 後去執行不外乎是這樣  

```js
function doSomething(thing) {
    console.log(`I'm doing ${thing}`)
}
doSomething("work")
```

在 Ruby 中也只是差在語法定義不同而已
```ruby
def doSomething(thing)
    puts "I'm doing #{thing}"
end
doSomething("work")
```

但最奇特的就是, Ruby 可以省略括號去執行
```ruby
doSomething "work"
```

這也是我學習 Rails 看到 `config > router.rb` 第一個覺得困惑的點
```ruby
get 'welcome/index'
```

接著看到這裡我就反問
那兩個參數是不是也可以不用括號
答案是對的, 加一個逗號去分開就好
```ruby
def doSomething(thing1, thing2)
    puts "I'm doing #{thing1} and #{thing2}"
end
doSomething "work1", "work2"
```

接著除了一般參數, 接著另一個疑問就來了  
在寫 JS 有時候參數會想帶 JSON 的結構進去, 那在 Ruby 又怎麼做到?  
實際上使用會是這樣, 而在 Ruby 中會把 thing 稱之為 [Hash](https://en.wikibooks.org/wiki/Ruby_Programming/Syntax/Literals#Hashes)  
```ruby
def doSomething(thing)
    puts "I'm doing #{thing[:thing1]} and #{thing[:thing2]}"
end
doSomething(thing1: "work1", thing2: "work2")
doSomething thing1: "work1", thing2: "work2"
doSomething :thing1 => "work1", :thing2 => "work2"
```

混在一起就可以這樣寫
```ruby
def doSomething(name, thing)
    puts "I'm #{name} and doing #{thing[:thing1]} and #{thing[:thing2]}"
end
doSomething("Jack", thing1: "work1", thing2: "work2")
doSomething "Jack", thing1: "work1", thing2: "work2"
doSomething "Jack", :thing1 => "work1", :thing2 => "work2"
```

但如果後面還有參數就記得一定要加大括號
```ruby
def doSomething(name, thing, time)
    puts "I'm #{name} and doing #{thing[:thing1]} and #{thing[:thing2]} in #{time}"
end
doSomething("Jack", {thing1: "work1", thing2: "work2"}, "today")
doSomething "Jack", {thing1: "work1", thing2: "work2"}, "today"
doSomething "Jack", {:thing1 => "work1", :thing2 => "work2"}, "today"
```

接著另一個有趣的事, 在 ruby function 定義中   
你不寫 return 的話, 預設是會回傳最後一行產出的結果  
```ruby
def testgogo
    100000
end
num = testgogo
puts num.class

## 同等於下面

def testgogo
    return 100000
end
num = testgogo
puts num
puts num.class
```

## Block

在 Ruby 裡面有一個很特別的方式  
在執行 function 的時候, 可以多帶入 `{}`, 並在裡面寫下程式  
以下面的例子, 在執行 doSomething 的時候, 會先到 doSomething 的程式區塊中去執行  
但執行到 `yield` 的時候, 會把程式的控制權轉交給執行 doSomething 時代入的 `{}` 之中  

```ruby
def doSomething
    puts "start"
    yield
    puts "end"
end

doSomething {
    puts "this is block content"
}
# 同等下方
doSomething do
    puts "this is block content"
end
```

在 Ruby 中把 `{}` & `do...end` 稱之為 Block  
然後在學 Ruby 剛開始可能都會看到這個例子去跟你介紹 Ruby
```ruby
5.times {
    puts "哈囉，世界"
}
```

這個要自己土炮的話, 概念也是用到 Block + `yield` 去實作
```ruby
def my_times(n)
    i = 0
    while n > i
        i += 1
        yield
    end
end
  
my_times(5) {
    puts "哈囉，世界"
}
# 同等於以下
my_times(5) do
    puts "哈囉，世界"
end
```

除了轉交控制權之外, 也可以傳遞參數出去
```ruby
def doSomething
    puts "start"
    yield "Jack"
    puts "end"
end

doSomething { | name |
    puts "this is block content with paramters #{name} from doSomething"
}
```

這裡會看到 `||` 這個符號, `name` 在 `||` 裡面  
代表 name 是在這個 Block 範圍裡面的區域變數, 離開 Block 之後就失效了  
當然這只是簡單的介紹, 更難一點的還有針對 `do...end` & `{}` 有優先順序的差別

## Class & Instance Method

接著我們要介紹的是 `<<` 在 Ruby 的 Class 裡面代表的意義  
讓我們先看看在 JS 中如何去寫 class  
雖然 JS 的 class 不是真的 class, instance 也不是真的 instance  
但為了方便介紹, 先以 JS 先舉例  
在 JS 中要為 class 寫一個 method 通常都會用到 static 去表示  
如果去掉 static 就代表是 instance method, 也就是 new 出來後的物件才可以執行

```jsx
class Work {
    static show() {
        console.log("class method")
    }
    instanceMethod() {
        console.log("instance method")
    }
}

Work.show()
const work = new Work()
work.instanceMethod()
```

在 Ruby 中也有一樣的概念
```ruby
class Work
    def instanceMethod
        puts "instance method"
    end

    def self.show
        puts "class method"
    end
end

Work.show
w = Work.new
w.instanceMethod
```

這邊就是用 self 去表示 class method  
但 self 根據不同上下文會出現不一樣的值，可以看下方的例子  

```ruby
class Work
    def test
        puts self
    end
    def self.gogo
        puts self
    end
end
Work.new.test # 這裡會是 instance 本身
Work.gogo # 這裡會是 class 本身
```

那因為有分成 class & instance scope  
所以執行上要注意一下不同 scope 的情況，例如以下情況  
```ruby
class Work
    def test
        puts self
        gogo # 雖然這裡和『下面』都叫 gogo，但對到的地方是不同的
    end
    def self.test
        puts self
        gogo # 雖然這裡和『上面』都叫 gogo，但對到的地方是不同的
    end
    def gogo
        puts "this is instance gogo"
    end
    def self.gogo
        puts "this is class gogo"
    end
end
Work.test
puts "================"
Work.new.test
```

另外比較特別的是, 上面可以用 `<<` 去改寫變成  
```ruby
class Work
    def instanceMethod
        puts "instance method"
    end

    class << self
        def show
            puts "class method"
        end
    end
end

Work.show
w = Work.new
w.instanceMethod
```

除此之外, `<<` 可以用在擴充 instance method (也可稱為 singleton method)  
但注意, 像最後一行去針對 w1 去執行 `instanceMethod2` 是會出錯的
```ruby
class Work
    def instanceMethod
        puts "instance method"
    end
end

w1 = Work.new
w2 = Work.new
w1.instanceMethod

class << w2
    def instanceMethod2
        puts "instance method2"
    end
end

w2.instanceMethod2 # 這個會成功呼叫
w1.instanceMethod2 # 這個會報錯
```

雖然這裡是講 class & instance method, 但 `<<` 除了在這個地方可以使用  
其實還可以用在 array append 上面, 像是這樣
```ruby
a = [1]
a << 2
p a
```

想看更多其他應用的部分, 可以直接參考 [What does << mean in Ruby?](https://stackoverflow.com/questions/6852072/what-does-mean-in-ruby)

## Class Inherit & Namespace

接著談到 Class Inherit & Namespace, 最常看到兩種符號  `<` & `::`   
先來談談 `<` 這個符號, 這其實就是繼承
```ruby
class Animal
    def run
        puts "run"
    end
end

class Dog < Animal
end

dog = Dog.new
dog.run
```

但在 rails 的 controller 第一行卻會看到 `::` 出現在 `ActionController::Base`
```ruby
class ApplicationController < ActionController::Base
end
```

在 Ruby 中, class 和 module 是可以用巢狀結構包起來的  
要存取 裡面的 class / module 時, 就會需要用到 `::` 去存取
```ruby
class Utility
    class Flyable
        def fly
            puts "fly"
        end
    end
end

flyable = Utility::Flyable.new
flyable.fly
```

除了 class 也可以用在 module
```ruby
module Utility
    module Flyable
        def fly
            puts "fly"
        end
    end
end

class Cat
    include Utility::Flyable
end

cat = Cat.new
cat.fly
```

當然也可以 module & class 混著用
```ruby
module Utility
    class Flyable
        def fly
            puts "fly"
        end
    end
end

class Cat < Utility::Flyable
end

cat = Cat.new
cat.fly
```

透過以上巢狀包起來去使用, 其實就是達到 Namespace 的一種使用方式  
看到這裡有人會問 module & class 之間的差異  
建議可以直接看看 5xRuby 裡面的一篇文章[要用繼承還是要用模組？](https://railsbook.tw/chapters/08-ruby-basic-4.html#%E8%A6%81%E7%94%A8%E7%B9%BC%E6%89%BF%E9%82%84%E6%98%AF%E8%A6%81%E7%94%A8%E6%A8%A1%E7%B5%84%EF%BC%9F)

## Lambda & ->

Lambda 是一種 anonymous functions, 在 Ruby 裡面是這樣使用
```ruby
run = lambda {
    puts "run"
}

run.call
```

但在 Ruby 裡面可以用另一種寫法, 用 `->` 這個符號
```ruby
run = -> {
    puts "run"
}

run.call
```

## & operator in Proc

在 Ruby 時常會看到一些這樣的用法

```ruby
names = User.all.map(&:name)
# 同等於
names = User.all.map { |user| user[:name] }

p = Proc.new { |x| puts x * 2 }
[1, 2, 3].each(&p)
# 同等於 
[1, 2, 3].each{ |x| puts x * 2 }
```

此時會看到一個很特別的 & 的符號  
但在這並不是像某些語言是 pass-by-reference 的意思  
& 在這是指傳遞 Lambda or Proc 來使用, 所以可以延伸出一些簡短的縮寫方式  
而使用 & 的時候, 會把 Block 轉成 Proc 去使用  
也就代表這中間, 會去呼叫 `to_proc` 這個 method  
我們透過自定義的 method 來實驗一下

```ruby
class GGG
    def to_proc
        puts "gggg"
        Proc.new {
            puts "cool"
        }
    end
end


def gogo(&blockd)
    blockd.call
end

ggg = GGG.new
gogo(&ggg)
```

在上面的範例中我自己定義的 `to_proc` 的 method, 並回傳了 Proc 的實體回去  
而我們一開始上面看到的 `(&:name)`, 其實是在 Symbol 裡面有定義 `to_proc` 的實作方式  
透過 `:test.methods` 去看看印出來的 method 就會知道  
可以參考 [What does map(&:name) mean in Ruby?](https://stackoverflow.com/questions/1217088/what-does-mapname-mean-in-ruby)

更多詳細關於 Proc Lambda Block & 用法, 可以看 [Ruby 中的 Block、Proc、Lambda 是什麼？](https://riverye.com/2019/11/15/Ruby-%E4%B8%AD%E7%9A%84-Block%E3%80%81Proc%E3%80%81Lambda-%E6%98%AF%E4%BB%80%E9%BA%BC%EF%BC%9F/)

## attr_accessor, private, public, protected

在寫 Ruby 時, 常常會看到標題這幾個字樣出現  
但在 Ruby 裡面, 這並不是關鍵字, 而是一種 method  
這裡可以看到 Ruby 裡面真正有的 [keywords](https://docs.ruby-lang.org/en/3.0.0/doc/keywords_rdoc.html) 有哪些 (這邊提供 3.0.0 版本)  
但這樣就很特別, 因為如果是 method 的話, 代表是我在宣告 class 時是可以執行其他 function

> 其他版本可以參考 https://docs.ruby-lang.org/en/

```ruby
class Cat
    puts "gogo"
    def run
        puts "run"
    end
end
Cat.new.run

# 除了上面這樣執行, 也可以額外宣告 class method 直接去使用

class Cat
    def self.gogo
        puts "gogo"
    end
    def run
        puts "run"
    end
    gogo
end
Cat.new.run
```

這跟寫 JS 和 Java 有很大的不同, 為何在定義 class 的時候就可以執行程式呢?  
其實在 class 這個定義中, 跟其他區塊一樣可以直接執行程式的區塊, 差別在 self 指向這個 class 而已  
而定義在這區塊中, 當 class 被 loaded 之後, 只會執行一次, 更多詳細內容可以參考以下文章
1. [Ruby Method calls declared in class body](https://stackoverflow.com/questions/1344797/ruby-method-calls-declared-in-class-body)
2. [point 4: Class Bodies Aren't Special.](https://yehudakatz.com/2009/08/24/my-10-favorite-things-about-the-ruby-language)
3. [Method Calls in Ruby Class Definitions](https://joefallon.net/2013/10/method-calls-in-ruby-class-definitions/)

## rescue Exception => e

雖然這只是語法差別, 從原本的 `try-catch` 變成 `begin-rescue`  
但比較特別的地方是, 可以透過 `=>` 把 Exception assign 到一個 local variable 裡面
```ruby
begin
    asdasd
rescue Exception => e
    puts e.message
end
```

這個 e 就只會存在這個 scope 裡面  
不過我找了很多資料, 看來這是唯一一個特殊用法  
rescue 的 `=>` 跟 hash 的 `=>` 意義不太一樣  
不過這邊提一下, 雖然邊提示用 Exception, 但是 Ruby 裡面並不推薦全部都用 Exception Handle 唷  
另外若有人知道為啥 resuce ⇒ 用法這麼特別, 拜託再跟我說一下 XD

## 後記

這篇文章主要紀錄 Ruby 語言特有的一些符號和用法  
從其他語言轉換過來的話, 個人覺得先理解這先東西可以幫助更快速學習 Ruby 這個語言  
若有其他文章沒提到的, 歡迎各位底下留言告訴我, 謝謝！

接著理解一些特出語法之後, 可以開始搜尋 ruby best practice 了解哪一些寫法是更好的

## References

* [What does << mean in Ruby?](https://stackoverflow.com/questions/6852072/what-does-mean-in-ruby)
* [要用繼承還是要用模組？](https://railsbook.tw/chapters/08-ruby-basic-4.html#%E8%A6%81%E7%94%A8%E7%B9%BC%E6%89%BF%E9%82%84%E6%98%AF%E8%A6%81%E7%94%A8%E6%A8%A1%E7%B5%84%EF%BC%9F)
* [What does map(&:name) mean in Ruby?](https://stackoverflow.com/questions/1217088/what-does-mapname-mean-in-ruby)
* [Ruby 中的 Block、Proc、Lambda 是什麼？](https://riverye.com/2019/11/15/Ruby-%E4%B8%AD%E7%9A%84-Block%E3%80%81Proc%E3%80%81Lambda-%E6%98%AF%E4%BB%80%E9%BA%BC%EF%BC%9F/)
* [keywords](https://docs.ruby-lang.org/en/3.0.0/doc/keywords_rdoc.html)
* [Ruby Method calls declared in class body](https://stackoverflow.com/questions/1344797/ruby-method-calls-declared-in-class-body)
* [point 4: Class Bodies Aren't Special.](https://yehudakatz.com/2009/08/24/my-10-favorite-things-about-the-ruby-language)
* [Method Calls in Ruby Class Definitions](https://joefallon.net/2013/10/method-calls-in-ruby-class-definitions/)  
* [Self in Ruby: A Comprehensive Overview](https://airbrake.io/blog/ruby/self-ruby-overview)