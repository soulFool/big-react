import type { Props, Key, Ref } from 'shared/ReactTypes'
import type { WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'
// 在tsconfig.ts中配置hostConfig是为了不把hostConfig的实现限制在react-reconciler中，因为对于不同的包都要实现它的hostConfig
import { Container } from 'hostConfig'

export class FiberNode {
	type: any
	tag: WorkTag
	pendingProps: Props
	key: Key
	stateNode: any
	ref: Ref

	return: FiberNode | null
	sibling: FiberNode | null
	child: FiberNode | null
	index: number

	memoizedProps: Props | null
	memoizedState: any
	// 用于切换current和workInProgress这两个fiberNode树
	alternate: FiberNode | null
	// 标记副作用
	flags: Flags
	updateQueue: unknown

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		/** 实例 */
		this.tag = tag
		this.key = key
		// HostComponent <div> div DOM
		this.stateNode = null
		// 例如 对一个FunctionComponent来说，tag是0，type就是函数本身 () => {}
		this.type = null

		/** 节点之间的关系(构成树状结构) */
		// 指向父fiberNode
		this.return = null
		// 指向右边的兄弟fiberNode
		this.sibling = null
		// 指向子fiberNode
		this.child = null
		// 表示自己是兄弟中的第几
		this.index = 0

		this.ref = null

		/** 作为工作单元 */
		// 工作单元刚开始准备工作时的 props
		this.pendingProps = pendingProps
		// 工作单元工作完成后确定下来的 props
		this.memoizedProps = null
		this.memoizedState = null
		this.updateQueue = null

		this.alternate = null
		// 副作用
		this.flags = NoFlags
	}
}

export class FiberRootNode {
	// 保存对应宿主环境挂载节点（对于）
	container: Container
	// 指向hostRootFiber
	current: FiberNode
	// 指向整个更新完成以后的hostRootFiber
	finishedWork: FiberNode | null

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container
		this.current = hostRootFiber
		hostRootFiber.stateNode = this
		this.finishedWork = null
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	// FiberNode的工作原理是双缓存机制，所以传入current，返回alternate
	let wip = current.alternate

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key)
		wip.stateNode = current.stateNode

		wip.alternate = current
		current.alternate = wip
	} else {
		// update
		wip.pendingProps = pendingProps
		wip.flags = NoFlags
	}
	wip.type = current.type
	wip.updateQueue = current.updateQueue
	wip.child = current.child
	wip.memoizedProps = current.memoizedProps
	wip.memoizedState = current.memoizedState

	return wip
}
