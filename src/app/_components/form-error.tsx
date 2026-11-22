import { CircleAlert } from "lucide-react";

type Props = {
  message: string;
};

/** フォームの中に出す入力エラー・送信エラー */
export function FormError({ message }: Props) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
