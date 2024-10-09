import * as commonConfigJson from '../../configuration/common-config.json'

interface ICommonConfig {
    hostedZoneId: string,
    hostedZoneName: string,
}

export const GOATCHESS_COMMON_CONFIG = commonConfigJson as ICommonConfig;