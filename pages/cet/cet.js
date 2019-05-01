 // cet.js
 //获取应用实例
 const app = getApp()

 // Page({

 //   /**
 //    * 页面的初始数据
 //    */
 //   data: {
 //     cet: null,
 //     checkcodeImage: null,
 //     cookies: null,
 //     loading: false
 //   },
 //   showTopTips: function(content) {
 //     var that = this;
 //     this.setData({
 //       errorMessage: content
 //     });
 //     setTimeout(function() {
 //       that.setData({
 //         errorMessage: null
 //       });
 //     }, 3000);
 //   },
 //   loadCheckCodeImage() {
 //     const page = this
 //     wx.request({
 //       url: "https://www.gdeiassistant.cn/rest/cet/checkcode",
 //       method: "GET",
 //       success: function(result) {
 //         if (result.data.success) {
 //           page.setData({
 //             checkcodeImage: "data:image/jpg;base64," + result.data.data,
 //             cookies: result.header["Set-Cookie"]
 //           })
 //         } else {
 //           wx.showModal({
 //             title: '加载验证码图片失败',
 //             content: result.data.message,
 //             showCancel: false,
 //             success: function(res) {
 //               if (res.confirm) {
 //                 wx.navigateBack({
 //                   delta: 1
 //                 })
 //               }
 //             }
 //           })
 //         }
 //       },
 //       fail: function() {
 //         wx.showModal({
 //           title: '加载验证码图片失败',
 //           content: '网络连接超时，请重试',
 //           showCancel: false,
 //           success: function(res) {
 //             if (res.confirm) {
 //               wx.navigateBack({
 //                 delta: 1
 //               })
 //             }
 //           }
 //         });
 //       }
 //     })
 //   },
 //   formSubmit(e) {
 //     const page = this
 //     var name = e.detail.value.name
 //     var number = e.detail.value.number
 //     var checkcode = e.detail.value.checkcode
 //     if (name && number && checkcode) {
 //       wx.showNavigationBarLoading()
 //       this.setData({
 //         loading: true
 //       })
 //       var requestData = {
 //         name: name,
 //         number: number,
 //         checkcode: checkcode
 //       }
 //       wx.request({
 //         url: "https://www.gdeiassistant.cn/rest/cetquery",
 //         method: "POST",
 //         header: {
 //           "Content-Type": "application/x-www-form-urlencoded",
 //           "Cookie": page.data.cookies
 //         },
 //         data: requestData,
 //         success: function(result) {
 //           wx.hideNavigationBarLoading()
 //           page.setData({
 //             loading: false
 //           })
 //           if (result.data.success) {
 //             page.setData({
 //               cet: {
 //                 name: result.data.data.name,
 //                 school: result.data.data.school,
 //                 type: result.data.data.type,
 //                 admissionCard: result.data.data.admissionCard,
 //                 totalScore: result.data.data.totalScore,
 //                 listeningScore: result.data.data.listeningScore,
 //                 readingScore: result.data.data.readingScore,
 //                 writingAndTranslatingScore: result.data.data.writingAndTranslatingScore
 //               }
 //             })
 //           } else {
 //             wx.showModal({
 //               title: '查询失败',
 //               content: result.data.message,
 //               showCancel: false
 //             })
 //           }
 //         },
 //         fail: function() {
 //           wx.hideNavigationBarLoading()
 //           this.setData({
 //             loading: false
 //           })
 //           wx.showModal({
 //             title: '查询失败',
 //             content: '网络连接超时，请重试',
 //             showCancel: false
 //           });
 //         }
 //       });
 //     } else {
 //       this.showTopTips("请填写查询信息")
 //     }
 //   },

 //   /**
 //    * 生命周期函数--监听页面加载
 //    */
 //   onLoad: function(options) {
 //     this.loadCheckCodeImage()
 //   },

 //   /**
 //    * 生命周期函数--监听页面初次渲染完成
 //    */
 //   onReady: function() {

 //   },

 //   /**
 //    * 生命周期函数--监听页面显示
 //    */
 //   onShow: function() {

 //   },

 //   /**
 //    * 生命周期函数--监听页面隐藏
 //    */
 //   onHide: function() {

 //   },

 //   /**
 //    * 生命周期函数--监听页面卸载
 //    */
 //   onUnload: function() {

 //   },

 //   /**
 //    * 页面相关事件处理函数--监听用户下拉动作
 //    */
 //   onPullDownRefresh: function() {

 //   },

 //   /**
 //    * 页面上拉触底事件的处理函数
 //    */
 //   onReachBottom: function() {

 //   },

 //   /**
 //    * 用户点击右上角分享
 //    */
 //   onShareAppMessage: function() {

 //   }
 // })