import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="container-x flex flex-col items-start justify-between gap-6 text-sm text-ink-3 sm:flex-row sm:items-center">
        <Logo />
        <p>Foundation · продукт в разработке · {new Date().getFullYear()}</p>
        <a href="#access" className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">
          Ранний доступ
        </a>
      </div>
    </footer>
  );
}
