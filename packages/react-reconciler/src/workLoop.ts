import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import type { FiberNode } from './fiber'

// 全局的指针，指向正在工作中的fiberNode
let workInProgress: FiberNode | null = null

function prepareFreshStack(fiber: FiberNode) {
	workInProgress = fiber
}

function renderRoot(root: FiberNode) {
	// 初始化
	prepareFreshStack(root)

	do {
		try {
			workLoop()
			break
		} catch (e) {
			console.log('workLoop发生错误', e)
			workInProgress = null
		}
	} while (true)
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
