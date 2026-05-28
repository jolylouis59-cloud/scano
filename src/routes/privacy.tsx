import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-5 py-12">
      <div className="max-w-4xl mx-auto bg-background border border-border rounded-2xl p-8 md:p-10 space-y-8">
        <div>
          <Link to="/" className="text-sm font-semibold underline">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold mt-4">Politique de Confidentialité (RGPD)</h1>
          <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">1. Responsable du traitement</h2>
          <p>Louis JOLY, entrepreneur individuel (nom commercial : L26 &amp; IMA).</p>
          <p>RCS : 942 925 512 R.C.S. Lille Métropole</p>
          <p>Adresse : 7 rue de Guingamp, 59155 Faches-Thumesnil</p>
          <p>Contact : hello.louis26@gmail.com</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">2. Service concerné</h2>
          <p>
            Cette politique s&apos;applique au service SaaS Scano (tryscano.com), qui permet aux commerces locaux de
            collecter des données clients via QR code et quiz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">3. Données collectées</h2>
          <p>Scano peut traiter les données suivantes :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>email,</li>
            <li>nom,</li>
            <li>type de commerce,</li>
            <li>réponses aux quiz clients.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">4. Finalités</h2>
          <p>Les données sont utilisées pour :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>fournir et sécuriser le service,</li>
            <li>analyser les réponses clients,</li>
            <li>gérer les abonnements et paiements,</li>
            <li>envoyer les emails transactionnels nécessaires au service.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">5. Hébergement et sous-traitants</h2>
          <p>Hébergement : Vercel (USA) et Supabase (USA).</p>
          <p>Sous-traitants : Stripe (paiement), Resend (emails).</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">6. Durée de conservation</h2>
          <p>
            Les données sont conservées pendant la durée nécessaire aux finalités du service, puis supprimées ou
            anonymisées selon les obligations légales applicables.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">7. Droits RGPD</h2>
          <p>
            Vous disposez des droits d&apos;accès, de rectification, de suppression, de limitation, d&apos;opposition et de
            portabilité de vos données.
          </p>
          <p>Pour exercer vos droits : hello.louis26@gmail.com</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">8. Droit applicable</h2>
          <p>La présente politique est soumise au droit français.</p>
          <p>Tribunal compétent : Lille.</p>
        </section>
      </div>
    </div>
  );
}
