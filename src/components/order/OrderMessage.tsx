/** Full-page friendly message for invalid/missing table states. */
export function OrderMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-muted">{body}</p>
    </div>
  );
}
