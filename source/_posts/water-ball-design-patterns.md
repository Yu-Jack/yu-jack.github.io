---
title: 水球潘 (水球學院) - 軟體設計模式精通之旅心得
categories: Modeling
date: 2023-06-28 11:47:41
tags: [design patterns, OOA, OOD, OOP]
header-img: /images/banner.jpg
catalog: true
---

## 前言

會接觸到這個是前同事介紹的，當時他跟我介紹是跟 OOAD 的部分，我一直都對這塊蠻感興趣的。以前開發功能大多是用文字配合 draw.io 去畫畫圖，沒有特別 follow UML 的畫法或是 OOAD 的思考脈絡，基本上這樣功能也是能實作出來。而設計面就配合文字和腦袋思考給記錄下來，看有沒有需要重新設計程式的部分，然後再補到原本的圖上。

但這樣的問題會是圖沒有 follow 比較統一的規則，後續讀的人會比較辛苦。而這個課程吸引我的點是會教如何以 OOAD 的思路去看待一份需求，並用 UML 畫出來。這帶來一個好處，透過統一規則，別人要看懂也會很快就能讀懂，就算看不懂的人，只要說明一些 UML 規則也很快就能上手，這部分就跟 DDD 裡面提到的 Ubiquitous Language 是類似的概念。

簡而言之，這堂課我是為了學習如何以 OOAD 的思考去開發功能，原本想說 Design Patterns 的部分就當作複習，順便換個用 Composition 為主的 Golang 熟悉 Design Pattern 也是不錯。不過實際上了之後，有發現自己對於一些 Design Pattern 的使用原因不到很精通，所以整體來說算有幫助到我更加釐清。只是這篇心得文上不會著墨太多 Design Patterns 的部分，還是會說明 OOAD 這塊比較多。

這篇文章不會帶入太多教學的內容，而是目前課程大約上了 60~70% 的一些心得和有在社群討論過的一些想法。

## 心得一：影片 x 文章 x 社群 x Review

整體在用影片學習上我覺得很不錯，一個很大原因是影片的教學都有把重點都呈現出來，內容上也很清晰，所以在學習上其實沒有太大問題。而有些需要補充影片內容的部分，會透過文章的方式額外開放出來，也可以把想法拋到社群裡面討論。最後再透過每週 Code Review 去互相探討 OOAD 的思路以及最後 OOP 有沒有遇到什麼困難，除此之外，網站也會提供 Java 版本的詳解讓你參考，整體來說是有學習到東西的。

## 心得二：OOAD 有用嗎？要畫很完善嗎？

以個人角度來說是有用的，不過不學 OOAD 你還是有辦法開發功能。就像不學武功你還是能打人，但學了武功你知道怎麼打得更有效率更痛。總之最重要的一點是以圖像方式輔助你理解需求這點，再透過 OOAD 關注各階段要注意的部分，讓你能夠專心處理。

再來換一個例子解釋 OOAD，以裝潢為例，在真正裝潢之前，都會丈量和瞭解客戶喜好的步驟，也就是去釐清這間房子的所有規格，之後再根據這個規格去做設計。

丈量後就會發現 (其實實際在量就會發現) 有些房子就很奇怪，梁就很厚、廚房有夠大或是客廳太小等等奇怪的限制，這時候客戶和設計就需要一起討論，類似客戶：「我家想弄工業風可以嗎？」設計師：「這邊距離比較短加上你家不透光，可能不能用常用的工業風的裝潢，不然會太暗，這部分需要調整一下」或是設計師：「你早上習慣做些什麼生活習慣，這樣我裝潢設計才可以符合你的習慣？」，而這些目的當然就是要裝潢一個漂亮和住的舒服以及實用的家。

