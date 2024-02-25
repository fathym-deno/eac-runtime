import { JSX } from 'preact';
import { EaCRuntimeHandler } from '@fathym/eac/runtime';

export const middleware: EaCRuntimeHandler[] = [
  (_req, ctx) => {
    return ctx.next();
  },
];

export default function Layout({ Component: JSX.Element }) {

}