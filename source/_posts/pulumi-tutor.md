---
title: Pulumi 導入教學介紹
date: 2022-02-22 22:00:17
categories: DevOps
tags: [pulumi]
header-img: /images/banner.jpg
catalog: true
---

## 前言

Pulumi 是 Infrastructure as Code (IaC) 的一套管理工具，通常會開始用 IaC 的時間點，部分是已經有 Cloud Provider 在運行的情況，並且想用程式碼進行管理，畢竟一開始剛建立 Infrastructure 可能還是會選用 UI 建立會來得比較快速。

通常 IaC 會有幾個好處

1. 版本控制，透過 code review 確保修改不會錯誤
2. 不必依賴 UI，可建置 CI/CD 流程
3. 複製新的環境時更為容易 (staging, production)
4. 程式即文件，所有 Infrastructure 的建置都是程式碼，而程式碼本身就是文件的一種，可以透過這個去了解整體 Infrastructure 建置流程

而可能的問題則是

1. 若不善用 IaC 工具區分環境，會導致程式碼混亂，staging & production 程式混在一起，變的難以理解
2. 畢竟是用程式管理，對應的程式架構勢必需要規劃有彈性且可擴充的方式

簡單介紹完後，接著的內容會圍繞在如何導入 Pulumi 去使用，而這篇會專注在 Pulumi 導入時要注意的一些點，以下範例都會用 Go 為主。

> 雖然我覺得 typescript 寫起來比較好寫，不過最近寫 Go 就順便用了

## Stack

在進入實際操作之前，先來介紹 Pulumi 中的 Stack 這個名詞。

每一個 Stack 都是獨立的設定環境，所有程式的結果都會紀錄在這個 Stack 上，也可以 Import 現有 Cloud Provider 狀態到這個 Stack 裡面，也就是說 Pulumi 是透過 Stack 去管理所有 Cloud Provider 資源的狀態。另外 Stack 名字基本上就想怎取都可以，官方給的建議類似是 dev staging production 等等，但也可以是 feature branch，單純就是一個名字而已。

而不同資源當然也可以用不同 Stack 去管理，舉例來說我們 AWS S3 有一個 bucket 叫做 test，然後裡面有三個 a b c 三個檔案，如果我們想用不同 Stack 管理可以有下面的組合。

![](/images/pulumi-tutor/05.png)

以上面組合來說，Stack A 可以把 a 加到資源管理裡面，Stack B 則是 b c，是可以在不同 Stack 去管理。

而實際上在建立資源時，要留意有些 function 提供的參數中，存在一些需要填 name 的地方，這個 name 是給 Pulumi 用還是給 Cloud Provider 用，因為 Pulumi 為了管理資源狀態，會需要 unique id 去做辨識，待會用 import AWS route53 做範例解釋。

## Import

假設我們現在在 AWS route53 上面已經有存在一個 `jackjack.com` zone，但 Stack 是新的時候，該如何把這個資源納入到 Pulumi 去管理呢？

透過 `pulumi import aws:route53/zone:Zone myjackzone zone_id` 就可以了，但要注意在此指令中的 `myjackzone` 是 pulumi resource 的名稱，並不是 AWS route53 上面的任何名稱，接著當 import 完成後，可以試著直接打 `pulumi up` 會發現跳出的預覽改變，是刪除這筆 Zone。

![](/images/pulumi-tutor/01.png)

原因是當你 import 後，Pulumi 會認定這筆資源現在是正確被使用的，但重新跑 pulumi up 之後，在程式碼之中，找不到任何有建立過這筆資源的程式碼的話，就會被認定為你是要刪除。所以跑完 import 後，會需要再把對應的程式碼給補上，這樣跑 pulumi up 的時候才不會出現刪除的預覽。

但要手動補上程式碼太蠢了，所以會發現其實跑完上面 import 指令後，會產生出一份程式碼，直接把這份程式碼放到專案裡面即可，或是用 `pulumi import aws:route53/zone:Zone myjackzone zone_id -o {file_name}` 也行，產生的程式碼如下。

```go
package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/route53"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		_, err := route53.NewZone(ctx, "myjackzone", &route53.ZoneArgs{
			Comment:      pulumi.String(""),
			ForceDestroy: pulumi.Bool(false),
			Name:         pulumi.String("jackjack.com"),
		}, pulumi.Protect(true))
		if err != nil {
			return err
		}
		return nil
	})
}
```

這個檔案用途其實蠻大的，因為文件上的一些參數描述跟你在畫面上看到的會不太一樣，就可以透過這個程式碼去了解目前 AWS 上畫面轉換成程式碼的話實際會長什麼樣子，不過還是建議要整理這份程式碼，否則若你資源檔太大，這個程式碼就越多。

