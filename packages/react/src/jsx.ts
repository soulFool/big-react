import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'

import type {
	Type,
	Key,
	Ref,
	Props,
	ReactElementType,
	ElementType
} from 'shared/ReactTypes'

/**
 * jsx方法或React.createElement方法的执行返回结果就是ReactElement的数组结构
 */
const ReactElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE, // 内部使用，用来表明当前数据结构是一个ReactElement
		type,
		key,
		ref,
		props,
		__mark: 'Sun' // 用于和真正的ReactElement区分
	}
	return element
}

/**
  <div>123</div>

  import { jsx as _jsx } from "react/jsx-runtime";
  _jsx("div", {
    id: "111",
    children: "123"
  });
 */
export const jsx = (
	type: ElementType,
	config: any,
	...maybeChildren: any[]
) => {
	let key: Key = null
	let ref: Ref = null
	const props: Props = {}

	for (const prop in config) {
		const val = config[prop]
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val
			}
			continue
		}

		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val
			}
			continue
		}

		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val
		}
	}

	const maybeChildrenLength = maybeChildren.length
	if (maybeChildrenLength) {
		// child   [child, child, child]
		if (maybeChildrenLength === 1) {
			props.children = maybeChildren[0]
		} else {
			props.children = maybeChildren
		}
	}

	return ReactElement(type, key, ref, props)
}

export const jsxDEV = (type: ElementType, config: any) => {
	let key: Key = null
	let ref: Ref = null
	const props: Props = {}

	for (const prop in config) {
		const val = config[prop]
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val
			}
			continue
		}

		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val
			}
			continue
		}

		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val
		}
	}

	return ReactElement(type, key, ref, props)
}
