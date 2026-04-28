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
      <div className="prose prose-invert text-sm text-muted-foreground space-y-4">
        <p>Welcome to Verde. By using our app, you agree to behave kindly, respect others, and follow community standards.</p>
        <h2 className="text-foreground font-semibold">Your account</h2>
        <p>You are responsible for the activity on your account. Keep your password safe and don't share it.</p>
        <h2 className="text-foreground font-semibold">Content you post</h2>
        <p>You retain ownership of your content. By posting, you grant Verde a non-exclusive license to display it within the app.</p>
        <h2 className="text-foreground font-semibold">Prohibited behavior</h2>
        <p>No spam, harassment, illegal content, or impersonation. Violations may lead to account suspension.</p>
        <h2 className="text-foreground font-semibold">Changes</h2>
        <p>We may update these terms. Continued use after changes means you accept them.</p>
      </div>
      <div className="mt-10 flex justify-center">
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
