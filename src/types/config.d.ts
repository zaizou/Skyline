export interface SalesforceEnvironmentConfig {
  label: string;
  instanceUrl: string;
  consumerKey: string;
  username: string;
  secretNames: {
    keySecret: string;
    certificatePath: string;
  };
  testLevels: {
    presubmit:
      | "NoTestRun"
      | "RunSpecifiedTests"
      | "RunLocalTests"
      | "RunAllTestsInOrg";
    deployment:
      | "NoTestRun"
      | "RunSpecifiedTests"
      | "RunLocalTests"
      | "RunAllTestsInOrg";
  };
}

export interface SkylineConfig {
  version: string;
  pipelineOrder: string[];
  branches: {
    [branchName: string]: SalesforceEnvironmentConfig;
  };
}
