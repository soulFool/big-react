import internals from 'shared/internals'
import { FiberNode } from './fiber'
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher'
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue'
import { Action } from 'shared/ReactTypes'
import { scheduleUpdateOnFiber } from './workLoop'

// 当前正在render的fiber
let currentlyRenderingFiber: FiberNode | null = null
// 当前正在处理的hook
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null

const { currentDispatcher } = internals

interface Hook {
	memoizedState: any
	updateQueue: unknown
	next: Hook | null // 指向下一个hook
}

export function renderWithHooks(wip: FiberNode) {
	currentlyRenderingFiber = wip
	// 重置 hooks链表
	wip.memoizedState = null

	const current = wip.alternate

	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount
	}

	const Component = wip.type
	const props = wip.pendingProps
	const children = Component(props)

	currentlyRenderingFiber = null
	workInProgressHook = null
	currentHook = null

	return children
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
}

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
}

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = updateWorkInprogressHook()

	// 计算新state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>
	const pending = queue.shared.pending

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending)
		hook.memoizedState = memoizedState
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

function updateWorkInprogressHook(): Hook {
	// TODO: render阶段触发的更新

	// 保存下一个hook
	let nextCurrentHook: Hook | null

	if (currentHook === null) {
		// 这是这个FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate
		if (current !== null) {
			nextCurrentHook = current?.memoizedState
		} else {
			// mount
			nextCurrentHook = null
		}
	} else {
		// 这个FC update时 后续的hook
		nextCurrentHook = currentHook.next
	}

	if (nextCurrentHook === null) {
		// mount或者上一次update时，useState 有 1 2 3 个
		// 本次update时，          useState 有 1 2 3 4 个
		// 所以nextCurrentHook就等于null
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行时的Hook比上次执行时多`
		)
	}

	currentHook = nextCurrentHook as Hook
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	}

	if (workInProgressHook === null) {
		// workInProgressHook === null 说明 现在是mount时的第一个hook
		if (currentlyRenderingFiber === null) {
			// 进入这个判断则说明没有在一个FC组件内调用hook
			throw new Error('请在函数组件内调用hook')
		} else {
			workInProgressHook = newHook
			currentlyRenderingFiber.memoizedState = workInProgressHook
		}
	} else {
		// mount时，后续的hook
		workInProgressHook.next = newHook
		// 更新指向，使可以成为一个单向链表
		workInProgressHook = newHook
	}

	return workInProgressHook
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = mountWorkInprogressHook()

	let memoizedState
	if (initialState instanceof Function) {
		memoizedState = initialState()
	} else {
		memoizedState = initialState
	}

	const queue = createUpdateQueue<State>()
	hook.updateQueue = queue
	hook.memoizedState = memoizedState

	// 使用bind，可以使dispatch在当前FC组件外部使用
	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)
	queue.dispatch = dispatch

	return [memoizedState, dispatch]
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action)
	enqueueUpdate(updateQueue, update)
	scheduleUpdateOnFiber(fiber)
}

function mountWorkInprogressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	}

	if (workInProgressHook === null) {
		// workInProgressHook === null 说明 现在是mount时的第一个hook
		if (currentlyRenderingFiber === null) {
			// 进入这个判断则说明没有在一个FC组件内调用hook
			throw new Error('请在函数组件内调用hook')
		} else {
			workInProgressHook = hook
			currentlyRenderingFiber.memoizedState = workInProgressHook
		}
	} else {
		// mount时，后续的hook
		workInProgressHook.next = hook
		// 更新指向，使可以成为一个单向链表
		workInProgressHook = hook
	}

	return workInProgressHook
}
