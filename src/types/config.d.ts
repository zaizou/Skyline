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
  pipelineOrder: number; // Lower numbers come first in the pipeline
}

export interface SkylineConfig {
  version: string;
  branches: {
    [branchName: string]: SalesforceEnvironmentConfig;
  };
}
