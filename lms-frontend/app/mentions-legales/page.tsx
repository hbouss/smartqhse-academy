// app/mentions-legales/page.tsx
export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold">Mentions légales</h1>

        <section className="space-y-3 text-slate-300 leading-8">
          <p><strong>Éditeur du site :</strong> Power HSE SRL</p>
          <p><strong>Dénomination commerciale :</strong> SmartQHSE Academy</p>
          <p><strong>Adresse du siège :</strong> Rue de la petite guirlande 8, 7000 Mons, Belgique</p>
          <p><strong>Responsable de la publication :</strong> Boussouar Hichem</p>
          <p><strong>Email :</strong> hichem.boussouar@gmail.com</p>
          <p><strong>Téléphone :</strong> +32 486 65 06 01</p>
          <p><strong>TVA :</strong> BE 1015.196.060</p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Hébergement</h2>
          <p><strong>Frontend :</strong> OVHcloud</p>
          <p><strong>Backend :</strong> Railway</p>
        </section>

        <section className="space-y-3 text-slate-300 leading-8">
          <h2 className="text-2xl font-semibold text-white">Propriété intellectuelle</h2>
          <p>
            L’ensemble des contenus présents sur le site SmartQHSE Academy, incluant notamment les textes,
            visuels, vidéos, modules pédagogiques, éléments graphiques, logos, documents et supports de
            formation, est protégé par le droit de la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, diffusion, adaptation ou exploitation, totale ou partielle,
            sans autorisation écrite préalable de Power HSE SRL, est interdite.
          </p>
        </section>
      </div>
    </main>
  );
}