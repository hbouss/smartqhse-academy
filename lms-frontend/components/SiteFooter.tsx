// components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-lg font-semibold text-white">SmartQHSE Academy</p>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Plateforme de formation QHSE, IA et automatisation éditée par Power HSE SRL.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-300">
            <Link href="/mentions-legales" className="hover:text-cyan-400">
              Mentions légales
            </Link>
            <Link href="/conditions-generales-de-vente" className="hover:text-cyan-400">
              Conditions générales de vente
            </Link>
            <Link href="/politique-de-confidentialite" className="hover:text-cyan-400">
              Politique de confidentialité
            </Link>
            <Link href="/politique-cookies" className="hover:text-cyan-400">
              Politique cookies
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} SmartQHSE Academy - Power HSE SRL. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}