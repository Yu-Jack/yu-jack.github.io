---
title: client-go Informer 概念與程式碼分析
categories: Kubernetes
date: 2023-11-08 15:43:56
tags: [client-go, kubernetes]
header-img: /images/banner.jpg
catalog: true
---

## 前言

client-go 是由 kubernetes 提供的套件，包含很多 kubernetes 互動的功能，最常見的就是可以透過 client-go 去呼叫 kubernetes API 以及撰寫 Controller 等等功能，這篇文章會圍繞在撰寫 Controller 時需要的 Informer 的架構為主，但我會先從脫離 client-go 的概念上解釋 Informer 這個東西的存在，再來帶到 Informer 中各個元件做的事情。


## 概念

在進入到 Informer 之前，先想想呼叫 kubernetes API 取得資源這件事，如果我們想對資源變化前後去做對應的行為，很直覺的做法就是不斷 pulling，然後偵測到前後差異，等到有變化的時候，再把訊息往下傳，接著再做對應的處理。而 client-go 針對上述的流程進行優化以及解耦合，讓整體的概念上更清楚以及分工更細節，也就是說其實你可以不用透過 client-go 也能做到 client-go 本身要做的事情，當然就是得自己刻套件。

根據上述描述的流程可以拆成以下幾個部分：  
- 取得 kubenetes resource
- 傳遞 resource 
- 針對 resource 變化進行對應的處理

而 client-go 提供的 Informer 就是針對以上這三塊去進行優化，不過在個人了解完之後，我覺得 Informer 比較像是一個 template，透過提供正確的 input output 後，就會做到以上三件事情。

在提到 client-go 做什麼之前，我們先想一下平常我們是怎麼做 API 優化的。通常在取得 API resource 回來使用後，下次想要取得就會需要再 call API，但這帶來的問題就是成本過高。所以下一步通常會採用 cache 的方式，讓下次取得資源不用 call API 直接從 cache 裡面拿即可。

而通常當兩個 service 之間都是用 API 溝通的話，這會帶來一些潛在的問題，其中之一就是當其中一個 service 掛掉之後，整體 service 就會掛掉。舉例來說 A service 呼叫 B service 要去做信件寄送，如果此時 B service 壞掉的話，A service 可能會得到連線錯誤的資訊，原本定義好的流程就會卡在這。而要解決這個問題的其中一個方式就是要解耦和，可以利用 asynchronous 去處理，可能是建立一個 queue 並且雙邊都用這個 queue 去溝通。

會發現這樣的架構像是微服務中的一種溝通方式，然後按照上述基本的優化，可以把原本流程改成以下的部分：
- 取得 kubernetes resource 放進 queue
- 將從 queue 取得到的 resource 放進 cache
- 從 queue 取得變化的 resource 並進行對應處理

說穿了 Informer 就是去進行以上的優化，並提供 template 來使用，而常聽到的 Reflector, ListAndWatch, Indexers 等等，就是製作這個 template 的眾多必要元素。

## Informer

Informer 需要以下三個東西才可以完成整個流程：
- 如何取得 resources 並放進 queue
- 如何處理得到的 resources 放進 cache
- 如何處理變化的 resource 事件

接著就可以把以上的概念對應到這個圖上 ![](/images/client-go/client-go.png)

> 以下 client-go 程式是基於 v0.28.3

## 如何取得 resources 並放進 queue

在 Informer 裡面是透過 Reflector 完成的，但其實還有一個更小的元素叫做 ListAndWatch，如同名字就是去 List 和 Watch resources。舉例來說可以透過 Watch 監測 Deployment 並且使用 ResultChan 可以拿到每一個變化的事件。
```go
watcher, err := kubeClient.
    AppsV1().
    Deployments("").
    Watch(context.Background(), metav1.ListOptions{})

if err != nil {
    panic(err)
}

for event := range watcher.ResultChan() {
    deployment := event.Object.(*appsv1.Deployment)
    switch event.Type {
    case watch.Added:
    case watch.Modified:
    case watch.Deleted:
    }
}
```

