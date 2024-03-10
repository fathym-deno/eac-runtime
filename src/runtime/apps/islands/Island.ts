import { ComponentType } from 'preact';

export type Island = {
  Component: ComponentType;

  Contents: string;

  Path: string;
};
