import type { Props, Key, Ref } from 'shared/ReactTypes'
import type { WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'

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
	// 用于切换current和workInProgress这两个fiberNode树
	alternate: FiberNode | null
	// 标记副作用
	flags: Flags

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

		this.alternate = null
		// 副作用
		this.flags = NoFlags
	}
}
