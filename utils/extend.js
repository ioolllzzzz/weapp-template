const noop = () => { }

/**
 * 扩展对象类型
 */
// Object.assign(Object.prototype, {
//   isArray: function () {
//     return typeof this === 'object' && {}.toString.call(this) === '[object Array]'
//   },

// })

/**
 * 扩展数值类型
 */
Object.assign(Number.prototype, {
  toPrice: function () {
    let v = this, s = '¥'
    //只舍不进 保留两位
    s += Math.floor(v * 100) / 100
    // console.log('Number.toPrice', v, s)
    return s
  },

})

/**
 * 扩展字符类型
 */
Object.assign(String.prototype, {
  toPrice: function () {
    let v = this
    if (isNaN(v)) return v
    return parseFloat(v).toPrice()
  },
  toJson: function () {
    let t = this
    try { return JSON.parse(t) }
    catch (e) {
      console.error('JSON parse error', e)
      return t
    }
  },

})

/* --- end extend --- */

/**
 * wx 对象下的所有非同步方法 promise化
 * 对应原方法名前 加 $ 符号
 * 如 wx.request ==> wx.$request
 */
// const promisify = () => {
for (let k in wx) {
  let i = wx[k]
  if (k.indexOf('Sync') < 0 && typeof i === 'function' && Object.prototype.toString.call(i) === '[object Function]')
    wx['$' + k] = (options, ...params) => {
      return new Promise((resolve, reject) => {
        i(Object.assign({}, options, { success: resolve, fail: reject }), ...params)
      })
    }
}
// }

/* --- end wx's promisify --- */

/**
 * 重写Page
 * 增加 $route、$get、$set
 */
const originalPage = Page,
  preLoadHook = 'onPreLoad',
  hooks = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload']
var preLoaders = {}, datasets = {}
/**
 * 重写的Page注册
 */
class NewPage {
  /**
   * @param {String} path 跳转页面路径(pages/ 之后的路径)
   * @param {Object} options 页面配置
   */
  constructor(path, options) {
    //{ObjectArray} options.comps 当前页面的组件
    //{Function} options.onPreLoad 当前页面的预加载函数
    let pgKey = `pages/${path}`,
      //__wxAppCurrentFile__.replace('.js', ''),
      comps = options.comps || [], hookArr = {}
    delete options.comps
    if ({}.toString.call(comps) !== '[object Array]')
      throw new Error('using array add components')

    const _dealHook = (o) => {
      for (let k in hooks) {
        let v = hooks[k]
        if (o[v]) {
          if (hookArr[v]) hookArr[v].push(o[v])
          else hookArr[v] = [o[v]]
          delete o[v]
        }
      }
    }

    if (comps && comps.length > 0) {
      comps.map(c => {
        options.data = Object.assign({}, c.data, options.data)
        delete c.data

        _dealHook(c)
      })
    }

    _dealHook(options)

    for (let h in hookArr) {
      options[h] = function () {
        //这里加生命周期函数的前置全局统一处理

        // console.log(`invoke ${this.__route__} ${h}`)
        hookArr[h].map(i => {
          i.apply(this, arguments)
        })

        //这里加生命周期函数的后置全局统一处理
        switch (h) {
          case 'onShow':
            break
          case 'onHide':
            break
          case 'onUnload':

            break
        }

      }
    }

    if (options[preLoadHook]) {
      preLoaders[pgKey] = options[preLoadHook]
      delete options[preLoadHook]
    }

    options.$key = pgKey
    options.$to = this.to
    options.$get = this.dataGet
    options.$set = this.dataSet

    options = Object.assign({}, ...comps, options)
    // console.log('override Page：', pgKey, comps, options)
    return originalPage(options)
  }

  /**
   * 路由跳转
   * this.$to 调用
   * @param {String} path 跳转页面路径(pages/ 之后的路径，拼接参数)
   * @param {String?} routeType 跳转类型 同 navigator组件 的 open-type(默认使用 navigate，若当前路由层级已有五级，默认使用 redirect)
   */
  to(path, routeType = 'navigate') {
    (wx.vibrateShort || noop)()
    let routes = getCurrentPages(), data = {},
      tabBars = __wxConfig.tabBar.list || [], isTab = false,
      query = path.split('?'), key = `pages/${query[0]}`,
      pagePath = key + '.html'
    path = `/pages/${path}`
    if (query[1])
      query[1].split('&').map(q => {
        data[q.split('=')[0]] = q.split('=')[1]
      })

    // console.log(`--invoke $to：${routeType} [from "/${this.__route__}",to "${path}"]`, data, routes)

    const ok = () => {
      console.log(`*** ${routeType} to '${path}' success`)
    }, fail = e => {
      console.error(`*** ${routeType} to ${path}' fail:`, e)
      // wx.$redirectTo({ url: path }).then(ok).catch(fail)
    }, preLoad = () => {
      if (preLoaders[key])
        preLoaders[key].call(this, data)
    }

    isTab = tabBars.findIndex(t => t.pagePath === pagePath) > -1
    if (isTab)
      routeType = '$switchTab'
    else
      switch (routeType) {
        case 'navigate':
        default:
          let hasIdx = routes.findIndex(r => r.$key == key)
          if (hasIdx > -1) {
            routeType = ''
            wx.navigateBack({ delta: routes.length - 1 - hasIdx })
          }
          else {
            preLoad()
            if (routes.length > 4)
              routeType = '$redirectTo'
            else
              routeType = '$navigateTo'
          }
          break
        case 'redirect':
          preLoad()
          routeType = '$redirectTo'
          break
        case 'switchTab':
          routeType = '$switchTab'
          break
        case 'reLaunch':
          preLoad()
          routeType = '$reLaunch'
          break
        case 'navigateBack':
          routeType = ''
          wx.navigateBack({ delta: 1 })
          break
      }
    if (routeType)
      wx[routeType]({ url: path }).then(ok).catch(fail)
  }
  /* end to */

  /**
   * 数据缓存获取
   * this.$get 调用
   * @param {String} key 数据键名
   * @returns {Promise} 一般情况下返回一个数据请求的Promise对象
   */
  dataGet(key) {
    // console.log('--invoke $get：', key)
    return datasets[key] || Promise.resolve('')
  }
  /* end dataGet */

  /**
   * 数据缓存设置
   * this.$set 调用
   * @param {String} key 数据键名
   * @param {any} value 缓存的数据
   */
  dataSet(key, value) {
    // console.log('--invoke $set：', key)
    datasets[key] = value
  }
  /* end dataSet */

}


module.exports = {
  originalPage,
  NewPage,
}
