import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { HostRoot } from './workTags'
import {
	createWorkInProgress,
	type FiberNode,
	type FiberRootNode
} from './fiber'

// 全局的指针，指向正在工作中的fiberNode
let workInProgress: FiberNode | null = null

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {})
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// fiberRootNode
	const root = markUpdateFromFiberToRoot(fiber)
	renderRoot(root)
}

export function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber
	let parent = node.return
	while (parent !== null) {
		node = parent
		parent = parent.return
	}
	if (node.tag === HostRoot) {
		return node.stateNode
	}
	return null
}

function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStack(root)

	do {
		try {
			workLoop()
			break
		} catch (e) {
			if (__DEV__) {
				console.log('workLoop发生错误', e)
			}
			workInProgress = null
		}
	} while (true)

	const finishedWork = root.current.alternate
	root.finishedWork = finishedWork

	// wip fiberNode树和树中的flags
	commitRoot(root)
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitWork(workInProgress)
	}
}

function performUnitWork(fiber: FiberNode) {
	// 开始工作
	const next = beginWork(fiber)
	fiber.memoizedProps = fiber.pendingProps

	// 没有子fiber，递归到最深层
	if (next === null) {
		completeUnitOfWork(fiber)
	} else {
		workInProgress = next
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber

	do {
		completeWork(node)
		const sibling = node.sibling

		if (sibling !== null) {
			workInProgress = sibling
			return
		}

		node = node.return
		workInProgress = node
	} while (node !== null)
}
