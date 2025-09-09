import { Amplify } from 'aws-amplify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let outputs: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  outputs = require('../../amplify_outputs.json');
} catch {
  // amplify_outputs.json doesn't exist during development before deployment
  outputs = {
    version: "1",
    auth: { aws_region: "eu-west-3", user_pool_id: "", user_pool_client_id: "", identity_pool_id: "" },
    data: { aws_region: "eu-west-3", url: "", api_key: "", default_authorization_type: "AMAZON_COGNITO_USER_POOLS" },
    storage: { aws_region: "eu-west-3", bucket_name: "" }
  };
}

Amplify.configure(outputs);

export default Amplify;