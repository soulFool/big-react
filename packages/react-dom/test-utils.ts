import { ReactElementType } from 'shared/ReactTypes'
// import { createRoot } from './src/root' // 不要这个引用，因为ReactDOM是外部依赖，不应该打包在test-utils中，所以不这样引用
// @ts-ignore
import { createRoot } from 'react-dom'

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div')
	// element
	return createRoot(div).render(element)
}