而我們實際在 `NewInformer` 的時候，就會需要把這個傳進去讓 Reflector 去做使用。
```go
lister := cache.NewListWatchFromClient(kubeClient.AppsV1().RESTClient(), "deployments", metav1.NamespaceAll, fields.Everything())
// 在 NewInformer 底下會去 NewReflector
cache.NewInformer(lister, &appsv1.Deployment{}, 0, cache.ResourceEventHandlerFuncs{ /* ...略 */ })
```

實際看一下 NewListWatchFromClient 會發現跟剛剛使用的 Watch 很相似。
```go
// client-go/tools/cache/listwatch.go
func NewFilteredListWatchFromClient(c Getter, resource string, namespace string, optionsModifier func(options *metav1.ListOptions)) *ListWatch {
	listFunc := func(options metav1.ListOptions) (runtime.Object, error) {
		optionsModifier(&options)
		return c.Get().
			Namespace(namespace).
			Resource(resource).
			VersionedParams(&options, metav1.ParameterCodec).
			Do(context.TODO()).
			Get()
	}
	watchFunc := func(options metav1.ListOptions) (watch.Interface, error) {
		options.Watch = true
		optionsModifier(&options)
		return c.Get().
			Namespace(namespace).
			Resource(resource).
			VersionedParams(&options, metav1.ParameterCodec).
			Watch(context.TODO())
	}
	return &ListWatch{ListFunc: listFunc, WatchFunc: watchFunc}
}
```

接著就是要把得到的結果放進到 queue 裡面，讓 Informer 本體去做操作，可以看到這邊把最終的結果丟到一個叫做 store 的東西裡面，這裡的 store 就是圖上的 Delta FIFO Queue，接著 Queue 有東西進去，那我們就要看怎麼取出來，因為待會 Informer 也會用一樣的方始把資料取出來使用。
```go
// client-go/tools/cache/reflector.go
case event, ok := <-w.ResultChan():
    /* 略 */
    switch event.Type {
    case watch.Added:
        err := store.Add(event.Object)
         /* 略 */
    case watch.Modified:
        err := store.Update(event.Object)
         /* 略 */
    case watch.Deleted:
        err := store.Delete(event.Object)
         /* 略 */
 /* 略 */
```

最主要就是這個 Pop，從裡面可以觀察到兩個重點  
1. queue & items
2. process

實際上在上面做 store 的操作時，並不是直接把 object 塞到 queue 裡面，而是塞入 ID。真正的 object 是被存在 items map 結構裡面，再來可以看到 `process`，這是 Informer 在使用 Pop 時會傳進來的。
```go
// client-go/tools/cache/delta_fifo.go
type DeltaFIFO struct {
	// `items` maps a key to a Deltas.
	// Each such Deltas has at least one Delta.
	items map[string]Deltas

	// `queue` maintains FIFO order of keys for consumption in Pop().
	// There are no duplicates in `queue`.
	// A key is in `queue` if and only if it is in `items`.
	queue []string
	/* 略 */
}
func (f *DeltaFIFO) Pop(process PopProcessFunc) (interface{}, error) {
	/* 略 */
	for {
		/* 略 */
		id := f.queue[0]
		f.queue = f.queue[1:]
		depth := len(f.queue)
		if f.initialPopulationCount > 0 {
			f.initialPopulationCount--
		}
		item, ok := f.items[id]
		if !ok {
			// This should never happen
			klog.Errorf("Inconceivable! %q was in f.queue but not f.items; ignoring.", id)
			continue
		}
		delete(f.items, id)
        /* 略 */
		err := process(item, isInInitialList)
		/* 略 */
	}
}
```

## 如何處理得到的 resources 放進 cache

從這裡會發現開始有一個 controller 的概念出現，但這跟我們 kubenetes 裡面寫的 controller 是不一樣的，不要搞錯哦！這裡的 controller 可以想像是 coordinator，把 Informer Reflector Indexer 都包起來做使用，那麼接著來看 Informer 如何處理 resource，根據下面的程式碼可以知道 Informer 使用 queue pop 時多傳遞一個 proceess 去裡面執行。
```go
// client-go/tools/cache/controller.go
func (c *controller) processLoop() {
	for {
		obj, err := c.config.Queue.Pop(PopProcessFunc(c.config.Process))
		if err != nil {
			if err == ErrFIFOClosed {
				return
			}
			if c.config.RetryOnError {
				// This is the safe way to re-enqueue.
				c.config.Queue.AddIfNotPresent(obj)
			}
		}
	}
}
```

