# MiniVue

手写实现Mini版Vue

实现过程：

[图片来源](https://juejin.cn/post/6844904183938678798)

![img](https://gitee.com/rodrick278/img/raw/master/img/172970655167cff7)

### 发布订阅的关键步骤



   这里发布订阅触发的前后步骤：从MVue里开始

1. new Observer 的时候给所有数据绑定了 getter/setter，同时每一层数据 data 都有一个 dep

2. new Compile 的时候编译节点触发 compileUtil 里 执行 new Watcher

3. new Watcher 里的 getOldVal（就是现在这个函数）先Dep.target = this，把wathcer自身绑到 Dep 类上，然后调用 compileUtil.getVal

4. getVal里有操作 data[curVal]，会触发这个data[curVal] 的 getter

5. getter 里判断执行 Dep.target && dep.addSub(Dep.target) 【Dep.target的值第3步加上的】，这样 dep 实例的 subs 就有了一个watcher

6. 回到 watcher 的 getOldVal 里，要把 Dep.target 置null，否则下次谁再执行getter的时候，Dep.target 里就有其他的 wathcers，然后这些 wathcers 会被添加进别人的 dep.subs 里

   