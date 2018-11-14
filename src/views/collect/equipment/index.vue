<template>
  <div class="main">
    <div id="title" class="title">
      <span id="data">设备总数量:{{ device_count }}</span>
    </div>
    <div id="container" />
  </div>
</template>

<script>
import '@/assets/equipment/mapplugs.js'
import { data } from '@/mock/EquipmentData'
const qq = window.qq
export default {
  name: 'Equipment',
  data() {
    return {
      show: true,
      device_count: 0
    }
  },
  mounted() {
    var self = this
    // 请求接口数据返回值后修改data相关参数即可
    this.device_count = data.device_count
    this.map = new qq.maps.Map(document.getElementById('container'), {
      center: new qq.maps.LatLng(37.550339, 104.114129),
      zoom: 5,
      mapTypeControl: false,
      scaleControl: false,
      zoomControl: false,
      panControl: false
    })

    this.density = new qq.maps.plugin.Dots({
      data: data.device_info.splice(0),
      map: self.map,
      debug: 0,
      maxCount: 200,
      splits: 8,
      style: {
        fillColor: 'rgba(255, 0, 0, 0.8)',
        strokeColor: 'rgba(255, 255, 255, 0.2)',
        strokeWidth: 0,
        radius: 1.5
      },
      onClick: function(e) {
        console.info(e)
      }
    })

    qq.maps.event.addListener(self.map, 'idle', function() {
      self.zoom = self.map.getZoom()
      // console.log(self.zoom+"######")
      // if(self.show && (self.zoom > 12)){
      //     self.show = false
      //     self.density.hide()
      // }
      //
      // if(!self.show && (self.zoom < 12)){
      //     self.show = true
      //     self.density.show()
      // }
    })
  },
  methods: {}
}
</script>

<style scoped rel="stylesheet/scss" lang="scss">
.main{
  .title {
    position: absolute;
    text-align: center;
    width: 100%;
    top: 40px;
    z-index: 999999;
    font-size: 24px;
    color: #fff;
    span{
      padding: 10px 30px;
      background: rgba(0,64,255,0.5);
      border-radius: 5px;
    }
  }
  #container{
    height: 100vh;
  }
}
</style>

