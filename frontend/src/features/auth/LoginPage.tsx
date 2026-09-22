import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { ApiError, describeError } from '../../shared/api/http';
import { copy } from '../../shared/copy/en';
import { MAX_EMAIL_LENGTH } from '../../shared/lib/constants';
import { AuthLayout } from './AuthLayout';
import { login } from './api';
import { useAuth } from './AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/menu';

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginFormValues) => login(email, password),
    onSuccess: (user) => {
      setUser(user);
      navigate(user.role === 'ADMIN' ? '/console/dishes' : from, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage(copy.auth.loginFailed);
      } else {
        setErrorMessage(describeError(error));
      }
    },
  });

  return (
    <AuthLayout title={copy.auth.loginTitle}>
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
          rules={[{ required: true, message: copy.auth.passwordRequired }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
            {copy.auth.loginSubmit}
          </Button>
        </Form.Item>
      </Form>
      <Link to="/register">{copy.auth.toRegister}</Link>
    </AuthLayout>
  );
}
