---
title: TODO - vue + vuex + vue-router
categories: Vue
date: 2017-09-23 15:00:00
tags: [vue, vuex, vue-router, todo-list]
---

這篇文章主要在記錄如何用 vue + vuex + vue-router 
做出一個簡單的 TODO List 專案
[DEMO 網站](https://yu-jack.github.io/todo-vue/)
[Source Code](https://github.com/Yu-Jack/yu-jack.github.io)

<!--more-->

## 先來訂一個 TODO List 的簡單需求表
1. 能夠輸入項目
2. 能夠打勾確認完成
3. 能夠刪除項目
4. 能夠選擇顯示全部, 未完成, 完成的項目

## 程式部分則會分為一個 vuex store 和三個 components
1. 專門控管資料的 store
2. 輸入項目 component
3. 顯示項目 compoent
4. 選擇完成狀態的 component

### 專門控管資料的 store
#### store.js
```javascript
import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex)
const store = new Vuex.Store({
    state: {
        lists: [],
        status: '', // 去更新要顯示什麼狀態的項目
        counter: 0 // 當作 increment id 用
    },
    // 宣告可以更改的方式
    mutations: {
        addItem (state, new_item) {
            state.counter += 1
            new_item.id = state.counter
            state.lists.push(new_item)
        },
        changeStatus(state, id) {
            state.lists = state.lists.map((list) => {
                if (list.id === id) list.is_completed = !list.is_completed
                return list
            })
        },
        deleteItem(state, id) {
            state.lists = state.lists.filter((list) => {
                if (list.id === id) return false;
                return true;
            })
        }
    }
})
export default store;
```


### 輸入項目 component 
#### todo-input.vue
```html
<div>
    <form class="ui form" @submit.prevent="block">
        <div class="field">
            <label for="">List</label>
            <input type="text" v-model="item" v-on:keyup.13="submit">
        </div>
    </form>
</div>
```
```javascript
export default {
    data() {
        return {
            item: ''
        }
    },
    methods: {
        submit() {
            // 利用 commit 把資料塞進去
            this.$store.commit('addItem', {
                name: this.item,
                is_completed: false
            })
            // 輸入完畢之後, 把剛剛輸入得值清空
            this.item = ''
        },
        block() {
            return false
        }
    }
}
```
### 顯示項目 component 
#### todo-item.vue
```html
<div>
    <table class="ui table stackable fixed">
        <thead>
            <tr>
                <th colspan="3">Item</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(list, index) in lists">
                <td :class="{completed: list.is_completed}"> {{list.name}} </td>
                <td>
                    <!-- 綁定 done method, 並傳入 id 去做勾選完成-->
                    <button class="ui icon inverted green button" @click="done(list.id)">
                        <i v-if="list.is_completed === false" class="checkmark icon"></i>
                        <i v-else class="reply icon"></i>
                    </button>
                </td>
                <td>
                    <!-- 綁定 remove method, 並傳入 id 去做刪除 -->
                    <button class="ui icon inverted red button" @click="remove(list.id)">
                        <i class="trash icon"></i>
                    </button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
<style scoped lang="css">
.completed {
    text-decoration: line-through
}
</style>
```

```javascript
export default {
    data() {
        return {
            status: this.$store.state.status
        }
    },
    computed: {
        lists() {
            return this.$store.state.lists.filter((list) => {
                const s = (list.is_completed === true ? 'done' : 'nondone')
                if (this.$store.state.status === '') return true
                else {
                    return (this.$store.state.status === s)
                }
            })
        }  
    },
    methods: {
        remove(id) {
            this.$store.commit('deleteItem', id)
        },
        done(id) {
            this.$store.commit('changeStatus', id)
        }
    }
}
```
### 選擇完成狀態的 coomponent
#### todo-display.vue
```html
<div>
    <select class="ui dropdown" v-model="status">
        <option value="">Show All</option>
        <option value="done" selected>Show Done</option>
        <option value="nondone">Show None-done</option>
    </select>
</div>
```
```javascript
export default {
    data() {
        return {
            status: ""
        }
    },
    mounted() {
        this.$store.state.status = this.status
    },
    watch: {
        status(n_v, o_v) {
            // 更新目前顯示狀態
            this.$store.state.status = n_v
        }
    }
}
```