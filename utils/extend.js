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

const _clone = (obj) => {
  // Handle the 3 simple types, and null or undefined
  if (null == obj || 'object' != typeof obj) return obj

  // Handle Date
  if (obj instanceof Date) {
    let copy = new Date()
    copy.setTime(obj.getTime())
    return copy
  }

  // Handle Array
  if (obj instanceof Array) {
    let copy = []
    for (let i = 0, len = obj.length; i < len; ++i) {
      copy[i] = _clone(obj[i])
    }
    return copy
  }

  // Handle Object
  if (obj instanceof Object) {
    let copy = {}
    for (let attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = _clone(obj[attr])
    }
    return copy
  }

  throw new Error("Unable to copy obj! Its type isn't supported.")
}

/**
 * 重写Page类
 * 增加 $to、$get、$set
 */
const originalPage = Page,
  preLoadHook = 'onPreLoad',
  hooks = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload'],
  // 节流间隔，单位ms
  _throttle = 800
let preLoaders = {}, datasets = {}, _lastTime = null

//通用组件
import commonComps from '../comps/common/index'
/**
 * 重写的Page注册
 */
class NewPage {
  /**
   * @param {String} path 跳转页面路径(pages/ 之后的路径, page/ 的路径要传完整路径)
   * @param {Object} options 页面配置
   * @param {Boolean?} useCommon 是否引入通用组件，默认引入
   */
  constructor(path, options, useCommon = true) {
    //{ObjectArray} options.comps 当前页面的组件
    //{Function} options.onPreLoad 当前页面的预加载函数
    let pgKey = path.includes('page/') ? path : `pages/${path}`,
      //__wxAppCurrentFile__.replace('.js', ''),
      comps = _clone(options.comps) || [], hookArr = {}
    delete options.comps
    if ({}.toString.call(comps) !== '[object Array]')
      throw new Error('using array add components')

    //引入通用组件
    if (useCommon) comps.push({ ...commonComps })

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
      comps = comps.map(c => {
        // 处理 require 引入 export default 导出的情况
        c = c.default || c

        options.data = Object.assign({}, c.data, options.data)
        delete c.data

        _dealHook(c)
        return c
      })
    }

    _dealHook(options)

    for (let h in hookArr) {
      options[h] = function () {
        //这里加生命周期函数的前置全局统一处理
        // switch (h) {
        //   case 'onLoad':
        //     break
        //   case 'onShow':
        //     break
        //   case 'onHide':
        //     break
        //   case 'onUnload':
        //     break
        // }

        // console.log(`invoke ${this.__route__} ${h}`)
        hookArr[h].map(i => {
          i.apply(this, arguments)
        })

        //这里加生命周期函数的后置全局统一处理
        // switch (h) {
        //   case 'onShow':
        //     break
        //   case 'onHide':
        //     break
        //   case 'onUnload':

        //     break
        // }

      }
    }

    if (options[preLoadHook]) {
      preLoaders[pgKey] = options[preLoadHook]
      delete options[preLoadHook]
    }

    // 挂载通用属性
    options.$key = pgKey
    options.$to = this.to
    options.$get = this.dataGet
    options.$set = this.dataSet

    options = Object.assign({}, ...comps, options)
    // console.log('override Page \n pgKey：', pgKey, ' options：', options) // , ' comps：', comps
    return originalPage(options)
  }

  /**
   * 路由跳转
   * this.$to 调用
   * @param {String} path 跳转页面路径(pages/ 之后的路径, page/ 的路径要传完整路径，拼接参数)
   * @param {String?} routeType 跳转类型 同 navigator组件 的 open-type(默认使用 navigate，若当前路由层级已有八级，默认使用 redirect)
   */
  to(path, routeType = 'navigate') {
    // 防连点，函数节流
    let now = + new Date()
    if (_lastTime && now - _lastTime < _throttle) return
    _lastTime = now

    // 后退时 直接调用
    if (routeType == 'navigateBack') {
      wx.navigateBack({ delta: 1 })
      return
    }

    if (!path) return

    wx.vibrateShort && wx.vibrateShort()

    let isSubPage = path.includes('page/'),
      routes = getCurrentPages(),
      data = {},
      isTab = false,
      tabBars = __wxConfig.tabBar && __wxConfig.tabBar.list || [],
      query = path && path.split('?') || [],
      key = `${isSubPage ? '' : 'pages/'}${query[0]}`,
      pagePath = key + '.html'

    path = isSubPage ? path : `/pages/${path}`

    // 解析query参数
    // switchTab 切换的页面 url 不支持 queryString
    // reLaunch 切换的页面若为tabbar页面 不支持 queryString
    if (query[1])
      query[1].split('&').map(q => {
        const [key, value] = q.split('=')
        data[key] = value
      })

    // console.log(`--invoke $to：${routeType} [from "/${this.__route__}",to "${path}"]`, data, routes)

    const ok = () => {
      // console.log(`------> ${routeType} to '${path}' success`)
    }, fail = e => {
      console.error(`------> ${routeType} to ${path}' fail:`, e)
      // wx.$redirectTo({ url: path }).then(ok).catch(fail)
    }, preLoad = () => {
      if (preLoaders[key])
        preLoaders[key].call(this, data)
    }, currIdx = routes.findIndex(r => r.$key === key)

    isTab = tabBars.findIndex(t => t.pagePath === pagePath || t.pagePath === key) > -1

    if (isTab || routeType === 'switchTab') {
      preLoad()
      routeType = '$switchTab'
    }
    else {
      const lastIdx = routes.length - 1
      if (currIdx === lastIdx && (routeType === 'navigate' || routeType === 'redirect')) routeType = '$redirectTo'
      else
        switch (routeType) {
          case 'navigate':
          default:
            preLoad()
            if (currIdx > -1) {
              wx.navigateBack({ delta: lastIdx - currIdx })
              return
            }
            else {
              if (routes.length > 7)
                routeType = '$redirectTo'
              else
                routeType = '$navigateTo'
            }
            break
          case 'redirect':
            preLoad()
            if (currIdx > -1) {
              wx.navigateBack({ delta: lastIdx - currIdx })
              return
            }
            routeType = '$redirectTo'
            break
          case 'reLaunch':
            preLoad()
            routeType = '$reLaunch'
            break
        }
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

/**
 * 替换Page为重写类
 */
Page = function (path, options) {
  return new NewPage(path, options)
}

export {
  originalPage, NewPage,
}
