import * as configJson from "../../configuration/stage-config.json"

// Configuration mapping from json
interface IDomainsConfig {
    APIG: string,
    FRONT: string,
    WS: string,
}

interface IStageConfig {
    domains: IDomainsConfig
}

type TStageConfigs = { [stage: string]: IStageConfig };
export const GOATCHESS_STAGE_CONFIG = configJson as TStageConfigs;

// Configuration keys
export enum EnviornmentKeys {
    STAGE = 'STAGE',
}
