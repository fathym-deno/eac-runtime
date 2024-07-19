import { Action, ActionProps } from '@fathym/atomic';

type ButtonProps = ActionProps;

export default function Button(props: ButtonProps) {
  return <Action {...props} />;
}
