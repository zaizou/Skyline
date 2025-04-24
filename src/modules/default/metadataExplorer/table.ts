import {
  MetadataObjectType,
  MetadataItem,
  FieldDefinitionRecord
} from "./sfCli";

const DEFAULT_LAST_MODIFIED_DATE = "1970-01-01T00:00:00.000Z";
const DEFAULT_LAST_MODIFIED_BY = "Salesforce";

export enum ICONS {
  loading = "utility:spinner",
  complete = "utility:check",
  empty = "standard:empty"
}

export const COLUMNS = [
  { label: "Metadata Type", fieldName: "metadataType", sortable: true },
  { label: "Full Name", fieldName: "label", sortable: true },
  {
    label: "Last Modified By",
    fieldName: "lastModifiedByName",
    sortable: true
  },
  {
    label: "Last Modified Date",
    fieldName: "lastModifiedDate",
    type: "date",
    typeAttributes: {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    },
    sortable: true
  },
  {
    fieldName: "status",
    label: "Status",
    cellAttributes: { iconName: { fieldName: "statusIcon" } }
  }
];

export interface TableRow {
  id: string;
  label?: string;
  fullName?: string;
  metadataType?: string;
  lastModifiedByName?: string;
  lastModifiedDate?: string;
  sObjectApiName?: string;
  type?: string;
  _children?: TableRow[];
  statusIcon?: string;
}

export function convertMetadataObjectTypeToTableRow(
  metadataObjectType: MetadataObjectType
): TableRow {
  return {
    id: metadataObjectType.xmlName,
    label: metadataObjectType.xmlName,
    metadataType: metadataObjectType.xmlName
  };
}

export function convertMetadataItemToTableRow(
  metadataItem: MetadataItem
): TableRow {
  const sObjectApiName = getObjectNameFromFileName(metadataItem.fileName);
  return {
    id: metadataItem.fullName,
    label: metadataItem.fullName.replace(`${sObjectApiName}.`, ""),
    fullName: metadataItem.fullName,
    lastModifiedByName:
      metadataItem.lastModifiedByName ?? DEFAULT_LAST_MODIFIED_BY,
    lastModifiedDate:
      metadataItem.lastModifiedDate ?? DEFAULT_LAST_MODIFIED_DATE,
    sObjectApiName: sObjectApiName,
    type: metadataItem.type
  };
}

export function convertFieldDefinitionRecordToTableRow(
  sObjectApiName: string,
  record: FieldDefinitionRecord
): TableRow {
  return {
    id: `${record.Id}.${record.QualifiedApiName}`,
    label: record.QualifiedApiName,
    fullName: `${sObjectApiName}.${record.QualifiedApiName}`,
    lastModifiedByName: record.LastModifiedBy?.Name ?? DEFAULT_LAST_MODIFIED_BY,
    lastModifiedDate: record.LastModifiedDate ?? DEFAULT_LAST_MODIFIED_DATE,
    type: "CustomField"
  };
}

function getObjectNameFromFileName(fileName: string): string {
  const firstSlashIndex = fileName.indexOf("/");
  if (firstSlashIndex === -1) {
    return "";
  }
  const firstDotAfterSlashIndex = fileName.indexOf(".", firstSlashIndex + 1);
  if (firstDotAfterSlashIndex === -1) {
    return fileName.substring(firstSlashIndex + 1);
  }
  return fileName.substring(firstSlashIndex + 1, firstDotAfterSlashIndex);
}
