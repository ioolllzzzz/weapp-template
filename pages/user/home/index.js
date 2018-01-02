// pages/user/home/index.js
const app = getApp(),
  pageKey = 'user/home/index',
  getData = function () {
    return Promise.all(['somepromise', 'otherpromise'])
  }

Page(pageKey, {

  /**
   * 页面的初始数据
   */
  data: {

  },
  onPreLoad: function (data) {
    console.log('---onPreLoad---', data)
    this.$set(pageKey, getData())
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.$get(pageKey).then(([a, b]) => {

      console.log('onLoad get data', a, b)
    }).catch(e => {
      console.error('onLoad get fail', e)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})