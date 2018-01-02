// comps/common/index.js

var timers = {}
const toastKey = 'toast',
  toast = {
    show: function (text, duration = 2600) {
      let _ = this
      console.log('Toast.show', text)
      if (timers[toastKey])
        clearTimeout(timers[toastKey])
      let toastData = { show: 'show', text: text }
      _.setData({ '_toast': toastData })

      timers[toastKey] = setTimeout(function () {
        toast.hide.call(_)
      }, duration)
    },
    hide: function () {
      console.log('Toast.hide')
      if (timers[toastKey])
        clearTimeout(timers[toastKey])
      delete timers[toastKey]
      this.setData({ '_toast.show': '' })
    }
  },
  clearTimer = function () {
    for (let k in timers)
      timers[k] && clearTimeout(timers[k])
    toast.hide.call(this)
  }

module.exports = {
  data: {
  },
  onLoad: function () {
  },
  onHide: function () {
    clearTimer.call(this)
  },
  onUnload: function () {
    clearTimer.call(this)
  },
  toast: toast.show
}