### Stack file

完成匯入後，先來看看目前 Stack 儲存的資源狀態長什麼樣子 (只列出其中一小部分)，這裡可以透過 `pulumi stack export` 匯出目前現有所有資源的狀態。

```json
{
    "urn": "urn:pulumi:dev::pulumi-demo::aws:route53/zone:Zone::myjackzone",
    "custom": true,
    "id": "xxxx",
    "type": "aws:route53/zone:Zone",
    "inputs": {
        "__defaults": [
            "comment",
            "forceDestroy",
            "name"
        ],
        "comment": "",
        "forceDestroy": false,
        "name": "jackjack.com"
    },
    "outputs": {
        "arn": "arn:aws:route53:::hostedzone/xxxx",
        "comment": "",
        "delegationSetId": "",
        "id": "xxxx",
        "name": "jackjack.com",
        "nameServers": [
            "ns-1xxx",
            "ns-2xxx",
            "ns-3xxx",
            "ns-4xxx"
        ],
        "tags": {},
        "tagsAll": {},
        "vpcs": [],
        "zoneId": "xxxx"
    },
    "parent": "urn:pulumi:dev::pulumi-demo::pulumi:pulumi:Stack::pulumi-demo-dev",
    "protect": true,
    "provider": "urn:pulumi:dev::pulumi-demo::pulumi:providers:aws::default_4_37_1::xxxx",
    "sequenceNumber": 1
}
```

可以發現有一個 urn 儲存有 `myjackzone` 這個字眼，所以其實可以對應到這個名稱是資源管理用的名稱，再對回去原本程式碼，就會發現 `jackjack.com` 以及 `myjackzone` 的意義是不一樣。

```go
route53.NewZone(ctx, "myjackzone", &route53.ZoneArgs{
			Comment:      pulumi.String(""),
			ForceDestroy: pulumi.Bool(false),
			Name:         pulumi.String("jackjack.com"),
		}, pulumi.Protect(true))
```

### State and Backend

另外 Stack file 儲存的位置會根據你設定的 `backend url` 而有所不一樣，舉例來說可以用 pulumi service 或是 aws s3 去管理這個 stack file，所以在一開始建議先想好要用什麼 Backend 去管理所有 Stack file，又或是分開管理，就依照不同需求去處理。

