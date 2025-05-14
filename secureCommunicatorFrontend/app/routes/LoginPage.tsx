import type { Route } from './+types/home';
import { Button } from '~/components/atoms/Button/Button';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'SC' },
    { name: 'description', content: 'Secure Communicator' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ];
}

export default function LoginPage() {
  return (
    <div>
      <h1>Login Page</h1>
      <Button variant='contained'>TestButton1</Button>
      <Button variant='contained'>TestButton2</Button>
    </div>
  );
}
