const JSON_FLAG = "--json";

export const COMMAND_PREFIX = {
  sfOrgDisplay: `sf org display ${JSON_FLAG}`,
  sfOrgListMetadataTypes: `sf org list metadata-types ${JSON_FLAG}`,
  sfOrgListMetadata: `sf org list metadata --metadata-type`,
  sfProjectRetrieveStart: `sf project retrieve start`,
  sfDataQueryFieldDefinitions: `sf data query --query "SELECT QualifiedApiName, LastModifiedDate, LastModifiedBy.Name, Id FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName IN `
};

export const COMMANDS = {
  orgDisplay: COMMAND_PREFIX.sfOrgDisplay,
  listMetadataTypes: COMMAND_PREFIX.sfOrgListMetadataTypes,
  listMetadataOfType: (selectedMetadataType: string): string =>
    `${COMMAND_PREFIX.sfOrgListMetadata} ${selectedMetadataType} ${JSON_FLAG}`,
  retrieveMetadata: (selectedMetadataRows: string[]) => {
    const metadataStatements: string[] = [];
    for (const row of selectedMetadataRows) {
      metadataStatements.push(` --metadata "${row}"`);
    }
    return `${COMMAND_PREFIX.sfProjectRetrieveStart}${metadataStatements.join(
      " "
    )} --ignore-conflicts ${JSON_FLAG}`;
  },
  queryFieldDefinitions: (sObjectApiNames: string[]) => {
    return `${
      COMMAND_PREFIX.sfDataQueryFieldDefinitions
    } (${sObjectApiNames.join(", ")})" ${JSON_FLAG}`;
  }
};

/**
 * Result from `orgDisplay`
 */
export interface SalesforceConnectionInfo {
  status: number;
  result: {
    id: string;
    devHubId: string;
    apiVersion: string;
    accessToken: string;
    instanceUrl: string;
    username: string;
    clientId: string;
    status: string;
    expirationDate: string;
    createdBy: string;
    edition: string;
    orgName: string;
    createdDate: string;
    signupUsername: string;
    alias: string;
  };
  warnings: string[];
}

/**
 * Result from `listMetadataTypes`
 */
export interface ListMetadataTypesResponse {
  status: number;
  result: MetadataResult;
  warnings: string[];
}

interface MetadataResult {
  metadataObjects: MetadataObjectType[];
  organizationNamespace: string;
  partialSaveAllowed: boolean;
  testRequired: boolean;
}

export interface MetadataObjectType {
  directoryName: string;
  inFolder: boolean;
  metaFile: boolean;
  suffix: string;
  xmlName: string;
  childXmlNames: string[];
}

/**
 * Result for `listMetadataOfType`
 */
export interface ListMetadataOfTypeResponse {
  status: number;
  result: MetadataItem[];
  warnings: string[];
}

export interface MetadataItem {
  createdById: string;
  createdByName: string;
  createdDate: string;
  fileName: string;
  fullName: string;
  id: string;
  lastModifiedById: string;
  lastModifiedByName: string;
  lastModifiedDate: string;
  manageableState: string;
  type: string;
}

/**
 * Result from `retrieveMetadata`
 */
export interface RetrieveMetadataResponse {
  status: number;
  result: RetrieveMetadataResult;
  warnings: string[];
}

interface RetrieveMetadataResult {
  done: boolean;
  fileProperties: FileProperty[];
  id: string;
  status: string;
  success: boolean;
  messages: any[];
  files: File[];
}

interface FileProperty {
  createdById: string;
  createdByName: string;
  createdDate: string;
  fileName: string;
  fullName: string;
  id: string;
  lastModifiedById: string;
  lastModifiedByName: string;
  lastModifiedDate: string;
  manageableState: string;
  type: string;
}

interface File {
  fullName: string;
  type: string;
  state: string;
  filePath: string;
}

/**
 * Result from `queryFieldDefinitions`
 */
export interface FieldDefinitionResponse {
  status: number;
  result: FieldDefinitionResult;
  warnings: any[];
}

interface FieldDefinitionResult {
  records: FieldDefinitionRecord[];
  totalSize: number;
  done: boolean;
}

interface FieldDefinitionAttribute {
  type: string;
  url: string;
}

export interface FieldDefinitionRecord {
  attributes: FieldDefinitionAttribute;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  QualifiedApiName: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LastModifiedDate?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Id: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LastModifiedBy: User;
}

interface User {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Id?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Name?: string;
}
