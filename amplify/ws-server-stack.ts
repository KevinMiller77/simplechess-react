import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { GoatchessStackProps } from './src/cdk-constructs/common';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { GOATCHESS_STAGE_CONFIG } from './src/common/stage-config';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class FargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, private props: GoatchessStackProps) {
    super(scope, id, props);

    new ecsp.ApplicationLoadBalancedFargateService(this, `GoatChess-WebSocket-Service-${props.stage}`, {
        serviceName: `goatchess-websocket-service-${props.stage}`,
        loadBalancerName: `goatchess-websocket-lb-${props.stage}`,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(
            './amplify/ws-server', 
            {
              platform: Platform.LINUX_AMD64
            }
          ),
          containerPort: 8765,
        },
        publicLoadBalancer: true,
        protocol: ApplicationProtocol.HTTPS,
        domainName: GOATCHESS_STAGE_CONFIG[props.stage].domains.WS,
        domainZone: HostedZone.fromHostedZoneAttributes(
          this, 
          `GoatChess-HostedZone-${props.stage}`, 
          {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.hostedZoneName,
          }
        ),
        redirectHTTP: true,
      }
    );
  }
}