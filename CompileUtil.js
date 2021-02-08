import { Watcher } from './Observer.js'
// 编译用的工具对象
let compileUtil = {
  getVal(expr, vm) {
    return expr.split(".").reduce((data, curVal) => {
      return data[curVal]
    }, vm.$data)
  },
  setVal(expr, vm, inputVal) {
    expr.split('.').reduce((obj, current) => {
      // 这里是处理类似 person.aa.bb 这种深层对象的情况，只有当到了最后一层，也就是目标不是对象了，才可以赋值
      if (typeof (obj[current]) !== 'object') {
        obj[current] = inputVal;
      }
      return obj[current];
    }, vm.$data);
  },
  // expr 是节点属性值，v-text=msg 的 msg这种
  text(node, expr, vm) {
    // 希望通过 expr=msg 取到 data 里的 msg: "初始信息"
    // 还有可能取 person.fav 这种对象内的值
    // 还有可能是 {{person.fav}} 这种
    let value
    if (expr.indexOf('{{') !== -1) {
      // 处理 {{xxx.xxx}}
      // 懒惰模式正则
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        new Watcher(vm, args[1], () => {
          // ★★这里回调不用参数，因为他这里的expr可能是 {{person.name}}---{{person.age}}
          // 假设这次改的是name="李四"，那么会把整个div从 【张三---18】 整个改掉，改为 【李四】
          this.updater.textUpdater(node, this.getContent(expr, vm))
        })

        // args是这样的: ["{{person.name}}", "person.name", 3, "姓名：{{person.name}}---年龄：{{person.age}"]
        return this.getVal(args[1], vm)
      })
    } else {
      value = this.getVal(expr, vm)
      new Watcher(vm, expr, (newVal) => {
        this.updater.textUpdater(node, newVal)
      })
    }
    this.updater.textUpdater(node, value)

  },
  // ★★文本节点的重新整体全部取值修改
  getContent(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm)
    })
  },
  html(node, expr, vm) {
    const value = this.getVal(expr, vm)
    new Watcher(vm, expr, (newVal) => {
      this.updater.htmlUpdater(node, newVal)
    })
    this.updater.htmlUpdater(node, value)
  },
  model(node, expr, vm) {
    const value = this.getVal(expr, vm)
    // 数据 ==> 视图
    new Watcher(vm, expr, (newVal) => {
      this.updater.modelUpdater(node, newVal)
    })
    // 双向绑定 视图 ==> 数据
    node.addEventListener('input', (e) => {
      this.setVal(expr, vm, e.target.value)
    })

    this.updater.modelUpdater(node, value)
  },
  on(node, expr, vm, eventName) {
    let fn = vm.$options.methods && vm.$options.methods[expr]
    // 注意，这里 this 需要绑定 vm，不然会指向 node
    node.addEventListener(eventName, fn.bind(vm))
  },
  bind(node, expr, vm, attrName) {
    const value = this.getVal(expr, vm)
    new Watcher(vm, expr, (newVal) => {
      // this.updater.htmlUpdater(node, newVal)
      node.setAttribute(attrName, newVal)
    })
    node.setAttribute(attrName, value)
  },
  // 这个 updater 对象存放不同类型 v-xxx 的画面更新处理
  updater: {
    textUpdater(node, value) {
      node.textContent = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    modelUpdater(node, value) {
      node.value = value
    }
  }
}

export default compileUtil
