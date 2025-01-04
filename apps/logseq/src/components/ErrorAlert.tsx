import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";

export interface ErrorAlertProps {
  message?: {
    content: string;
    duration: number;
  };
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] =
    useState<ErrorAlertProps["message"]>();

  useEffect(() => {
    if (message !== currentMessage) {
      setCurrentMessage(message);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, message?.duration || 1000); // 默认30秒后隐藏错误提示
    }
  }, [message, currentMessage]);

  if (!visible) return null;

  return (
    <div
      style={{ position: "fixed", top: "10px", right: "10px", zIndex: 1000 }}
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message?.content}</AlertDescription>
      </Alert>
    </div>
  );
}
