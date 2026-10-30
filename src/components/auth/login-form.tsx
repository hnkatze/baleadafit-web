"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isEmailInvalid = submitted && !EMAIL_PATTERN.test(email);
  const isPasswordInvalid =
    submitted && password.length < MIN_PASSWORD_LENGTH;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setNotice(null);

    if (!EMAIL_PATTERN.test(email) || password.length < MIN_PASSWORD_LENGTH) {
      return;
    }

    // TODO(#2): signInWithEmailAndPassword de Firebase Auth y guardar el ID token
    // para enviarlo como Authorization: Bearer en cada request a la API.
    setNotice(
      "Credenciales válidas. Falta conectar Firebase Auth (issue #2) para autenticar de verdad.",
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-foreground/65">
          Portal clínico para nutricionistas. Ingresá con tu cuenta
          institucional.
        </p>
      </header>

      <TextField
        fullWidth
        isRequired
        isInvalid={isEmailInvalid}
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
      >
        <Label>Correo electrónico</Label>
        <Input placeholder="nutri@baleadafit.hn" autoComplete="email" />
        <FieldError>Ingresá un correo válido.</FieldError>
      </TextField>

      <TextField
        fullWidth
        isRequired
        isInvalid={isPasswordInvalid}
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
      >
        <Label>Contraseña</Label>
        <Input placeholder="Mínimo 8 caracteres" autoComplete="current-password" />
        <FieldError>La contraseña necesita al menos 8 caracteres.</FieldError>
      </TextField>

      <div className="flex items-center justify-between gap-4">
        <Checkbox isSelected={rememberMe} onChange={setRememberMe} name="remember-me">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            Mantener sesión
          </Checkbox.Content>
        </Checkbox>
        <span className="text-xs text-foreground/55">
          Acceso restringido a personal clínico
        </span>
      </div>

      <Button type="submit" fullWidth>
        Entrar
      </Button>

      {notice ? (
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Autenticación pendiente</Alert.Title>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </form>
  );
}
