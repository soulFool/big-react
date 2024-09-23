## reconciler的工作方式

- 对于同一个节点，比较其`ReactElement`与`fiberNode`，生成`子fiberNode`。
- 并根据比较的结果生成不同标记（插入、删除、移动......），对应不同宿主环境API的执行

[![pkOwoHU.md.png](https://s21.ax1x.com/2024/07/31/pkOwoHU.md.png)](https://imgse.com/i/pkOwoHU)

当所有ReactElement比较完后，会生成一棵fiberNode树，一共会存在两棵fiberNode树：

- current：与视图中真实UI对应的fiberNode树
- workInProgress：触发更新后，正在reconciler中计算的fiberNode树

[双缓冲技术介绍](https://blog.csdn.net/wwwlyj123321/article/details/126447825)

## JSX消费的顺序

[DFS 深度优先遍历与 BFS 广度优先遍历详解](https://houbb.github.io/2020/01/23/data-struct-learn-08-dfs-bfs)

以DFS（深度优先遍历）的顺序遍历ReactEmelent，这意味着：

- 如果有子节点，遍历子节点
- 如果没有子节点，遍历兄弟节点

这是个递归的过程，存在递、归两个阶段：

- 递：对应beginWork
- 归：对应completeWork

## 如何触发更新

常见的触发更新的方式：

- ReactDOM.createRoot().render（或老版的ReactDOM.render）
- this.setState
- useState的dispatch方法

### 更新机制的组成部分

- 代表更新的数据结构 ———— Update
- 消费update的数据结构 ———— UpdateQueue

[![pkzSZmF.png](https://s21.ax1x.com/2024/08/07/pkzSZmF.png)](https://imgse.com/i/pkzSZmF)

接下来的工作包括：

- 实现mount时调用的API
- 将该API接入上述更新机制中

需要考虑的事情：

- 更新可能发生于任意组件，而更新流程是从根节点递归的
- 需要一个统一的根节点保存通用信息

[![pkzu43T.png](https://s21.ax1x.com/2024/08/08/pkzu43T.png)](https://imgse.com/i/pkzu43T)

## mount流程

更新流程的目的：

- 生成wip fiberNode树
- 标记副作用flags

更新流程的步骤：

- 递：beginWork
- 归：completeWork

### beginWork

对于以下结构的reactElement：

```html
<a>
	<b />
</a>
```

当进入A的beginWork时，通过对比b的current fiberNode与b的reactElement，生成b对应的wip fiberNode。

在此过程中最多会标记2类与「结构变化」相关的flags：

- Placement：
  插入：a -> ab 移动：abc -> bca
- ChildDeletion：
  删除：ul>li\*3 -> ul>li\*1

不包含与「属性变化」相关的flag：

- Update：

```html
<img title="123" /> -> <img title="456" />
```

#### 实现与Host相关节点的beginWork

HostRoot的beginWork工作流程：

1. 计算状态的最新值
2. 创造子fiberNode

HostComponent的beginWork工作流程：

1. 创造子fiberNode

HostText没有beginWork工作流程（因为它没有子节点）

```html
<p>123456</p>
```

#### beginWork性能优化策略

```html
<div>
	<p>练习时长</p>
	<span>两年半</span>
</div>
```

理论上mount流程完毕后包含的flags：

- 两年半 Placement
- span Placement
- 练习时长 Placement
- p Placement
- div Placement

相比于执行5次Placement，我们可以构建好「离屏DOM树」后，对div执行1次Placement操作。

### completeWork

需要解决的问题：

- 对于Host类型fiberNode：构建离屏DOM树
- 标记Update flag（TODO）

#### completeWork性能优化策略

flags分布在不同fiberNode中，利用completeWork向上遍历（归）的流程，将子fiberNode的flags冒泡到父fiberNode

## 初探ReactDOM

react内部3个阶段：

- schedule阶段
- render阶段（beginWork completeWork）
- commit阶段（commitWork）

### commit阶段的3个子阶段

- beforeMutation阶段
- mutation阶段
- layout阶段

### 当前commit阶段要执行的任务

- fiber树的切换
- 执行Placement对应操作

需要注意的问题，考虑如下JSX，如果span含有flag，该如何找到它：

```html
<App>
	<div>
		<span>111</span>
	</div>
</App>
```

## 实现useState

hook脱离FC上下文，仅仅是普通函数，如何让他拥有感知上下文的能力？
比如说：

- hook如何知道他是在另一个hook的上下文环境内执行？

```JavaScript
function App() {
  useEffect(() => {
    // 执行useState时怎么知道处在useEffect上下文？
    useState(0)
  })
}
```

- hook怎么知道当前是mount还是update？

解决方案：在不同上下文中调用的hook不是同一个函数。

[![pAnFMfe.png](https://s21.ax1x.com/2024/09/11/pAnFMfe.png)](https://imgse.com/i/pAnFMfe)

实现「内部数据共享层」时的注意事项：

以浏览器举例，Reconciler + hostConfig = ReactDOM

增加「内部数据共享层」，意味着Reconciler与React产生关联。

如果两个包「产生关联」，在打包时需要考虑：两者的代码是打包在一起还是分开？

如果打包在一起，意味着打包后的ReactDOM中会包含React的代码，那么ReactDOM中会包含一个内部数据共享层，React中也会包含一个内部数据共享层，这两者不是同一个内部数据共享层。

而我们希望两者共享数据，所以不希望ReactDOM中会包含React的代码。

- hook如何知道他是在另一个hook的上下文环境内执行？

```JavaScript
function App() {
  useEffect(() => {
    // 执行useState为什么能正确的状态
    const [num] = useState(0)
  })
}
```

可以记录当前正在render的FC对应的fiberNode，在fiberNode中保存hook数据

[![pAneKtP.png](https://s21.ax1x.com/2024/09/12/pAneKtP.png)](https://imgse.com/i/pAneKtP)

hook在不同更新时的调用顺序不能变，这就是因为采用链表的数据结构保存hook的数据

## update流程

update流程和mount流程的区别。

对于beginWork：

- 需要处理ChildDeletion的情况
- 需要处理节点移动的情况（abc -> bca）

对于completeWork：

- 需要处理HostText内容更新的情况
- 需要处理HostComponent属性变化的情况

对于commitWork：

- 对于completeWork，需要遍历被删除的子树

对于useState：

- 实现相对于mountState的updateState

### beginWork流程

暂时先处理单一节点，先不做「节点移动」的情况。需要处理：

- singleElement
- singleTextNode

处理流程为：

1. 比较是否可以复用current fiber
   - 比较key，如果key不同，不能复用
   - 比较type，如果type不同，不能复用
   - 如果key和type都相同，可以复用
2. 不能复用，则创建新的（同mount流程），可以复用则复用旧的

注意：对于同一个fiberNode，即使反复更新，current、wip这两个fiberNode会重复使用

### completeWork流程

主要处理「标记Update」的情况，先处理HostText内容更新的情况

### commitWork流程

对于标记ChildDeletion的子树，由于子树中：

- 对于FC，需要处理useEffect unmount执行、解绑ref
- 对于HostComponent，需要解绑ref
- 对于子树的「根HostComponent」，需要一处DOM

所以需要实现「遍历ChildDeletion子树」的流程

### 对于useState

需要实现：

- 针对update时的dispatcher
- 实现对标mountWorkInProgressHook的updateWorkInProgressHook
- 实现updateState中「计算新state的逻辑」

其中updateWorkInProgressHook的实现需要考虑的问题：

- hook数据从哪来？
- 交互阶段触发的更新

```JSX

<div onClick={() => update(1)}></div>

```

- render阶段触发的更新（TODO）

```JSX
function App() {
  const [num, update] = useState(1)
  // 触发更新
  update(100)
  return <div>{num}</div>
}

```

## 事件系统

事件系统本质上根植于浏览器事件模型，所以他隶属于ReactDOM，在实现时要做到对Reconciler 0侵入

实现事件系统需要考虑：

- 模拟实现浏览器事件捕获、冒泡流程
- 实现合成事件对象
- 方便后续拓展

### 实现ReactDOM与Reconciler对接

将事件回调保存在DOM中，通过以下两个时机对接：

- 创建DOM时
- 更新属性时

### 模拟实现浏览器事件流程
