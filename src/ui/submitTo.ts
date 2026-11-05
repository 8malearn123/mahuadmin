import { startTransition, type FormEvent } from 'react';

/**
 * onSubmit handler that runs a form action (e.g. useActionState's dispatcher) without
 * React's automatic form reset. `<form action={fn}>` resets the form after every
 * submission — including ones the server rejects — which puts controlled selects and
 * checkboxes back to their first/initial value on screen while state keeps the user's
 * choice. Forms here keep what the user entered and clear fields explicitly instead.
 */
export function submitTo(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