其實 OOAD 和 Design Patterns 也是如此的概念，我們需要盡可能釐清需求方提出來的東西，就像做丈量和詢問客戶的生活習慣，所以他是一個雙向的互動，而釐清需求和了解限制之後，就可以針對有限制的部分做設計。而做設計這件事本身就是基於某一種限制而去處理這個限制的一種行為。

然而，如果在沒有釐清有哪些限制和需求的情況下設計，反而會導致設計出來的東西往往不符合使用者需求。就可能會變成設計師本身喜歡度假村風，就一直狂推度假村風給妳，在你拒絕後且還不等你開口前，卻又推了度假村風 b' 給你，但你壓根就是不喜歡度假村風。而這邊回到 Design Pattern 的話，可能會變成一個只會 A pattern 的人在搞不清楚狀況下，狂使用 A patterns 的狀況一樣，所謂拿著錘子看什麼都像釘子。

另外前面提到，在丈量的當下就會知道這些限制是很常見的，而這些都有常用的作法可以解決，可能在進入到跟客戶討論環節之前你大概就知道要會有什麼問題，這就是靠業界長久累積下來的經驗，如同 Design Patterns 。 

回到正題，所以 OOA 關注的是行為，而有些太詳細行為不一定要用 UML 的方式呈現，可以用文字標注在旁邊。最後會產出一份所謂的領域模型 (Domain Model)，這個階段不會有任何設計或是程式細節出現，也不介意要用資料庫還是檔案等等細節的部分。捕捉物件的行為就是 OOA 階段最重要的事情，而同時會觀察到需求給你了哪些 forces，迫使你在 OOD 的時候必須要考量這些 forces 進行設計。

> 這裡的 forces 可以想像成一種壓力，也許是客戶提需求的時候特別要求又或是跟同事討論發現這邊會有潛在問題，例如不好擴增不好閱讀等等，種類繁多是沒有詳細定義和規則的。

OOD 關注的是設計，會依照 OOA 觀察到的 forces 去決定需要套用哪種 Design Pattern。另外我個人在 OOD 會簡單帶入思考程式流程上有沒有問題，但不會思考過於細節的部分，因為重點在於設計，而不是程式開發。

目前依照我完成的例子來說，OOAD 大部分囊括我實作的 80%，剩下就是一些程式細節沒有在圖上需要額外處理的部分。而在 OOP 階段發現當時 OOAD 有誤，再回頭修正 OOAD 其實就可以了，但就是要記住「什麼原因促使你在 OOP 階段發現 OOAD 有誤』，這樣在下次 OOAD 就能儘早發現問題所在。

透過 UML 的方式去視覺化呈現需求，對於開發者來說是非常有幫助的。不過其實也不一定要用 UML 去畫，只要能夠視覺化呈現出來，並讓大家有統一的共識，其實用什麼工具都不是問題。這點其實就像 System Thinking 的模板類似，透過視覺化幫你釐清遇到的問題，以更高的視角去俯視整體。

## 心得三：OOD 特化成語言專用？

這點是有在 Discord 討論過，因為我寫 Golang 的關係，所以很多繼承地方會想轉用介面的方式去畫 OOD。但其實按照 OOD 的概念來說需要的是統一語言，也就是說其實不需要特別為了 Golang 去畫出 Golang 版本的 OOD。以 High Level 來說，這張圖不管到什麼語言他應該都要能通用。以 Golang 來說，進到實作階段再自己重新進行 mapping 其實就足以。

> 不過其實最終也能交給團隊決定要不要畫成 Golang 版本。如果太過執著使用方式是不是對的，可能會反而導致團隊協作不順，重點應該擺在能夠促使團隊合作順利這件事上。

## 心得四：題目出的不錯

