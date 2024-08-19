// 递归中的递阶段

import { HostComponent, HostRoot, HostText } from './workTags'
import { processUpdateQueue, type UpdateQueue } from './updateQueue'
import { reconcileChildFibers, mountChildFibers } from './childFibers'
import type { FiberNode } from './fiber'
import type { ReactElementType } from 'shared/ReactTypes'

export const beginWork = (wip: FiberNode) => {
	// 比较，返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip)

		case HostComponent:
			return updateHostComponent(wip)

		case HostText:
			return null

		default:
			if (__DEV__) {
				console.warn('beginWork未实现的类型')
			}
			break
	}
	return null
}

function updateHostRoot(wip: FiberNode) {
	/** 计算状态最新值 */
	// 基础state，首屏渲染中不存在
	const baseState = wip.memoizedState
	const updateQueue = wip.updateQueue as UpdateQueue<Element>
	// 参与计算的update
	const pending = updateQueue.shared.pending
	updateQueue.shared.pending = null
	// 计算
	const { memoizedState } = processUpdateQueue(baseState, pending)
	wip.memoizedState = memoizedState

	/** 创造子fiberNode */
	// 首屏渲染中nextChildren就是传入的那个reactElement
	const nextChildren = wip.memoizedState
	// 对比current fiberNode和reactElement
	reconcileChildren(wip, nextChildren)
	return wip.child
}

function updateHostComponent(wip: FiberNode) {
	// hostComponent内无法触发更新，所以没有更新过程

	const nextProps = wip.pendingProps
	// jsx的reactElement存在props的children中
	const nextChildren = nextProps.children
	reconcileChildren(wip, nextChildren)
	return wip.child
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate

	// mount时的alternate还没有值
	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current?.child, children)
	} else {
		// mount
		/**
		 * mount流程都不追踪副作用，理论上没有fiberNode被标记为Placement，
		 * 而我们希望的是对根节点执行一次Placement
		 * 实际上这种情况我们已经实现了，在准备开始更新，执行初始化（prepareFreshStack）的时候，我们会创建一个workInProgress，
		 * 这个workInProgress就是hostRootFiber的，所以它同时存在current和workInProgress，所以他会执行一次update，被插入一个Placement的flags，
		 * 通过这个flags，就会执行1次DOM插入操作
		 */
		wip.child = mountChildFibers(wip, null, children)
	}
}
