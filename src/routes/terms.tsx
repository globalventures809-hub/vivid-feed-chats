import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReturnButton } from "@/components/ReturnButton";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Terms & Conditions</h1>
        <ReturnButton to="/welcome" label="Back" />
      </div>
      <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
        <p className="text-xs italic">Last updated: April 2026</p>
        <p>
          These Terms govern your use of Verde. By creating an account or using
          the app, you agree to these Terms. If you do not agree, please do not
          use Verde.
        </p>

        <h2 className="text-foreground font-semibold pt-2">1. Eligibility</h2>
        <p>
          You must be at least 13 years old (or the minimum age required in
          your country) to use Verde. By signing up you confirm you meet this
          requirement and that your information is accurate.
        </p>

        <h2 className="text-foreground font-semibold pt-2">2. Your account</h2>
        <p>
          You are responsible for everything that happens on your account.
          Keep your password secret, do not share it, and notify us right away
          if you suspect unauthorized access. Each person may hold one
          account; usernames are unique and assigned on a first-come basis.
        </p>

        <h2 className="text-foreground font-semibold pt-2">3. Your content</h2>
        <p>
          You retain full ownership of the videos, comments, photos and other
          content you post. By posting, you grant Verde a worldwide,
          non-exclusive, royalty-free license to host, display, reformat for
          different devices, and distribute your content within the app and
          via the standard share features.
        </p>

        <h2 className="text-foreground font-semibold pt-2">4. Community rules</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No harassment, hate speech, threats or doxxing.</li>
          <li>No sexual content involving minors. Period.</li>
          <li>No spam, scams, malware or fake engagement.</li>
          <li>No content that infringes someone else's copyright or trademark.</li>
          <li>No illegal activity, dangerous challenges or self-harm promotion.</li>
        </ul>
        <p>
          Violations may result in content removal, account suspension or
          permanent ban, at our discretion.
        </p>

        <h2 className="text-foreground font-semibold pt-2">5. Intellectual property</h2>
        <p>
          The Verde name, logo and software are owned by us. We grant you a
          limited, non-transferable license to use the app for personal,
          non-commercial purposes.
        </p>

        <h2 className="text-foreground font-semibold pt-2">6. Termination</h2>
        <p>
          You can delete your account at any time from your profile settings.
          We may suspend or terminate accounts that violate these Terms.
        </p>

        <h2 className="text-foreground font-semibold pt-2">7. Disclaimer</h2>
        <p>
          Verde is provided "as is", without warranties of any kind. We do
          not guarantee uninterrupted service or that the app will be free of
          errors.
        </p>

        <h2 className="text-foreground font-semibold pt-2">8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Verde is not liable for any
          indirect or consequential damages arising from your use of the app.
        </p>

        <h2 className="text-foreground font-semibold pt-2">9. Changes</h2>
        <p>
          We may update these Terms. Continued use after changes means you
          accept the updated Terms.
        </p>

        <h2 className="text-foreground font-semibold pt-2">10. Contact</h2>
        <p>
          Questions about these Terms? Reach out from inside the app via the
          Profile → Help screen.
        </p>
      </div>
      <div className="mt-10 flex justify-center pb-6">
        <button
          onClick={() => navigate({ to: "/welcome" })}
          className="brand-gradient text-brand-foreground font-semibold py-3 px-8 rounded-2xl shadow-brand"
        >
          I understand
        </button>
      </div>
    </div>
  );
}
