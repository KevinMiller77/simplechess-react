import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { FargateStack } from './ws-server-stack';

const application = defineBackend({
  auth,
});

const wsServerStack = application.createStack('wsServerStack');
new FargateStack(
  wsServerStack, 
  'FargateStack',
  {
    stage: "local", // MOVE TO SECRET
    hostedZoneId: "Z048431835AMVHOKJWVE8",
    hostedZoneName: "goatchess.com"
  }
);

