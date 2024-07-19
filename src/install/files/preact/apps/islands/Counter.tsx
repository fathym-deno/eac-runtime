import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import Button from '../components/Button.tsx';
import { AddIcon } from '../../build/iconset/icons/AddIcon.tsx';

export const IsIsland = true;

type CounterProps = JSX.HTMLAttributes<HTMLDivElement>;

export default function Counter(props: CounterProps) {
  const [counter, setCounter] = useState(0);

  return (
    <div {...props} class='flex flex-row mx-auto'>
      <Button onClick={() => setCounter(counter + 1)}>
        <AddIcon class='h-6 w-6 inline-block' /> Add to Count: {counter}
      </Button>
    </div>
  );
}
