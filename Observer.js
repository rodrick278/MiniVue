// 订阅
import compileUtil from './CompileUtil.js'


class Watcher {
  // 为了在更新的时候需要做新旧值判断，然后对节点
  constructor(vm, expr, callback) {
    this.vm = vm
    this.expr = expr
    this.callback = callback
    // 旧值
    this.oldVal = this.getOldVal()
  }
  // new 的时候获取老的值赋值给 watcher
  getOldVal() {
    // ★★★这里很关键，在new Watcher的时候，把这个wathcer挂载到Dep类上，
    /**
     * 这里发布订阅触发的前后步骤：从MVue里开始
     * 1.new Observer 的时候给所有数据绑定了 getter/setter，同时每一层数据 data 都有一个 dep 
     * 2.new Compile 的时候编译节点触发 compileUtil 里 执行 new Watcher 
     * 3.new Watcher 里的 getOldVal（就是现在这个函数）先Dep.target = this，把wathcer自身绑到 Dep 类上，然后调用 compileUtil.getVal
     * 4.getVal里有操作 data[curVal]，会触发这个data[curVal] 的 getter 
     * 5.getter 里判断执行 Dep.target && dep.addSub(Dep.target) 【Dep.target的值第3步加上的】，这样 dep 实例的 subs 就有了一个watcher
     * 6.回到 watcher 的 getOldVal 里，要把 Dep.target 置null，否则下次谁再执行getter的时候，Dep.target 里就有其他的 wathcers，然后这些 wathcers 会被添加进别人的 dep.subs 里
     */
    Dep.target = this
    const oldVal = compileUtil.getVal(this.expr, this.vm)
    Dep.target = null
    return oldVal
  }
  // 更新，是 Dep 的 notify 调用，调用时肯定是产生了数据变化
  update() {
    // 获取新值
    const newVal = compileUtil.getVal(this.expr, this.vm)
    if (newVal !== this.oldVal) {
      this.callback(newVal)
    }
  }
}


// 发布
class Dep {
  constructor() {
    // 用来收集 watchers
    this.subs = []
  }
  // 收集观察者
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 改值的时候，通知观察者去更新
  notify() {
    console.trace("notify通知观察者，当前watcher：", this.subs);
    this.subs.forEach(w => w.update())
  }
}

class Observer {
  constructor(data) {
    this.observer(data)
  }
  observer(data) {
    if (data && typeof data === "object") {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }
  defineReactive(obj, key, value) {
    // 递归遍历
    this.observer(value)
    // ★★★每一层数据 data 都要有一个 dep 
    const dep = new Dep()
    // 劫持所有的 data
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      get() {
        // ★★★如果这个时候已经有Dep.target，则添加进subs
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      /**
       * 1. 调用 this.observer(newVal) 是为了 防止给对象赋值时没有给新的值 设置getter/setter
       *    比如 vm.$data.person={a:1} 整个 person 的指向就改了，需要重新给这个新对象设置一下
       * 2. setter 用箭头函数？因为 this.observer 的 this 应该指向类实例，不用箭头函数就会指向
       *    Object.defineProperty 中的 Object
       */
      set: (newVal) => {
        if (newVal !== value) {
          this.observer(newVal)
          value = newVal
        }
        // 每次更改数据都要通知Dep更新
        dep.notify()
      }
    })

  }
}

export { Observer, Watcher }