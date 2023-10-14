---
title: openSUSE Tumbleweed 和 NVIDIA Driver 安裝紀錄
categories: openSUSE
date: 2023-10-14 23:47:41
tags: [openSUSE]
header-img: /images/banner.jpg
catalog: true
---

## 前言

這篇主要來講解安裝 openSUSE Tumbleweed 和在上面安裝 NVIDIA Driver 的紀錄，這篇不會針對這個 OS 做太多的解釋。

整體安裝大綱大概如下
- 安裝 OS
- 如何備份
- 安裝繁體中文語系
- 安裝 NVIDIA Drive
- 設定聲音
- 設定 Clicking 行為


## 安裝 OS

到 openSUSE 官網下載 iso 檔案後就是製作開機 USB，網路上蠻多資源的，我個人是用 [rufus](https://rufus.ie/zh_TW/) 去製作的。

這部份安裝倒是蠻簡單的，不過建議語系先選擇英文，系統上比較不會有問題。原因是我後續在安裝顯卡驅動的時候，因為資料夾在 Downloads 底下加上我一開始傻傻的選繁體中文，最後在 init 3 下去安裝驅動就出現亂碼問題，後來改成英文就正常多。

## 如何備份

因為筆者在嘗試後面不同的設定時，來來回回重灌蠻多次，後來才發現有一個 snapper 可以備份，基本用法如下：

- 建立備份： `snapper create -d "describition you want to mention"`
- 列出備份： `snapper list`
- Rollback： `snapper rollback [number from snapper list]`

有這個東西就算後續 NIVIDA 安裝有問題，沒辦法用 GUI，也可以直接用上面指令 Rollback！

## 安裝繁體中文語系

當用英文語系安裝完成之後，是沒辦法打中文以及中文字顯示會怪怪的，所以需要安裝中文字體，這裡我用了兩個方式去下載。

- 第一個是透過 YaST Language 裏面去第二語系勾選繁體中文。
- 第二個是到 [Google Noto Sans Traditional Chinese](https://fonts.google.com/noto/specimen/Noto+Sans+TC) 去把字型下載下來

兩個都搞定之後，從電腦上看的字就跟之前差不多了，重開機會就會有 gcin 可以使用，用法就是透過 ctrl + space 去做切換。不過因為我是同時並行，所以不確定只用第二種會不會有效。

## 安裝 NVIDIA Driver

這步驟非常麻煩，但基本上式參照 openSUSE 這篇 [SDB:NVIDIA the hard way](https://en.opensuse.org/SDB:NVIDIA_the_hard_way) 文章去安裝。

看到這邊可能會問說怎麼不用 openSUSE 這篇 [SDB:NVIDIA drivers](https://en.opensuse.org/SDB:NVIDIA_drivers) 教學去安裝呢？

原因是弄完就只剩黑屏和一個屬標在那裡了 ... 不確定壞在哪裡，後來只能用 the hard way 去裝起來。

### 到 Nvidia 官網下載驅動

請到 https://www.nvidia.com.tw/Download/index.aspx?lang=tw 下載驅動程式。

如果不知道自己的型號，可以透過 `lspci | grep VGA` 了解。

### 安裝必要程式

再來透過 `zypper install devel_kernel` 要建置驅動的工具，如果不行的話，可以改用 YaST Software Management 裏面去搜尋並勾選按接受去下載。

### 禁用 nouvea

因為 Nvidia 會跟內建的 nouvea 打架，所以要先禁用 nouvea 才可以。

我的作法是到 YaST Boot Loader > Kernel Parameters 裏面去新增 `nomodeset 3`，不過要注意這樣新增完之後，重開機會進入 `init 3` 也就是純 CLI 的介面下，如果要回去原本 GUI 可以透過 `init 5` 回到 GUI。

![](/images/opensuse-installation/yast_boot_loader.png)

設定完之後接著重新啟動即可。

### 開始安裝驅動

重開機後會進到 CLI 介面下，這時候用 `sh /home/<username>/Downloads/NVIDIA*.run` 去安裝即可，這步驟有可能會遇到幾個問題。

1. no gcc： 代表你前面 kernel 那邊沒裝好。
2. blacklist existed： 代表你可能先參照其他教學自己設定 nouvea blacklist，不過照理說這不影響，最好是先把自己設定的砍光，因為他本來就會幫你建立。

裝完之後，重開機一樣會到 CLI，這時候輸入 `init 5` 照理說是可以正常進入到 GUI 畫面的，接著輸入 `nvidia-settings` 發現有東西跳出來就沒問題。

這時候如果你有外接螢幕，應該會發現是不能使用的，所以接下來要先搞定這件事

### 設定 Xorg Configuration

接下來的步驟就是參照 https://en.opensuse.org/SDB:NVIDIA_the_hard_way#Xorg_Configuration_for_Optimus_Setups 這裡去新增檔案，以防萬一這裡做一個備份。

請到 `/etc/X11/xorg.conf.d/` 底下新增 `10-nvidia-drm-outputclass.conf` 並輸入以下內容。
```
 Section "OutputClass"
   Identifier "intel"
   MatchDriver "i915"
   Driver "modesetting"
 EndSection
 Section "OutputClass"
   Identifier "nvidia"
   MatchDriver "nvidia-drm"
   Driver "nvidia"
   Option "AllowEmptyInitialConfiguration"
   Option "PrimaryGPU" "yes"
   ModulePath "/usr/lib/nvidia/xorg"
   ModulePath "/usr/lib/xorg/modules"
 EndSection
```

### 設定 NVIDIA modesetting

回到原本的 YaST Boot Loader 的參數，把原本 `nomodeset 3` 給拿掉，並新增 `nouveau.modeset=0 nvidia-drm.modeset=1`，接著重新開機就可以了。
![](/images/opensuse-installation/yast_boot_loader_2.png)


正常情況下 novouea 應該不會啟用，所以透過 `lsmod | grep nouveau` 會發現應該不會有任何輸出結果，而透過 `lsmod | grep nvidia` 會有東西出現。

## 設定聲音

在 YaST Boot Loader 增加 `snd_hda_intel.dmic_detect=0` 重開機就會有聲音。

## 設定 Clicking 行為

因為預設是 one click opens items，但個人習慣上是雙擊，這部分可以到 WorkSpace General Behavior 去做調整，但這個路徑取決於 KDE Plasma 的版本，所以也許哪天這個又換了也不一定。

## References

- https://forums.developer.nvidia.com/t/nvidia-geforce-gtx-1650-no-external-monitor-not-detected-in-xrandr-opensuse-leap-15-3/215296
- https://forum.suse.org.cn/t/topic/14193/9
- https://en.opensuse.org/SDB:NVIDIA_the_hard_way