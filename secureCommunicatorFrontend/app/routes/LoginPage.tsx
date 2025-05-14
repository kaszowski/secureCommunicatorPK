import Input from '~/components/atoms/Input/Input';
import type { Route } from './+types/LoginPage';
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
    <>
      <div>
        <h1>Login Page</h1>
        <Button variant='contained' color='secondary'>
          TestButton1
        </Button>
        <Button variant='contained' color='error'>
          TestButton2
        </Button>
        <Button variant='contained' color='success'>
          TestButton2
        </Button>
      </div>
      <div>
        <Input id='testid' variant='standard' size='medium' color='success'>
          TestInput1
        </Input>
        <Input id='testid2' variant='filled' size='small' color='error'>
          TestInput2
        </Input>
        <Input id='testid3' variant='outlined' size='medium' color='info'>
          TestInput3
        </Input>
      </div>
    </>
  );
}
