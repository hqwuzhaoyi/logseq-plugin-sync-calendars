import { ErrorAlertProps } from "@/components/ErrorAlert";

export const handleError = (error: unknown, setError: (message: ErrorAlertProps["message"]) => void) => {
  if (error instanceof Error) {
    setError({
      content: error.message,
      duration: 30000,
    });
  } else {
    setError({
      content: "An unknown error occurred",
      duration: 30000,
    });
  }
};
