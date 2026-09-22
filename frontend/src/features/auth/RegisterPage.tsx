import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Form, Input, App } from 'antd';
import { ApiError, describeError } from '../../shared/api/http';
import { copy } from '../../shared/copy/en';
import { MAX_EMAIL_LENGTH } from '../../shared/lib/constants';
import { AuthLayout } from './AuthLayout';
import { login, register } from './api';
import { useAuth } from './AuthContext';

interface RegisterFormValues {
  email: string;
  password: string;
}

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function RegisterPage() {
  const [form] = Form.useForm<RegisterFormValues>();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { message } = App.useApp();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    // Registration does not set the session cookie; log in right after.
    mutationFn: async ({ email, password }: RegisterFormValues) => {
      await register(email, password);
      return login(email, password);
    },
    onSuccess: (user) => {
      setUser(user);
      message.success(copy.auth.registerSuccess);
      navigate('/menu', { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
        setErrorMessage(copy.auth.registerFailed);
      } else {
        setErrorMessage(describeError(error));
      }
    },
  });

  return (
    <AuthLayout title={copy.auth.registerTitle}>
      {errorMessage ? (
        <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item
          name="email"
          label={copy.auth.email}
          rules={[
            { required: true, message: copy.auth.emailRequired },
            { type: 'email', message: copy.auth.emailInvalid },
            { max: MAX_EMAIL_LENGTH, message: copy.auth.emailTooLong },
          ]}
        >
          <Input
            type="email"
            autoComplete="email"
            placeholder={copy.auth.emailPlaceholder}
            maxLength={MAX_EMAIL_LENGTH}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={copy.auth.password}
          rules={[
            { required: true, message: copy.auth.passwordRequired },
            {
              validator: (_, value: string) =>
                PASSWORD_PATTERN.test(value ?? '')
                  ? Promise.resolve()
                  : Promise.reject(new Error(copy.auth.passwordRule)),
            },
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={copy.auth.passwordPlaceholder}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
            {copy.auth.registerSubmit}
          </Button>
        </Form.Item>
      </Form>
      <Link to="/login">{copy.auth.toLogin}</Link>
    </AuthLayout>
  );
}
