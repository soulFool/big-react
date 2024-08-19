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
