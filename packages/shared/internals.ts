// 实现不同时机中hooks的实现，因为希望reconciler和react之间是解耦的，所以写在shared中进行中转

import * as React from 'react'

const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

export default internals
