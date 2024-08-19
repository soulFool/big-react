import type { Action } from 'shared/ReactTypes'

export interface Update<State> {
	action: Action<State>
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null
	}
}

/**
 * 代表更新的数据结构update
 */
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	}
}

/**
 * 代表更新队列的数据结构updateQueue
 */
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		}
	} as UpdateQueue<State>
}

/**
 * 关联updateQueue和update
 */
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update
}

/**
 * updateQueue消费update
 * @param baseState 初始状态
 * @param pendingUpdate 需要消费的update
 * @returns 全新的状态
 */
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	}

	if (pendingUpdate !== null) {
		const action = pendingUpdate.action
		if (action instanceof Function) {
			// baseState: 1, update: (x) => 4x, --> memoizedState: 4
			result.memoizedState = action(baseState)
		} else {
			// baseState: 1, update: 2,  --> memoizedState: 2
			result.memoizedState = action
		}
	}

	return result
}
