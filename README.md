# 微信小程序模版项目

---

>### §重写**Page**页面注册
>用法： `Page(path,options)`
>- `path`：String，页面路径，不包括 `pages/`，如：页面`/pages/home/index`中传入`home/index`
>- `options`：Object，同原生Page，增加实例扩展
>
>**Page**实例上的扩展：
>
>|name|usage|descr
>|:-:|-|-
>|自定义组件|`Page(path,{comps:[require('~comps/***[.js?]'),...]})`|通过数组方式传入当前页引用的组件
>|路由跳转|`this.$to(path, routeType = 'navigate')`|*path {String} 必须* 跳转页面路径(不包括 `pages/`，拼接参数)；*routeType {String} 可选* 跳转类型 同*navigator*组件的`open-type`(默认使用 navigate，若当前路由层级已有五级，则默认使用 redirect)
>|添加数据缓存|`this.$set(key,value)`|*key {String} 必须* 数据键名；*value {any} 必须* 缓存的数据(一般情况下存放接口请求的**Promise对象**，大体积数据不要使用此方式缓存)
>|获取数据缓存|`this.$get(key)`|*key {String} 必须* 数据键名(一般情况下返回一个数据请求的**Promise对象**)
>|预加载生命周期函数|`Page(path,{onPreLoad:fn})`|函数内 **this** 指向调用处的 **Page** 实例，即 非函数所在的实例，所以只可使用附加的扩展函数(如$set)

---

>### §自定义组件使用与规则(待完善)
>1. 添加在`~comps/`目录下
>2. js引用参见 *Page实例扩展*
>3. 页面引用方式：大量数据或操作复杂则通过 `<import src="/comps/***[.wxml?]"/>` *写模版* 方式引入，否则 通过 `<include src="/comps/***[.wxml?]"/>` 方式直接引入代码段
>4. 样式引入通过`@import '/comps/***[.wxss?]'`

---
## §注意事项
- `wx`对象下的所有非同步方法已 *promise化* ，对应原方法名前加 **$** 符号，如 `wx.request ==> wx.$request`
- `setInterval`通过`setTimeout`的 **尾递归** 方式实现
- 使用`setTimeout`的页面必须做页面隐藏和卸载时的清理

---


>### 页面层级表
>
>|use   |z-index
>|-     |:-:
>|toast |99
>| |
>| |