目前整題進度算是 60~70% 都放在 [Github](https://github.com/Yu-Jack/water-ball-missions)，覺得好玩的題目是大老二和寶藏地圖。其實開發程式久了都知道，除了程式開發是一種挑戰，需求分析也是一個難題。這些題目的難度對我來說都算剛好，有複雜有簡單的地方，但不至於太難。只要掌握前面 OOAD 分析的思路，其實很快都可以完成。

舉例來說有一個題目是大老二，在 OOA 階段下會簡單描述一些判斷行為，就可以發現圖中 `Player` 的 `play()` 有列出潛在的問題，這部份是題目有要求未來會擴充更多牌型。就代表在 OOA 階段要把這點給列出來，這樣在 OOD 階段就可以針對這個 force 處理。

![](/images/water-ball/big2_ooa.png)

所以在 OOD 階段就可以針對判斷多種牌型做設計，以這個例子來說就是利用 CoR 去處理判斷這件事，所以 OOD 圖出來就會長這樣。

![](/images/water-ball/big2_ood.png)

最後對應到程式就是變這樣。

<script src="https://emgithub.com/embed.js?target=https%3A%2F%2Fgithub.com%2FYu-Jack%2Fwater-ball-missions%2Fblob%2Fmain%2F2_Boss_big2%2Finternal%2Fdomain%2Fcard_pattern%2Fvalidator_handler.go&style=github&showBorder=on&showFileMeta=on&fetchFromJsDelivr=on"></script>

我知道上面跳的有點快，所以在這邊多補充一些思路，最主要的原因就是在 OOA 階段發現了行為變動性的存在以及需求的壓力，我們會有很多不同種牌組合會形成多種牌型，而我們要做的是去判斷牌型且在不能違反 OCP 的原則下去做 Design。那因為每一種牌型基本上對應到一種需求，所以這個現階段適合的做法就是用 CoR 去解決這個壓力。

基本上題目都有蠻多限制去規定哪裡要有 OCP 存在或是一定要按照什麼規則進行，以規則來說像是剛剛大老二有限定說一定只能出同樣的牌型。雖然實際上我們在玩的大老二是有所謂壓牌的概念，類似同花順可以壓所有牌型。但你不能因為你習慣這樣玩，就不照題目開發，因為這代表你忽視了客戶的需求。除非你問客戶他說可以壓牌，你才可以開發壓牌版的大老二。而以程式擴充性上有要求在新增牌型時不能破壞核心程式碼，換句話說就是在新增牌型的情況下，只需要新增一個檔案且在 Client 端把這個新的牌型加入進來即可，剩下核心程式碼完全不能動。

不過在真實開發環境下，其實不會有人跟你說哪邊要遵守什麼，所以題目這樣同時是優點也是缺點。這不能太依賴別人告訴你，而是在 OOA 階段的時候發現這些問題，並進而去詢問 PM/PO 有沒有擴增可能性，或是找其他 RD 討論有沒有需要先留後路。這很看當下的 context 決定的有沒有潛在的 forces，而這也很吃開發經驗，這就需要多寫扣去察覺了。

## 其他心得

1. 當時開始寫題目的時間點有非常非常多的人排隊，導致每個人 review 的時間頂多 5 分鐘，其實根本不夠。但目前比較少人的情況，平均一個人可以拿到 15~20 分鐘 review 時間就可以討論很多細節，這點未來似乎會引入助教幫忙協助處理。
2. 畢竟課程是長達半年的時間，所以其實當有問題拋出來的時候，不太會在很短時間內有人回覆你，畢竟大家也是在上班。會需要預期你的問題拋出來討論的時候，可能會是 1~2 天後才會有人跟你討論。
3. 雖然沒有規定要用什麼語言撰寫，但如果是用天生有 OO 概念的語言的話，在學習整個課程會比較便利點。因為不用最後一段把 OOD 在實作時轉成像是 Golang 比較特別的寫法。

## 後記

對我來說多學習不同 modeling 方法是有助於開發的，這樣我能透過每一個方法的不同角度，更深入地了解到事情的全貌。

<style>
    .emgithub-container code.hljs {
        color: unset;
        background: unset;
        line-height: 18px;
    }
</style>