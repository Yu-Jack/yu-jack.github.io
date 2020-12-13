---
title: TapPay Web SDK 串接 - @types/tpdirect 介紹
categories: Payment Gateway
date: 2020-12-12 13:27:29
tags: [TapPay, Payment Gateway, npm, types]
header-img: /images/banner.jpg
catalog: true
---

## 前言

非常非常久以前寫過一篇 TapPay 串接的文章  
但可惜的是 TapPay 沒有前端 npm 套件可以下載使用  
所以在串接前端的其實都不會有智能提示跳出來, 其實有點不方便  
於是就弄了一個 [@types/tpdirect](https://www.npmjs.com/package/@types/tpdirect)  

## 在還沒使用 @types 之前

就像下圖在寫 code 的時候是不會跳出任何提示  
這在撰寫程式起來其實是非常不方便的  

![](/images/tappay/tappay-01.png)
![](/images/tappay/tappay-02.png)

但由於 sdk 沒有 npm 可以下載, 但是定義檔這東西是可以自己做的  
於是筆者就做了一個定義檔發到 [@types/tpdirect](https://www.npmjs.com/package/@types/tpdirect)

## 用法  

先透過 `npm install @types/tpdirect --save-dev` 下載定義檔  
那這個 @types 帶來的好處是什麼?  
我們就直接上圖先來看結果吧！  
(此兩圖皆為在 vue script tag 下寫的)

![](/images/tappay/tappay-03.png)
![](/images/tappay/tappay-04.png)

沒錯, 透過定義檔在寫 JS 的時候, 就會有提示可以跳出來  
目前筆者在 vue, react, ts 以及純 js 裡面都是可以用的  
但環境的話, 目前是只有在 vscode 進行測試過  
不太確定其他 IDE 也能不能吃  

那 vscode 有一個快捷鍵式 command + i (mac command / windows control)  
假設在針對 function 要帶入的參數時, 只要先寫好 `{}` 並把鼠標停留在裡面  
接著按下 command + i 就可以跳出提示現在還剩幾個參數要帶入, 效果如下圖  

![輸入完 {}](/images/tappay/tappay-05.png)
![按下 command + i](/images/tappay/tappay-06.png)

但要注意的是, 裡面屬性和方法皆是由定義檔產生出來的
並不是根據 SDK 本身擁有的屬性和方法出現的
定義檔萬一定義 `methodA`, 但實際 SDK 是叫做 `methoda`
結果寫程式的時候, 因為提示跳了 `methodA`, 於是寫了 `methodA`
這樣等到實際執行的時候就會爆出錯誤說找不到 `methodA`
因為實際 SDK 擁有的方法是 `methoda`

## 後記

透過這種方式寫扣, 就可以很快地寫完  
但這種定義檔不是官方提供的, 還是得看有沒有其他人持續在維護  
那因為受惠 @types 蠻多的, 於是就起頭先建立一個  
希望這能幫到其他人  