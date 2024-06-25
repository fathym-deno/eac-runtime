import {
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDatabases,
  EverythingAsCodeIdentity,
  EverythingAsCodeLicensing,
  // EverythingAsCodeSynaptic,
} from '../src.deps.ts';

export type EaCRuntimeEaC =
  & EverythingAsCode
  & EverythingAsCodeApplications
  & EverythingAsCodeDatabases
  & EverythingAsCodeIdentity
  // & EverythingAsCodeSynaptic
  & EverythingAsCodeLicensing;
