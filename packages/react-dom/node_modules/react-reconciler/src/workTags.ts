export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText

export const FunctionComponent = 0 // 函数组件
export const HostRoot = 3 // 项目挂载的根节点   React.render()
export const HostComponent = 5 // 例：<div>
export const HostText = 6 // 标签中的文本   例：<div>123</div> 中的 123
