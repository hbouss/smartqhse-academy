// app/politique-de-confidentialite/page.tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-4xl font-bold">Politique de confidentialité</h1>

        <section className="space-y-3 text-slate-300 leading-8">
          <p>
            Power HSE SRL traite les données personnelles collectées via SmartQHSE Academy
            afin de gérer les comptes utilisateurs, les achats, l’accès aux formations, le support
            et la sécurité de la plateforme.
          </p>
          <p><strong>Responsable du traitement :</strong> Power HSE SRL</p>
          <p><strong>Adresse :</strong> Rue de la petite guirlande 8, 7000 Mons, Belgique</p>
          <p><strong>Email :</strong> hichem.boussouar@gmail.com</p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Données collectées</h2>
          <p>
            Nom, prénom, email, informations de connexion, historique d’achats, progression pédagogique,
            certificats et données techniques nécessaires au bon fonctionnement du service.
          </p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Finalités</h2>
          <p>
            Création de compte, authentification, traitement des commandes, mise à disposition des contenus,
            service client, envoi d’emails transactionnels, amélioration et sécurisation de la plateforme.
          </p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Base légale</h2>
          <p>
            Exécution du contrat, respect d’obligations légales, intérêt légitime, et consentement lorsque requis.
          </p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Droits</h2>
          <p>
            Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition
            et, le cas échéant, de retrait du consentement, selon la réglementation applicable.
          </p>
        </section>
      </div>
    </main>
  );
}