import {
  EverythingAsCode,
  EverythingAsCodeAI,
  EverythingAsCodeApplications,
  EverythingAsCodeDatabases,
  EverythingAsCodeIdentity,
  EverythingAsCodeLicensing,
} from '../src.deps.ts';

export type EaCRuntimeEaC =
  & EverythingAsCode
  & EverythingAsCodeApplications
  & EverythingAsCodeDatabases
  & EverythingAsCodeIdentity
  & EverythingAsCodeAI
  & EverythingAsCodeLicensing;
