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

export interface TicketingSystemConfig {
  system: string;
  customLabel?: string;
  ticketIdRegex: string;
}

export interface SkylineConfig {
  version: string;
  pipelineOrder: string[];
  branches: {
    [branchName: string]: SalesforceEnvironmentConfig;
  };
  ticketing?: TicketingSystemConfig;
}