而實際怎麼處理就是透過 `processDeltas`，從這邊可以注意兩個重點：
1. handler  
    這個比較特別，如果是單純使用 Informer 的話，就是 NewInformer 時增加的 ResourceEventHandlerFuncs。  
	但如果是使用 SharedInformer 的話，就是 sharedInformer 本身的 HandleDeltas (後面會提到)。  
2. clientState
    這是實際上 cache 存放的地方

所以從下面可以發現，實際上存放 cache 和觸發 handler 的時間點是很相近的。
```go
// client-go/tools/cache/controller.go
func processDeltas(
	// Object which receives event notifications from the given deltas
	handler ResourceEventHandler,
	clientState Store,
	deltas Deltas,
	isInInitialList bool,
) error {
	/* 略 */
	for _, d := range deltas {
		obj := d.Object

		switch d.Type {
		case Sync, Replaced, Added, Updated:
			if old, exists, err := clientState.Get(obj); err == nil && exists {
				if err := clientState.Update(obj); err != nil {
					return err
				}
				handler.OnUpdate(old, obj)
			} else {
				if err := clientState.Add(obj); err != nil {
					return err
				}
				handler.OnAdd(obj, isInInitialList)
			}
		case Deleted:
			if err := clientState.Delete(obj); err != nil {
				return err
			}
			handler.OnDelete(obj)
		}
	}
	return nil
}
```

接著我們來看一下 clientState 這是怎麼來的，在我們 NewInformer 的時候會連帶 NewStore，它的結構就是一個 thread safe map 結構，在 golang 中如果對 map 操作不上鎖的話，會導致 data race 的情況發生，所以會發現它裡面實作透過 RWLock 去做限制。另外通常在查詢 Informer 都會看到 Indexer 這個詞，其實 Indexer 是 Store 的進化版本，提供更多不同的方法可以使用，但這邊就不多做介紹
```go
// client-go/tools/cache/controller.go
func NewInformer(
	lw ListerWatcher,
	objType runtime.Object,
	resyncPeriod time.Duration,
	h ResourceEventHandler,
) (Store, Controller) {
	clientState := NewStore(DeletionHandlingMetaNamespaceKeyFunc)
	return clientState, newInformer(lw, objType, resyncPeriod, h, clientState, nil)
}

// client-go/tools/cache/thread_safe_store.go
type threadSafeMap struct {
	lock  sync.RWMutex
	items map[string]interface{}

	// index implements the indexing functionality
	index *storeIndex
}

func NewThreadSafeStore(indexers Indexers, indices Indices) ThreadSafeStore {
	return &threadSafeMap{
		items: map[string]interface{}{},
		index: &storeIndex{
			indexers: indexers,
			indices:  indices,
		},
	}
}
```

## 如何處理變化的 resource 事件

這部分其實在剛剛就有介紹到，通常在使用 Informer 都會新增 ResourceEevenHandlerFuncs，這個新增的 ResourceEevenHandlerFuncs 就會在上面 `processDelta` 中的 handler.OnXXX 被執行到。
```go
store, controller := cache.NewInformer(lister, &appsv1.Deployment{}, 0, cache.ResourceEventHandlerFuncs{
    AddFunc: func(obj interface{}) {},
    UpdateFunc: func(oldObj, newObj interface{}) {},
    DeleteFunc: func(obj interface{}) {},
})
```

## SharedInformer

除了 Informer 之外，還有 SharedInformer 的存在，它是為了有效降低使用成本，而這裡使用成本指的是「針對同一個資源」。如果我們都只使用 Informer 的話，假設有十個 Informer 去監控同一種資源，就會導致資源浪費。而 SharedInformer 判斷資院有沒有重複是透過 `reflect.TypeOf`，這樣就可以有效降低會有多個 Watch 去監控同樣的資源。
```go
// client-go/informers/factory.go
func (f *sharedInformerFactory) InformerFor(obj runtime.Object, newFunc internalinterfaces.NewInformerFunc) cache.SharedIndexInformer {
	f.lock.Lock()
	defer f.lock.Unlock()

	informerType := reflect.TypeOf(obj)
	informer, exists := f.informers[informerType]
	if exists {
		return informer
	}

	resyncPeriod, exists := f.customResync[informerType]
	if !exists {
		resyncPeriod = f.defaultResync
	}

	informer = newFunc(f.client, resyncPeriod)
	f.informers[informerType] = informer

	return informer
}
```

