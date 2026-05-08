import React from "react";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
  }
) {
  const { className = "", variant = "primary", ...rest } = props;

  const variantClass =
    variant === "primary"
      ? "bg-black text-white hover:bg-gray-800"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-white text-gray-900 border hover:bg-gray-50";

  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...rest}
    />
  );
}

export function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return <Button variant="secondary" {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;

  return (
    <input
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 ${className}`}
      {...rest}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className = "", ...rest } = props;

  return (
    <textarea
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 ${className}`}
      {...rest}
    />
  );
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}
      {...rest}
    />
  );
}

export function Badge({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: string;
}) {
  const color =
    status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "processing"
      ? "bg-yellow-100 text-yellow-700"
      : status === "failed"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium">{children}</label>;
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  if (!children) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <ErrorBox>{children}</ErrorBox>;
}

export function SuccessBox({ children }: { children: React.ReactNode }) {
  if (!children) return null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
      {children}
    </div>
  );
}

export function SuccessText({ children }: { children: React.ReactNode }) {
  return <SuccessBox>{children}</SuccessBox>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}
