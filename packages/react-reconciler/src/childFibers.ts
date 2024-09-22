import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import type { Props, ReactElementType } from 'shared/ReactTypes'
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber'
import { HostText } from './workTags'
import { ChildDeletion, Placement } from './fiberFlags'

/**
 *
 * @param shouldTrackEffects 是否追踪副作用
 */
function ChildReconciler(shouldTrackEffects: boolean) {
	/**
	 * 删除子fiber
	 * @param returnFiber 需要删除的fiber节点的父节点
	 * @param childToDelete 需要删除的fiber节点
	 */
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			// 不需要追踪副作用就直接return
			return
		}
		const deletions = returnFiber.deletions
		if (deletions === null) {
			// deletions === null 说明当前这个父fiber底下没有需要被删除的子fiber
			returnFiber.deletions = [childToDelete]
			returnFiber.flags |= ChildDeletion
		} else {
			deletions.push(childToDelete)
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key
		work: if (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// type相同
						const existing = useFiber(currentFiber, element.props)
						existing.return = returnFiber
						return existing
					}
					// 删掉旧的（然后后面再执行mount时的根据element创建新的fiber）
					deleteChild(returnFiber, currentFiber)
					break work
				} else {
					if (__DEV__) {
						console.warn('还未实现的react类型', element)
						break work
					}
				}
			} else {
				// 删掉旧的（然后后面再执行mount时的根据element创建新的fiber）
				deleteChild(returnFiber, currentFiber)
			}
		}

		// 根据element创建fiber
		const fiber = createFiberFromElement(element)
		fiber.return = returnFiber
		return fiber
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 类型没变，可以复用
				const existing = useFiber(currentFiber, { content })
				existing.return = returnFiber
				return existing
			}
			// 进入这里说明，需要更新为HostText，而之前不是HostText
			deleteChild(returnFiber, currentFiber)
		}

		const fiber = new FiberNode(HostText, { content }, null)
		fiber.return = returnFiber
		return fiber
	}

	// 判断是否需要追踪副作用flags
	function placeSingleChild(fiber: FiberNode) {
		// 因为传进来的fiber是新创建的，所以它是workInProgress，所以如果workInProgress.alternate === null，那么它就是首屏渲染
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement
		}
		return fiber
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					)

				default:
					if (__DEV__) {
						console.warn('未实现的reconcile类型', newChild)
					}
					break
			}
		}

		// TODO: 多节点的情况 ul> li*3

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			)
		}

		if (currentFiber !== null) {
			// 兜底删除
			deleteChild(returnFiber, currentFiber)
		}

		if (__DEV__) {
			console.warn('未实现的reconcile类型', newChild)
		}

		return null
	}
}

/**
 * 处理复用的方法
 * @param fiber 需要复用fiber节点
 * @param pendingProps
 */
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps)
	clone.index = 0
	clone.sibling = null
	return clone
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
