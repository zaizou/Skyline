/**
 * This module defines constants and functions related to Salesforce CLI commands
 * used for retrieving and interacting with metadata.  It provides a structured
 * way to generate commands with appropriate flags and parameters, as well as
 * interfaces for the expected JSON responses.
 */

const JSON_FLAG = "--json";

/**
 * Common prefixes for Salesforce CLI commands.  Used to build complete commands.
 */
export const COMMAND_PREFIX = {
  sfOrgDisplay: `sf org display ${JSON_FLAG}`,
  sfOrgListMetadataTypes: `sf org list metadata-types ${JSON_FLAG}`,
  sfOrgListMetadata: `sf org list metadata --metadata-type`,
  sfProjectRetrieveStart: `sf project retrieve start`,
  sfDataQueryFieldDefinitions: `sf data query --query "SELECT QualifiedApiName, LastModifiedDate, LastModifiedBy.Name, Id FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName IN `
};

/**
 * Functions to generate complete Salesforce CLI commands.
 */
export const COMMANDS = {
  /**
   * Command to display current org information.
   */
  orgDisplay: COMMAND_PREFIX.sfOrgDisplay,
  /**
   * Command to list available metadata types.
   */
  listMetadataTypes: COMMAND_PREFIX.sfOrgListMetadataTypes,
  /**
   * Generates a command to list metadata of a specific type.
   * @param selectedMetadataType The API name of the metadata type to list.
   * @returns The CLI command string.
   */
  listMetadataOfType: (selectedMetadataType: string): string =>
    `${COMMAND_PREFIX.sfOrgListMetadata} ${selectedMetadataType} ${JSON_FLAG}`,
  /**
   * Generates a command to retrieve specific metadata components.
   * @param selectedMetadataRows An array of metadata component names, formatted as "type:fullName".
   * @returns The CLI command string.
   */
  retrieveMetadata: (selectedMetadataRows: string[]) => {
    const metadataStatements: string[] = [];
    for (const row of selectedMetadataRows) {
      metadataStatements.push(` --metadata "${row}"`);
    }
    return `${COMMAND_PREFIX.sfProjectRetrieveStart}${metadataStatements.join(
      " "
    )} --ignore-conflicts ${JSON_FLAG}`;
  },
  /**
   * Generates a command to query field definitions for specified SObjects.
   * @param sObjectApiNames Array of SObject API names.
   * @returns The command string.
   */
  queryFieldDefinitions: (sObjectApiNames: string[]) => {
    return `${
      COMMAND_PREFIX.sfDataQueryFieldDefinitions
    } (${sObjectApiNames.join(", ")})" ${JSON_FLAG}`;
  }
};

/**
 * Represents the connection information for a Salesforce org.
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
 * Represents the response from listing metadata types.
 */
export interface ListMetadataTypesResponse {
  status: number;
  result: MetadataResult;
  warnings: string[];
}

/**
 * Core result of listing metadata types.
 */
interface MetadataResult {
  metadataObjects: MetadataObjectType[];
  organizationNamespace: string;
  partialSaveAllowed: boolean;
  testRequired: boolean;
}

/**
 * Represents a specific metadata type.
 */
export interface MetadataObjectType {
  directoryName: string;
  inFolder: boolean;
  metaFile: boolean;
  suffix: string;
  xmlName: string;
  childXmlNames: string[];
}

/**
 * Represents the response from listing metadata of a specific type.
 */
export interface ListMetadataOfTypeResponse {
  status: number;
  result: MetadataItem[];
  warnings: string[];
}

/**
 * Represents a single metadata item.
 */
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
 * Represents the response from retrieving metadata.
 */
export interface RetrieveMetadataResponse {
  status: number;
  result: RetrieveMetadataResult;
  warnings: string[];
}

/**
 * The core result of retrieving metadata.
 */
interface RetrieveMetadataResult {
  done: boolean;
  fileProperties: FileProperty[];
  id: string;
  status: string;
  success: boolean;
  messages: any[];
  files: File[];
}

/**
 * Represents the properties of a retrieved file.
 */
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

/**
 * Represents a retrieved file.
 */
interface File {
  fullName: string;
  type: string;
  state: string;
  filePath: string;
}

/**
 * Represents the response from querying field definitions.
 */
export interface FieldDefinitionResponse {
  status: number;
  result: FieldDefinitionResult;
  warnings: any[];
}

/**
 * The core result of querying field definitions.
 */
interface FieldDefinitionResult {
  records: FieldDefinitionRecord[];
  totalSize: number;
  done: boolean;
}

/**
 * Represents attributes of a field definition.
 */
interface FieldDefinitionAttribute {
  type: string;
  url: string;
}

/**
 * Represents a single field definition record.
 */
/* eslint-disable @typescript-eslint/naming-convention */
export interface FieldDefinitionRecord {
  attributes: FieldDefinitionAttribute;
  QualifiedApiName: string;
  LastModifiedDate?: string;
  Id: string;
  LastModifiedBy: User;
}

/**
 * Represents a Salesforce user.
 */
interface User {
  Id?: string;
  Name?: string;
}
