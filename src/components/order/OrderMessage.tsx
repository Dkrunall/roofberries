/** Full-page friendly message for invalid/missing table states. */
export function OrderMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-[#faf7f0] px-6 text-center text-[#30251f]">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-[#78675c]">{body}</p>
    </div>
  );
}
