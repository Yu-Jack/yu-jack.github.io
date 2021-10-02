---
title: Rails Class/Module Autoloading 機制
categories: Ruby
date: 2021-10-02 16:46:06
tags: [ruby, rails]
header-img: /images/banner.jpg
catalog: true
---

## 前言 

在 Ruby 中如果要使用其他 class / module 是需要透過 require / load 去引用  

```ruby
# main.rb
require "./cool"
Cool.hi

# cool.rb
class Cool
    def self.hi
        pp "hi"
    end
end
```

但有在寫 Rails 的會發現，根本不用去 require / load 進來  
那是因為 Rails 中有一個特別的機制，叫做 [autoloading](https://rails.ruby.tw/constant_autoloading_and_reloading.html#autoloading-algorithms) 來幫忙解決這件事  
但 autoloading 是有對應的演算法和機制去找  
並不是在 rails 中任意新增檔案就可以觸發成功  
這篇文章就會稍微說明 rails 透過什麼樣的規則去找到對應的檔案  


## $LOAD_PATH

在提到 rails autoloading 之前，我們先來聊聊 `$LOAD_PATH`  
有發現我開頭的範例是用 `require "./cool"` 這種相對路徑的方式嗎？  
為何沒辦法使用 `require "cool"` 去引用呢？  

其實原因是 ruby 在用 require / load 的時候，會到 `$LOAD_PATH` 裡面找對應的檔案  
也就代表說，我可以把自己定義的路徑塞到 `$LOAD_PATH` 裡面，就可以直接用 `require "cool"` 的方式  

```ruby
# main.rb
$LOAD_PATH << Dir.pwd
require "cool"
Cool.hi

# cool.rb
class Cool
    def self.hi
        pp "hi"
    end
end
```

> 之前寫過 node.js 的原因，看到這裡還蠻熟悉的  
> require 不指定路徑也是直接到 node_module 裡面找  

但有一個要特別注意的點，也就是 ruby 會尋找在 class / module keyword 後面對應的字串  
也就是説，如果 `cool.rb` 的 class 是叫做 `CoolYo` 的話，就會噴出 `uninitialized constant Cool (NameError)` 這個錯誤出現  
可以嘗試用以下的 Code 去運行看看，就會發現有問題  
因為 ruby 預期的 claass / module name 應該是要跟檔案名稱一樣才對  

```ruby
# main.rb
$LOAD_PATH << Dir.pwd
require "cool"
Cool.hi

# cool.rb
class CoolYo
    def self.hi
        pp "hi"
    end
end
```

這就是核心概念，理解這個之後 Rails 中的 autoloading 就會更好懂了  


## autoload_paths

換到 rails 中，可以透過 config.autoload_paths 去定義  
但跟 ruby 不太一樣的是，rails 會預設幫你把一些路徑給加進去  
舉例來說 `app/*` `app/*/concerns` 這些路徑，會自動被加入  

## autoloading rules

接著我們來實際看例子來了解 rails autoloading 的規則

```ruby
module Admin
  class BaseController < ApplicationController
    @@all_roles = Role.all
  end
end
```

可以看到以上的程式中用到 `Role.all`，這裡的 Role nested namespace 會被解析成  

```ruby
Admin::BaseController::Role
Admin::Role
Role
```

這邊來快速解釋為何是以上那樣，其實直接用印出 `Module.nesting` 的內容就知道  

```ruby
module Admin
    class BaseController
        pp Module.nesting
    end
end
# [Admin::BaseController, Admin]
```

所以在 BaseController 裡面用到 Role 就會被接在 namespace 後面  
[Admin::BaseController::Role, Admin::Role, Role]  
接著會被對應到以下路徑  

```
admin/base_controller/role.rb
admin/role.rb
role.rb
```

接著就會用以上三個 path 配合 autoload_paths 去找到對應的檔案  
舉例來說預設 `app/model` 是我們的 autoload_paths，他就會到以下路徑去找 `role.rb`

```
app/model/admin/base_controller/role.rb
app/model/admin/role.rb
app/model/role.rb
```

所以可以反過來看  
如果我的檔案放在 `app/model/post/cool.rb` 底下，我的 class 要怎麼取才是正確的呢？  

就是叫做 `class Post::Cool` 即可，你改動 class 名稱、資料夾名稱或是檔案名稱，都會導致失效  
進而拿到 `NameError (uninitialized constant Post::Cool)` 的結果  

> 可以用 ./bin/rails console 進去後  
> 直接呼叫 Post::Cool 去測試，就知道有沒有 autoload 成功  

接著來看看 module 的話，通常會在 module 裡面定義 class  

```ruby
module Nice
    class Yo
    end
end
```

以上被解析成 `Nice::Yo`，所以可以聯想到檔案路徑必須為 `nice/yo.rb`  
至於我放在 `app/controller/nice/yo.rb` 或是 `app/model/nice/yo.rb` 都可以  
因為在 autoload_paths 裡面就有這兩個的路徑  

那如果我在 authoload_paths 加上 `app/model/nice` 的話  
當我使用 `Nice::Yo`，他的檔案配置要如何放置呢？  

答案是放在 `app/model/nice/nice/yo.rb` 裡面，但這樣很奇怪  
於是就會改成用 `Yo`，然後把多的 nice 改給刪掉  
變成 `app/model/nice/yo.rb` 就比較合理一點  

所以當你的資料夾如果有被涵蓋在 autoload_paths 底下的時候，就不需要把他當作前綴  

## 特別的規則  

有一項在 Automatic Modules 提到，當如果是使用 module 的話  
rails 不會強制你一定要建立檔案，而是資料夾名稱有對到即可  

舉例來說，建立 `app/model/nice` 資料夾， 接著使用 `Nice` 的時候，並不會錯誤  
rails 會幫你建置一個空的 Nice module 讓你去使用  

> 我不確定這功能可以幹嘛，但蠻特別的就順便介紹  

## 後記

以上簡單介紹了 autoloading 的一些規則，應該足以應付大部分的規則  
官方文件中還有蠻多詳細的說明，也可以建議讀官方文件更清楚唷！

## References

1. [autoload_paths](https://rails.ruby.tw/constant_autoloading_and_reloading.html#autoload-paths)
2. [Autoloading Algorithms](https://rails.ruby.tw/constant_autoloading_and_reloading.html#autoloading-algorithms)