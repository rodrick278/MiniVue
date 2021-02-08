import Compile from './Compile.js'
import { Observer } from './Observer.js'

class MVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data()
    this.$options = options

    if (this.$el) {
      window.vm = this
      // 1. 实现一个数据观察者
      new Observer(this.$data)
      // 2. 实现一个指令解析器
      new Compile(this.$el, this)
      // 3. 实现代理this.$data
      this.proxyData(this.$data)
    }
  }
  proxyData(data) {
    for (let key in data) {
      // 这里的this是实例vm
      Object.defineProperty(this, key, {
        get() {
          // 当输入 this.msg/vm.msg 的时候，本身没有msg这个属性，我们劫持他返回$data.msg
          return data[key]
        },
        set(val) {
          data[key] = val
        }
      })
    }
  }
}

export default MVue