而當要做切換不同 Backend 的時候，只需要用 `pulumi login ${backend-url}` 切換即可，其他部分可以參考 [State and Backends](https://www.pulumi.com/docs/intro/concepts/state/#state-and-backends)。

### Resource file

當然 pulumi 也有提供可以直接 import 整個資源檔，但必須要自己製作，整體格式如下。

```json
{
    "resources": [{
        "type": "aws:route53/zone:Zone",
        "name": "myZone",
        "id": "Z1D633PJN98FT9"
    }]
}
```

接著透過 `pulumi import -f filename.json`，就可以完成匯入，其他詳細介紹可以直接看官網[Bulk Import Operations](https://www.pulumi.com/docs/guides/adopting/import/#bulk-import-operations)


### Multiple Regions

當然有些服務不太可能只存在在一個 region，勢必會出現多個 region 的存在，那麼要如何 import 多個 region 呢？只需要填入 `nameTable` 以及 `provider` 的 key-value 即可完成，整體 json 檔案如下。

```json
{
  "nameTable": {
    "us-east-1": "urn:pulumi:xxxxx::pulumi:providers:aws::xxxxx"
  },
  "resources": [
    {
      "type": "aws:acm/certificate:Certificate",
      "name": "jack.hi",
      "id": "xxxxx",
      "provider": "us-east-1"
    },
}
```

那麼要如何獲得 `nameTable` 裡面 urn 的值呢？

首先必須先程式建立一個 Provider，程式碼很單純，以 `us-east-1` 來說，只需要以下這樣即可。

```go
aws.NewProvider(ctx, "useast-1", &aws.ProviderArgs{
    Region: pulumi.String("us-east-1"),
})
```

接著取得 urn 有兩種方式
1. `pulumi stack export` 取得此 provider urn
2. `pulumi up` 建立的時候，會出現此 resource 的 urn 直接複製即可

接著就可以把 urn 的值回填，其他參數可以參考 [pulumi import](https://www.pulumi.com/docs/reference/cli/pulumi_import/#synopsis) 的文件。

## Create Resource

呼叫 API 建立資源的部分都蠻單純的，不同資源建立的用法都在官方文件上，這邊就不多帶下去，不過我們要看一個比較特別的點。

### Execution Order

要特別注意會有執行順序的問題，那為了 demo 這個必須要重新來過，可以執行 `pulumi destroy` 的指令，刪除 pulumi 的資源管理的檔案以及 aws service，注意這個會真的刪除 aws service 的東西，所以要特別小心。

這邊快速提到一點，為了要防止不小心被誤砍，其實在建立的時候都可以加上 `pulumi.Protect(true)` 去做一個保護，加上去之後需要透過其他方式解除保護，這樣才可以刪除。

接著我們實際上來建立一個 zone 以及一個 record，程式碼如下。

```go
zone, _ := route53.NewZone(ctx, "myjackzone", &route53.ZoneArgs{
	Comment:      pulumi.String(""),
	ForceDestroy: pulumi.Bool(false),
	Name:         pulumi.String("jackjack2.com"),
}, pulumi.Protect(true))

route53.NewRecord(ctx, "www.jackjack2.com.A", &route53.RecordArgs{
	ZoneId: zone.ZoneId,
	Name:   pulumi.String("www.jackjack2.com"),
	Ttl:    pulumi.Int(300),
	Type:   pulumi.String("A"),
	Records: pulumi.StringArray{
		pulumi.String("8.8.8.8"),
	},
}, pulumi.Protect(true))
```

接著跑 `pulumi up` 會發現在 preview 時選擇 detail 看到 zoneId 的欄位是 output string 並不是一個 ID，這是因為 zone 沒建立起來，你是無法建立 record，所以他的意思就是會拿前面建立完成後的資料，當作後面的 input 去建立。

![](/images/pulumi-tutor/02.png)

### Preview 成功不等於 Apply 成功

接著比較要注意的一點是，preview 即使成功，但不代表你套用後是會正確的，例如以下的範例。

```go
route53.NewRecord(ctx, "www.jackjack2.com.A", &route53.RecordArgs{
	ZoneId: pulumi.String("asd"),
	Name:   pulumi.String("www.jackjack2.com"),
	Ttl:    pulumi.Int(300),
	Type:   pulumi.String("A"),
	Records: pulumi.StringArray{
		pulumi.String("8.8.8.8"),
	},
}, pulumi.Protect(true))

route53.NewZone(ctx, "myjackzone", &route53.ZoneArgs{
	Comment:      pulumi.String(""),
	ForceDestroy: pulumi.Bool(false),
	Name:         pulumi.String("jackjack2.com"),
}, pulumi.Protect(true))
```

故意亂改 record zone id，實際套用後會是看到建立兩筆建立成功，以及一個建立失敗的結果。

![](/images/pulumi-tutor/03.png)

### 出現失敗可能不等於全部失敗

而看到出現失敗不代表全部會失敗，如果其他參數都是合理的話，則是會建立成功，如前一張圖最後顯示 `2 created` 代表還是有成功的，接著再重新跑一次 pulumi up 會發現，只會出現有一項要建立而已

![](/images/pulumi-tutor/04.png)


## State Delete

因為有 destroy 可以刪除 pulumi state 以及 cloud serviec，那麼就一定會單純刪除 pulumi state 的指令，就是 `pulumi state delete {urn}`。透過這個指令，可以單純刪除掉 pulumi 內的狀態而不影響 Cloud Provider 的內容。

這個用途以個人的情況來說會用在，若是 resource 不想被當前 stack 管理，就可以用這個指令去消除狀態。

## Github Action

基本上程式建構完成之後，就可以開始著手處理 CI/CD 的部分，這部分可以參考 [Pulumi Github Action](https://www.pulumi.com/docs/guides/continuous-delivery/github-actions/)，個人覺得寫蠻詳細的。

## 後記

上面的流程是個人在導入時遇到的一些小問題，這邊就做個紀錄，在慢慢把 Cloud Provider 納入 IaC 工具管理應該都會有這問題，以 pulumi 來說，我就會時常需要 import 現有 Cloud Provider 資源的狀態進來，那不小心 import 就勢必須要 delete 掉，且 import 成功後，還需要補上程式碼，避免 pulumi up 的時候，把你判斷成要刪除的窘境。

## References

* [Importing Infrastructure](https://www.pulumi.com/docs/guides/adopting/import/)
* [Resources](https://www.pulumi.com/docs/intro/concepts/resources/)
* [Pulumi Import](https://www.pulumi.com/docs/reference/cli/pulumi_import/#synopsis)
* [State and Backends](https://www.pulumi.com/docs/intro/concepts/state/#state-and-backends)