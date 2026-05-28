import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cgu")({
  component: CguPage,
});

function CguPage() {
  return (
    <div className="min-h-screen bg-background px-5 py-12">
      <div className="max-w-4xl mx-auto bg-background border border-border rounded-2xl p-8 md:p-10 space-y-8">
        <div>
          <Link to="/" className="text-sm font-semibold underline">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold mt-4">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">1. Éditeur du service</h2>
          <p>Scano est édité par Louis JOLY, entrepreneur individuel.</p>
          <p>RCS : 942 925 512 R.C.S. Lille Métropole</p>
          <p>Nom commercial : L26 &amp; IMA</p>
          <p>Adresse : 7 rue de Guingamp, 59155 Faches-Thumesnil</p>
          <p>Contact : hello.louis26@gmail.com</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">2. Description du service</h2>
          <p>
            Scano (tryscano.com) est une solution SaaS permettant aux commerces locaux de collecter des données clients
            via QR code et quiz, afin d&apos;améliorer leur compréhension client et leur expérience commerciale.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">3. Accès et compte utilisateur</h2>
          <p>
            L&apos;utilisateur professionnel crée un compte pour accéder au dashboard Scano. L&apos;accès au dashboard complet
            est conditionné à un abonnement actif.
          </p>
          <p>L&apos;utilisateur est responsable de la confidentialité de ses identifiants.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">4. Données traitées dans le service</h2>
          <p>Le service peut traiter notamment : email, nom, type de commerce, réponses aux quiz clients.</p>
          <p>
            Le commerçant demeure responsable des données collectées via ses quiz au regard de ses propres obligations
            réglementaires.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">5. Hébergement et sous-traitants</h2>
          <p>Hébergement : Vercel (USA) et Supabase (USA).</p>
          <p>Sous-traitants techniques : Stripe (paiement), Resend (emails transactionnels).</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">6. Propriété intellectuelle</h2>
          <p>
            Les éléments du service Scano (marques, contenus, code, interfaces) sont protégés. Toute reproduction ou
            exploitation non autorisée est interdite.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">7. Responsabilité</h2>
          <p>
            L&apos;éditeur met en oeuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service,
            sans garantie d&apos;absence totale d&apos;interruption ou d&apos;erreur.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">8. Droit applicable et juridiction</h2>
          <p>Les présentes CGU sont soumises au droit français.</p>
          <p>En cas de litige, compétence exclusive est attribuée aux tribunaux de Lille.</p>
        </section>
      </div>
    </div>
  );
}
