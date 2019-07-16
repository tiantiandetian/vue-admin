const app = getApp(); var timer;
Page({

  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    navigationBarHeight: app.globalData.platform == "android" ? (app.globalData.statusBarHeight + 50) : (app.globalData.statusBarHeight + 45),
    tab: 0,
    firtab: 0
  },
  onLoad: function (options) {
    timer = new Object;
    console.log(!wx.getStorageSync('firstOpenLive'))
    if (!wx.getStorageSync('firstOpenLive') && wx.getStorageSync('cityArea')) this.setData({ showTotail: true });
    app.post("/Shop/Emcee", {
      op: "Home"
    }, res => {
      if (res.msg) return app.msg(res.msg);
      if (res.data.live.list.length == 0) return this.setData(res.data);
      if (!wx.getStorageSync('cityArea')) return wx.redirectTo({
        url: '/live_show/pages/sel_area',
      })
      res.data.cityArea = wx.getStorageSync('cityArea');
      for (let i = 0; i < res.data.live.list.length; i++) {
        // if (!res.data.live.list[i].ltime) continue;
        // if (timer[res.data.live.list[i].id]) continue;
        app.wego.runTimer(rs => {
          timer[res.data.live.list[i].id] = rs;
          this.setData({ timer });
        }, res.data.live.list[i].ltime, "shoplive.home." + res.data.live.list[i].id)
      }
      this.setData(res.data);
      this.catid = 0;
      this.nextPage = res.data.live.nextPage;
    })
    //绑定邀约用户
    if (options.userid) app.bindUser(options.userid);
  },

  onShow: function () {

  },
  //开始关闭阴影层
  changeCovers() {
    this.setData({ showTotail: false });
    wx.setStorageSync('firstOpenLive', true);
  },
  //去其他地方
  toTab(e) {
    let url = e.currentTarget.dataset.url;
    if (url == null) return;
    wx.navigateTo({
      url: url,
      fail: function () {
        wx.switchTab({
          url: url,
        })
      }
    })
  },
  //预约直播
  toMakeTime(e) {
    let idx = e.detail.target.dataset.idx;
    let isyuyue = e.detail.target.dataset.isyuyue;
    let liveid = e.detail.target.dataset.id;
    let formid = e.detail.formId;
    console.log(isyuyue);
    if (isyuyue != '0') return app.msg("您已经预约过该直播哦~");
    app.post("/Shop/Emcee", { op: "YuYue", formid, liveid }, res => {
      if (res.msg) return app.msg(res.msg);
      this.data.live.list[idx].isyuyue = 1;
      this.setData({ 'live.list': this.data.live.list });
      app.msg("预约成功哦~");
    })
  },
  //去地区选择
  toArea() {
    wx.redirectTo({
      url: '/live_show/pages/sel_area',
    })
  },
  //去商品详情
  toGoodsdetail(e) {
    let goodsid = e.currentTarget.dataset.goodsid;
    wx.navigateTo({
      url: `/serviceSystem/pages/goodsDetail?goodsid=${goodsid}`,
    })
  },
  //pk点赞
  upPk(e) {
    if (this.pkloading) return app.msg("数据加载中，请耐心等候~");
    let liveid = e.currentTarget.dataset.id;
    let idx = e.currentTarget.dataset.idx;
    let sta = e.currentTarget.dataset.sta;
    let ns = `livePk[${liveid}]`;
    if (app.data[ns]) return app.msg("您已经点过赞了哦~");
    this.pkloading = true;
    app.post("/Shop/Emcee", {
      op: "AddZan",
      liveid
    }, res => {
      this.pkloading = false;
      if (res.msg) return app.msg(res.msg);
      app.data[ns] = true;
      app.msg("点赞成功哦~");
      if (sta == 1) {
        this.data.pk[idx].zan1 = parseInt(this.data.pk[idx].zan1) + 1;
      } else {
        this.data.pk[idx].zan2 = parseInt(this.data.pk[idx].zan2) + 1;
      }
      this.setData({
        pk: this.data.pk
      });
    })
  },
  //打开直播
  openLive() {
    return wx.navigateTo({ url: "/live_show/pages/createlive" });
    this.setData({ openLive: !this.data.openLive });
  },
  //阻止冒泡
  pre() {
    console.log("阻止冒泡");
  },
  //切换大tab
  changeTab(e) {
    let tab = e.currentTarget.dataset.tab;
    if (tab == 0) {
      this.getLiveList(1, this.catid, data => {
        this.nextPage = data.live.nextPage;
        for (let i = 0; i < data.live.list.length; i++) {
          // if (!data.live.list[i].ltime) continue;
          // if (timer[data.live.list[i].id]) continue;
          app.wego.runTimer(rs => {
            timer[data.live.list[i].id] = rs;
            this.setData({ timer });
          }, data.live.list[i].ltime, "shoplive.home." + data.live.list[i].id)
        }
        this.setData({
          live: data.live,
          tab
        });
      })
    } else if (tab == 1) {

      this.getLiveList(1, 0, data => {
        this.nextPage = data.live.nextPage;
        for (let i = 0; i < data.live.list.length; i++) {
          // if (!data.live.list[i].ltime) continue;
          // if (timer[data.live.list[i].id]) continue;
          app.wego.runTimer(rs => {
            timer[data.live.list[i].id] = rs;
            this.setData({ timer });
          }, data.live.list[i].ltime, "shoplive.home." + data.live.list[i].id)
        }
        this.setData({
          live: data.live,
          tab
        });
      }, this.data.cityArea.cityid)
    } else if (tab == 2) {
      this.getFollowList(data => {
        this.setData({
          tab,
          mylikes: data.mylikes
        });
      });
    } else {
      this.ranklist(1, data => {
        this.nextPage = data.rank.nextPage;
        this.setData({
          tab,
          rank: data.rank
        });
      });
    }
  },
  //切换小tab
  changefirtab(e) {
    let firtab = e.currentTarget.dataset.firtab;
    this.catid = e.currentTarget.dataset.id;
    this.getLiveList(1, this.catid, data => {
      this.nextPage = data.live.nextPage;
      for (let i = 0; i < data.live.list.length; i++) {
        // if (!data.live.list[i].ltime) continue;
        // if (timer[data.live.list[i].id]) continue;
        app.wego.runTimer(rs => {
          timer[data.live.list[i].id] = rs;
          this.setData({ timer });
        }, data.live.list[i].ltime, "shoplive.home." + data.live.list[i].id)
      }
      this.setData({
        firtab,
        live: data.live
      });
    })
  },
  //live列表
  getLiveList(page, catid, func, cityid) {
    if (this.liveloading) return app.msg("数据加载中，请耐心等候~");
    this.liveloading = true;
    let form = {
      op: "LiveList",
      page,
      catid
    };
    if (cityid) form.cityid = cityid;
    app.post("/Shop/Emcee", form, res => {
      this.liveloading = false;
      if (res.msg) return app.msg(res.msg);
      func && func(res.data);
    })
  },
  //关注列表
  getFollowList(func) {
    if (this.followloading) return app.msg("数据加载中，请耐心等候~");
    //  if(this.data.followList) return;
    this.followloading = true;
    app.post("/Shop/Emcee", {
      op: "MyLike"
    }, res => {
      this.followloading = false;
      if (res.msg) return app.msg(res.msg);
      func && func(res.data);
    })
  },
  //排行
  ranklist(page, func) {
    if (this.rankloading) return app.msg("数据加载中，请耐心等候~");
    this.rankloading = true;
    app.post("/Shop/Emcee", {
      op: "RoomRank",
      page
    }, res => {
      this.rankloading = false;
      if (res.msg) return app.msg(res.msg);
      func && func(res.data);
    })
  },
  //关注店铺
  followShop(e) {
    let shopid = e.currentTarget.dataset.shopid;
    let idx = e.currentTarget.dataset.index;
    let tag = e.currentTarget.dataset.tag;
    if (this.shoploading) return app.msg("数据加载中，请耐心等候~")
    this.shoploading = true;
    app.post("/Api/Shop/getShopUserFollow", {
      flag: 1,
      shopid
    }, res => {
      this.shoploading = false;
      if (res.msg) return app.msg(res.msg);
      if (tag == 1) {
        this.data.tuijian[idx].isgz = 1;
        this.setData({
          tuijian: this.data.tuijian
        });
      } else {
        this.data.rank.list[idx].isgz = 1;
        this.setData({
          'rank.list': this.data.rank.list
        });
      }
      app.msg("关注成功哦~");
    })
  },
  //去直播间
  tolive(e) {
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/live_show/pages/liveaction?id=${id}`,
    })
  },
  //banner跳转
  toDetail(e) {
    let url = e.currentTarget.dataset.url;
    if (!url || url == null) return;
    wx.navigateTo({
      url: url,
      fail: function () {
        wx.switchTab({
          url: url,
        })
      }
    })
  },
  //去搜索
  toSearch() {
    wx.navigateTo({
      url: `/live_show/pages/search`,
    })
  },
	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
  onPullDownRefresh: function () {
    if (this.reloading) return app.msg("数据加载中，请耐心等候~");
    wx.showLoading({
      title: '加载中~'
    });
    this.reloading = true;
    app.post("/Shop/Emcee", {
      op: "Home"
    }, res => {
      wx.stopPullDownRefresh();
      this.reloading = false;
      wx.hideLoading();
      if (res.msg) return app.msg(res.msg);
      // let catname = {};
      // for (let i = 0; i < res.data.cata.length; i++) {
      // 	catname[res.data.cata[i].id] = res.data.cata[i].name;
      // }
      // res.data.catname = catname;
      for (let i = 0; i < res.data.live.list.length; i++) {
        // if (!res.data.live.list[i].ltime) continue;
        // if (timer[res.data.live.list[i].id]) continue;
        app.wego.runTimer(rs => {
          timer[res.data.live.list[i].id] = rs;
          this.setData({ timer });

        }, res.data.live.list[i].ltime, "shoplive.home." + res.data.live.list[i].id)
      }
      res.data.tab = 0;
      res.data.firtab = 0;
      this.setData(res.data);
      this.catid = 0;
      this.nextPage = res.data.live.nextPage;
    })
  },

	/**
	 * 页面上拉触底事件的处理函数
	 */
  onReachBottom: function () {
    if (this.nextPage == 0) return app.msg("已经没有更多了哦~");
    if (this.data.tab == 0) {
      this.getLiveList(this.nextPage, this.catid, data => {
        this.nextPage = data.live.nextPage;
        data.live.list = this.data.live.list.concat(data.live.list);
        for (let i = 0; i < data.live.list.length; i++) {
          // if (!data.live.list[i].ltime) continue;
          // if (timer[data.live.list[i].id]) continue;
          app.wego.runTimer(rs => {
            timer[data.live.list[i].id] = rs;
            this.setData({ timer });
          }, data.live.list[i].ltime, "shoplive.home." + data.live.list[i].id)
        }
        this.setData({
          live: data.live
        });
      })
    } else if (this.data.tab == 1) {
      this.getLiveList(this.nextPage, 0, data => {
        this.nextPage = data.live.nextPage;
        data.live.list = this.data.live.list.concat(data.live.list);
        for (let i = 0; i < data.live.list.length; i++) {
          // if (!data.live.list[i].ltime) continue;
          // if (timer[data.live.list[i].id]) continue;
          app.wego.runTimer(rs => {
            timer[data.live.list[i].id] = rs;
            this.setData({ timer });
          }, data.live.list[i].ltime, "shoplive.home." + data.live.list[i].id)
        }
        this.setData({
          live: data.live
        });
      }, this.data.cityArea.cityid);
    } else if (this.data.tab == 2) {

    } else {
      this.ranklist(this.nextPage, data => {
        this.nextPage = data.rank.nextPage;
        data.rank.list = this.data.rank.list.concat(data.rank.list);
        this.setData({
          rank: data.rank
        });
      });
    }
  },

	/**
	 * 用户点击右上角分享
	 */
  onShareAppMessage: function (e) {
    return app.sharePage({ title: this.data.share });
  }
})