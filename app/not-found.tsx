import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-base text-slate-600">That lesson does not exist.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-sky-500 px-6 text-base font-semibold text-white"
      >
        Back to lessons
      </Link>
    </main>
  );
}
