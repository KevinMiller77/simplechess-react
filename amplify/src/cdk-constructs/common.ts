import * as cdk from 'aws-cdk-lib';

export interface GoatchessStackProps extends cdk.StackProps {
    readonly stage: string;
    readonly hostedZoneId: string;
    readonly hostedZoneName: string;
}