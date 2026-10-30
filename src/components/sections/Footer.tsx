import { RadiantMark } from "@/components/hero/RadiantMark";

export function Footer() {
  return (
    <footer className="border-t border-hair py-12">
      <div className="container-x flex flex-col gap-6 text-[13px] text-ivory-60 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-3 text-ivory">
          <RadiantMark size={22} />
          <span className="serif text-[18px] tracking-[0.08em]">Foundation</span>
        </span>
        <p>Продукт в разработке · {new Date().getFullYear()}</p>
        <a href="#access" className="link-quiet">
          Ранний доступ
        </a>
      </div>
    </footer>
  );
}
