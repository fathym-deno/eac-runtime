import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import Button from '../components/Button.tsx';

export const IsIsland = true;

type CounterProps = JSX.HTMLAttributes<HTMLDivElement>;

export default function Counter(props: CounterProps) {
  const [counter, setCounter] = useState(0);

  return (
    <div {...props} class='flex flex-row mx-auto'>
      <Button onClick={() => setCounter(counter + 1)}>
        Add to Count: {counter}
      </Button>
    </div>
  );
}
