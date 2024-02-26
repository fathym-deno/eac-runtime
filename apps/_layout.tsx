import { JSX } from 'preact';
import { Button } from '../components/Button.tsx';

export default function Layout() {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Fathym Open Biotech</title>

        <link rel="shortcut icon" type="image/png" href="./thinky.png" />
        <link rel="stylesheet" href="/styles.css" />
      </head>

      <body class="bg-slate-50 dark:bg-slate-900 text-black dark:text-white">
        <Button />
      </body>
    </html>
  );
}
