// app/politique-cookies/page.tsx
export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-4xl font-bold">Politique cookies</h1>

        <section className="space-y-3 text-slate-300 leading-8">
          <p>
            Le site SmartQHSE Academy peut utiliser des cookies et autres traceurs pour assurer son bon
            fonctionnement, mesurer l’audience et améliorer l’expérience utilisateur.
          </p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Cookies strictement nécessaires</h2>
          <p>
            Certains cookies sont indispensables au fonctionnement du site, à l’authentification
            et à la sécurité.
          </p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Cookies soumis à consentement</h2>
          <p>
            Les cookies de mesure d’audience, de personnalisation ou de services tiers ne sont déposés
            qu’après votre consentement lorsqu’il est requis.
          </p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Gestion de vos choix</h2>
          <p>
            Vous pouvez accepter, refuser ou paramétrer l’utilisation des cookies depuis le bandeau
            de consentement prévu à cet effet.
          </p>
        </section>
      </div>
    </main>
  );
}