那麼因為同一個資源可能會有多個 handler，sharedIndexInformer 是在這裡把它轉換成 listener
```go
func (s *sharedIndexInformer) AddEventHandlerWithResyncPeriod(handler ResourceEventHandler, resyncPeriod time.Duration) (ResourceEventHandlerRegistration, error) {
    /* 略 */
    listener := newProcessListener(handler, resyncPeriod, determineResyncPeriod(resyncPeriod, s.resyncCheckPeriod), s.clock.Now(), initialBufferSize, s.HasSynced)
    /* 略 */
	handle := s.processor.addListener(listener)
    /* 略 */
}
```

接著在最後啟動 sharedInformer 的時候，會把所有 listen 拿出來呼叫，這邊有兩個重點
1. listenr.run
    會去聽 channel，有東西的時後就會處發原本定義的 handler
2. listenr.pop
    會去塞 channel，根據 Watch 拿到的資料，會把對應事件塞到 channel 裡面
```go
// client-go/tools/cache/shared_informer.go
func (p *sharedProcessor) run(stopCh <-chan struct{}) {
	func() {
		/* 略 */
		for listener := range p.listeners {
			p.wg.Start(listener.run)
			p.wg.Start(listener.pop)
		}
		/* 略 */
	}()
    /* 略 */
}
```

可以看到底下個 listener.run 會去聽 p.nextCh，而 listener.pop 會去塞 nextCh (from p.nexCh)
```go
// client-go/tools/cache/shared_informer.go
func (p *processorListener) run() {
	/* 略 */
	wait.Until(func() {
		for next := range p.nextCh {
			switch notification := next.(type) {
			case updateNotification:
				p.handler.OnUpdate(notification.oldObj, notification.newObj)
			case addNotification:
				p.handler.OnAdd(notification.newObj, notification.isInInitialList)
				/* 略 */
			case deleteNotification:
				p.handler.OnDelete(notification.oldObj)
			default:
				/* 略 */
			}
		}
		/* 略 */
	}, 1*time.Second, stopCh)
}

func (p *processorListener) pop() {
	defer utilruntime.HandleCrash()
	defer close(p.nextCh) // Tell .run() to stop

	var nextCh chan<- interface{}
	var notification interface{}
	for {
		select {
		case nextCh <- notification:
			// Notification dispatched
			/* 略 */
		case notificationToAdd, ok := <-p.addCh:
			if !ok {
				return
			}
			if notification == nil { // No notification to pop (and pendingNotifications is empty)
				/* 略 */
                notification = notificationToAdd
				nextCh = p.nextCh
			} else { // There is already a notification waiting to be dispatched
				/* 略 */
			}
		}
	}
}
```

上面串起來之後，我們來看一下 Watcher 是怎麼跟 listener 互動，可以看到 sharedIndexInformer ，提供了一個 OnAdd 可以觸發 distribute 最後再把 obj 加入到 listener。
```go
// client-go/tools/cache/shared_informer.go
func (s *sharedIndexInformer) OnAdd(obj interface{}, isInInitialList bool) {
	// Invocation of this function is locked under s.blockDeltas, so it is
	// save to distribute the notification
	s.cacheMutationDetector.AddObject(obj)
	s.processor.distribute(addNotification{newObj: obj, isInInitialList: isInInitialList}, false)
}

func (p *sharedProcessor) distribute(obj interface{}, sync bool) {
	p.listenersLock.RLock()
	defer p.listenersLock.RUnlock()

	for listener, isSyncing := range p.listeners {
		switch {
		case !sync:
			// non-sync messages are delivered to every listener
			listener.add(obj)
		case isSyncing:
			// sync messages are delivered to every syncing listener
			listener.add(obj)
		default:
			// skipping a sync obj for a non-syncing listener
		}
	}
}

func (p *processorListener) add(notification interface{}) {
	if a, ok := notification.(addNotification); ok && a.isInInitialList {
		p.syncTracker.Start()
	}
	p.addCh <- notification
}
```

