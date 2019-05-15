(function (w) {

  //上报事件的地址
  const REPORT_EVENT_URL = 'url';
  //唯一ID
  var EVENTFRONTUVID = null;

  var reportEvent = {
    ajax: function (obj) {
      let xhr = new XMLHttpRequest();
      xhr.open(obj.type || 'POST', obj.url, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
          obj.callback && obj.callback(JSON.parse(xhr.response))
        }
      };
      xhr.send(obj.data);
    },
    //按条件循环方法，配合filterEmptyObj使用
    each: function (data, callback) {
      for (let x in data) {
        let d = callback(x, data[x]);
        if (d === false) {
          break;
        }
      }
    },
    //过滤空对象
    filterEmptyObj: function (obj) {
      let o = {};
      this.each(obj, function (i, d) {
        if (d !== null) {
          o[i] = d;
        }
      });
      return o;
    },
    //用于生成frontUvId
    creatfrontUvId4: function (len, radix) {
      var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
      var uuid = [], i;
      radix = radix || chars.length;

      if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
      } else {
        var r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
          if (!uuid[i]) {
            r = 0 | Math.random() * 16;
            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
          }
        }
      }

      return uuid.join('');
    },
    //对frontUvId逻辑处理
    getFrontUvId: function () {
      //读取本地存储的frontUvId
      EVENTFRONTUVID = localStorage.getItem("eventFrontUvId");
      //有frontUvId就直接返回，没有重新生成，保存在本地，并返回
      if (EVENTFRONTUVID === null) {
        //生成新的frontUvId
        EVENTFRONTUVID = this.creatfrontUvId4(32,16);
        //frontUvId存在本地
        localStorage.setItem("eventFrontUvId", EVENTFRONTUVID);
      }
      return EVENTFRONTUVID;
    },
    //过滤空参数 + 序列化对象
    serialize: function (obj) {
      //清空为null的对象
      obj = this.filterEmptyObj(obj);
      //序列化参数
      let parameter = '?';
      for (let key in obj) {
        parameter += `${key}=${obj[key]}&`
      }
      parameter = parameter.substring(0, parameter.length - 1);
      return parameter;
    },
    //上报事件方法
    reportEventFunc: function (obj, callback) {
      //拿frontUvId
      obj.frontUvId = this.getFrontUvId();
      //post提交接口
      this.ajax({
        type: 'POST',
        url: `${REPORT_EVENT_URL}${this.serialize(obj)}`,
        data: {},
        callback: (res) => {
          callback && callback(res)
        }
      })
    },
    //获取元素属性，掉用上报事件
    getDomeAttribute: function (dome) {
      //获取属性参数
      let eventData = dome.getAttribute('data-reporteventdata');
      if (eventData) {
        //判断类型，如果是字符串类型，转换类型
        eventData = typeof eventData == 'string' ? eval('(' + eventData + ')') : JSON.parse(eventData);
        //此判断es5写法，对兼容有要求的可以更换为 Object.prototype.toString.call(eventData) === '[object Array]'
        //如果是数组，循环上报事件，如果是对象直接上报事件
        if (Array.isArray(eventData)) {
          for (let si = 0; si < eventData.length; si++) {
            this.reportEventFunc(eventData[si]);
          }
        } else {
          this.reportEventFunc(eventData);
        }
      }
    }
  }


  w.onload = function () {
    let body = document.getElementsByTagName("body")[0];

    //事件委托，检测拥有指定参数
    body.onclick = function (ev) {
      var ev = ev || w.event;
      //查找当前dome的dome树
      for (let i = 0; i < ev.path.length; i++) {
        if (ev.path[i].getAttribute && ev.path[i].getAttribute('data-reporteventfunc') == 'click') {
          //只需要传入满足条件的节点
          reportEvent.getDomeAttribute(ev.path[i]);
        }
      }
    };
  }
  w.reportEvent = reportEvent;

})(window)
