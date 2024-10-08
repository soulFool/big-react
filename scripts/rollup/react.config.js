import {
	getPackageJSON,
	resolvePkgPath,
	getBaseRollupPlugins
} from './utils.js'
import generatePackageJson from 'rollup-plugin-generate-package-json'

const { name, module } = getPackageJSON('react')
// react包的路径
const pkgPath = resolvePkgPath(name)
// react产物路径
const pkgDistPath = resolvePkgPath(name, true)

/**
 * 调试打包结果  pnpm link文档：https://pnpm.io/zh/cli/link
 */
export default [
	// react
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'React',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugins(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	// jsx-runtime
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			}
		],
		plugins: getBaseRollupPlugins()
	}
]
