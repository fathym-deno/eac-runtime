import {
  EverythingAsCode,
  EverythingAsCodeAI,
  EverythingAsCodeApplications,
  EverythingAsCodeDatabases,
  EverythingAsCodeIdentity,
} from '../src.deps.ts';

export type EaCRuntimeEaC =
  & EverythingAsCode
  & EverythingAsCodeApplications
  & EverythingAsCodeDatabases
  & EverythingAsCodeIdentity
  & EverythingAsCodeAI;
