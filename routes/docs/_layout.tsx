import { JSX } from 'preact';
import { EaCRuntimeHandler } from '@fathym/eac/runtime';

export const middleware: EaCRuntimeHandler[] = [
  (req, ctx) => {
    return ctx.next();
  },
];

export default function Layout({ Component: JSX.Element }) {

}