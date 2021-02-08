// 编译用的工具对象
import compileUtil from "./CompileUtil.js"

class Compile {
  constructor(el, vm) {
    // 如果传入的已经是一个节点对象则不处理，否则根据传入的表达式去取得这个节点
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    // 1. 做一个文档碎片，文档碎片存储在内存中
    let fragment = this.node2Fragment(this.el)
    // 2. 对获取到的整个模板 el 进行编译
    this.compile(fragment)
    // 3. 再把子元素一个个添加回根元素
    this.el.append(fragment)
  }
  /**
   * 编译所有子节点，内部根据不同节点类型调用不同的元素处理方法
      <h2>姓名：{{person.name}}---年龄：{{person.age}</h2>
      <h3>兴趣：{{person.fav}}</h3>
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
      </ul>
      <div v-html="htmlStr"></div>
      <div v-text="msg"></div>
      <input type="text" v-model="msg">
   */
  compile(node) {
    // 1. 获取子节点
    [...node.childNodes].forEach(child => {
      if (this.isElementNode(child)) {
        // 是元素节点
        // 元素节点需要继续递归处理内部子节点 
        if (child.hasChildNodes()) {
          this.compile(child)
        }
        // 编译元素节点
        this.compileElement(child)
      } else {
        // 文本节点
        // 编译文本节点
        this.compileText(child)
      }
    })
  }
  // 编译所有的【元素节点】，处理每个节点中有： v-xx  @ ：这些vue的属性 
  compileElement(node) {
    // 获取所有属性然后遍历
    const attrs = node.attributes;
    [...attrs].forEach(attr => {
      // 每个属性都有自己的 name 和 value
      const { name, value } = attr
      // 判断是否是 v-xx 属性(即我们自定义的)
      if (this.isDirective(name)) {
        // 匹配出v-后的内容
        const directive = /v-(.+)/.exec(name)[1] // text html model on:click bind
        // 针对 on:click 这种事件的处理
        const [dirName, eventName] = directive.split(':')// text html model on bind
        // 针对性处理每种事件，传入当前节点，值（msg），当前vm，可能用的到的事件名（如果有事件的话）
        // 数据 => 视图
        compileUtil[dirName](node, value, this.vm, eventName)

        // 删除有指令的标签上的属性
        // name 是 v-xxx ，directive 是 xxx
        node.removeAttribute(name)

      } else if (this.isEventAt(name)) {// 处理 @click 这种事件
        // 匹配出 @ 后的内容
        const eventName = /@(.+)/.exec(name)[1]
        compileUtil["on"](node, value, this.vm, eventName)
        node.removeAttribute(name)
      } else if (this.isBind(name)) {
        // 匹配出 : 后的内容
        const attrName = /:(.+)/.exec(name)[1]
        compileUtil["bind"](node, value, this.vm, attrName)
        node.removeAttribute(name)
      }
    })
  }
  // 编译所有的【文本节点】{{xx.xx}} 这种类型
  compileText(node) {
    // {{xxx}}
    const content = node.textContent
    // 懒惰模式正则
    if (/\{\{(.+?)\}\}/.test(content)) {
      compileUtil.text(node, content, this.vm)
    }
  }
  // 处理 @ 语法糖
  isEventAt(name) {
    return name.startsWith('@')
  }
  // 处理 : 语法糖
  isBind(name) {
    return name.startsWith(':')
  }
  // 判断是否是 v-xx 属性
  isDirective(name) {
    return name.startsWith("v-")
  }
  /**
   * @description: 把传入的整个节点转换成文档碎片,以免造成过多的回流重绘
   * @param {*} node
   */
  node2Fragment(node) {
    const f = document.createDocumentFragment()
    let child
    while (child = node.firstChild) {
      f.append(child)
    }
    return f
  }
  /**
   * @description: 判断el是否是节点对象
   * @param {*} node 节点对象
   */
  isElementNode(node) {
    /**
     * 元素节点==1、文本节点==3、document==9
     */
    return node.nodeType === 1;
  }
}

export default Compile