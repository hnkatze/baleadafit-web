import { Alert } from "@heroui/react";
import { describeApiError } from "@/lib/api/error-message";

type Props = {
  /** Fallback heading; a 403 gets its own, because it is not a reading failure. */
  title: string;
  error: unknown;
};

/** Renders the copy owned by `describeApiError` (see `@/lib/api/error-message`). */
export function ApiErrorAlert({ title, error }: Props) {
  const { heading, description } = describeApiError(error, title);

  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{heading}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
