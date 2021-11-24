---
title: helm 語法筆記
categories: DevOps
date: 2021-11-24 22:46:39
tags: [helm, k8s, CI/CD]
header-img: /images/banner.jpg
catalog: true
---

## 前言

helm 是一個 k8s 設定檔管理的一種工具，這邊是紀錄一些比較特別的用法，避免以後忘記。
 

## 架構

heml 的架構大概如下  

```
|--Chart.yaml
|--values.yaml
|--templates
|----_helpers.tpl
|----deployment.yaml
```

### 基本取值

基本上 templates > deployment.yaml 就是 outline，實際的值都會放在 values.yaml 裡面，而在 template 簡單使用的方式大概有以下兩種。

```yaml
# deployment.yaml
xxx: {{ .Values.xxxx }}
name: {{ .Chart.name }} # 會拿 Chart.yaml 裡的東西
```

對應到 values.yaml 和 Chart.yaml 格式是這樣

```yaml
# values.yaml
xxx: 1
# Chart.yaml
name: helm-test
```

而在 deployment.yaml 裡面也可以拿 `_helpers.tpl` 裡面的東西，最簡單的就是透過 `include "test.name" .` 去拿。

```yaml
# deployment.yaml
name: {{ include "test.name" . }}
```

而在 `_helpers.tpl` 裡面是這樣宣告的

```yaml
{{- define "test.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
```

### 不同 scope

但因為有 array 的關係，所以在 helm 可以這樣用

```yaml
{{- range .Values.list }}
name: {{ .name }}
{{- end}}
```

對應到 values.yaml

```yaml
othervalue: cool
list:
  - name
```

但如果想在這個 range scope 裡面使用 `.Values.othervalue` 是沒辦法的，因為 scope 關係，所以必須改用 `$` 這個全域變數取得最上層的 scope，變成 `$.Values.othervalue` 就可以在 range scope 裡面使用

```yaml
{{- range .Values.list }}
name: {{ .name }}
othervalue: {{ $.Values.othervalue }}
{{- end}}
```

而對應到 `_helpers.tpl` 的話，一樣會有 scope 問題，所以必須把 `.` 改成 `$` 才可以正常取值。

```yaml
{{- range .Values.list }}
name: {{ .name }}
othervalue: {{ $.Values.othervalue }}
somename: {{ include "test.name" $ }}
{{- end}}
# 對比在外層的使用方式
othervalue: {{ .Values.othervalue }}
somename: {{ include "test.name" . }}
```

## dry-run

另外寫完可以直接在 local 用 dry-run 的方式確認是否設定正確 (在 Chart.yaml 同個目錄下)
`helm template {name} . --dry-run --debug`  

也可以指定特定 values  
`helm template {name} . --dry-run --debug -f values/staging.yaml`  

## 後記

以上簡單記錄使用方式，有遇到更特別再陸續補上。

## 參考

1. https://helm.sh/docs/chart_template_guide/debugging/
2. https://helm.sh/docs/chart_template_guide/control_structures/#looping-with-the-range-action
3. https://helm.sh/docs/chart_template_guide/variables/