接著這邊觸發邏輯跟單純 informer 的 processDeltas 有點不太一樣，原本 Informer processDeltas 呼叫的 handler 是使用者帶進來的，但是在 sharedInformer 的邏輯下，帶入的是 sharedIndexInformer 包起來的，順序大致上如下，所以可以發現這次 processDeltas 執行的 handelr 就是從 sharedIndexInformer 來的。
```go
// client-go/tools/cache/shared_informer
func (s *sharedIndexInformer) Run(stopCh <-chan struct{}) {
    cfg := &Config{
        /* 略 */
        Process:           s.HandleDeltas,
        /* 略 */
    }
}

func (s *sharedIndexInformer) HandleDeltas(obj interface{}, isInInitialList bool) error {
	s.blockDeltas.Lock()
	defer s.blockDeltas.Unlock()

	if deltas, ok := obj.(Deltas); ok {
		return processDeltas(s, s.indexer, deltas, isInInitialList)
	}
	return errors.New("object given as Process argument is not Deltas")
}

// client-go/tools/cache/controller.go
func processDeltas(
	/* 略 */
	handler ResourceEventHandler,
	clientState Store,
	/* 略 */
) error {
	/* 略 */
	for _, d := range deltas {
		obj := d.Object

		switch d.Type {
		case Sync, Replaced, Added, Updated:
			if old, exists, err := clientState.Get(obj); err == nil && exists {
				if err := clientState.Update(obj); err != nil {
					return err
				}
				handler.OnUpdate(old, obj)
			} else {
				if err := clientState.Add(obj); err != nil {
					return err
				}
				handler.OnAdd(obj, isInInitialList)
			}
		case Deleted:
			if err := clientState.Delete(obj); err != nil {
				return err
			}
			handler.OnDelete(obj)
		}
	}
	return nil
}
```

## Wrap up

這邊來做個簡單的總結

Reflector 針對「如何取得 resources 並放進 queue」做了以下事
1. 設定 ListAndWatch 去監控資源
2. 設定一個 Delta FIFO Queue 去放置變化的資源順序

Informer 針對「如何處理得到的 resources 放進 cache」做了以下事
1. 等待 Reflector Delta FIFO Queue 有新的變化資源進來
2. 有新的變化資源進來，透過 Store (Indexers) 塞入到 cache 裡面，而當使用者需要使用時會呼叫 `Informer.Lister().GetXXX()` 去取得 cache，所以名字上會有些差異。

Informer 針對「如何處理變化的 resource 事件」做了以下事
1. 提供對外介面，讓使用者可以針對不同事件做處理
2. 配合前面的 Reflector，有新的變化資源進來，觸發使用者提供的 handler

Controller 則是扮演 coordinator 的角色，把以上東西都包起來做使用，但記得這不等於 custom controller 唷！但要對照以下圖的位置的話，會是 Informer 的位置。
![](/images/client-go/client-go.png)

## Call Stack

前面的 call stack 可能很難想像，這邊我畫了一張串起來的就會比較好想像，使用情境是以 SharedInformer 為出發，這張圖省略了部分細節，主要以概念上的順序為主去畫，這邊就會發現比較多核心的邏輯會聚集在 controller 裡面去處理。 ![](/images/client-go/sharedInformercallstack.png)


## 最後

至於我沒有講到下面 Custom Controller 以及 workqueue 部分是因為打算放到跟 [rancher/lasso](https://github.com/rancher/lasso) 一起做說明，但這邊可以簡單說，由於 client-go 提供的 controller 其實是一個範例加上概念，它並沒有提供很嚴謹的寫法，基本上都是基於前面提到 Informer Store ListAndWatch 做一個包起來使用的例子，而 lasso 提供所謂 SharedController 的概念，如同 SharedInformer 一樣可以有效降低成本，所以打算放到之後講比較有感。


