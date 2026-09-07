import Link from "next/link";

export default function OwnerSignInPrompt() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        Owner Access
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
        Sign in to manage this shop
      </h1>
      <Link
        href="/owner/login"
        className="mt-lg flex h-11 w-full items-center justify-center rounded-md bg-primary text-button font-semibold text-on-primary"
      >
        Sign in
      </Link>
    </div>
  );
}
