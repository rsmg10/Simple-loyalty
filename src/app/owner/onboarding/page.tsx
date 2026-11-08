import { notFound, redirect } from "next/navigation";
import CreateShopForm from "@/components/CreateShopForm";
import { getOwnerUserId } from "@/lib/owner-auth";
import { getShopByOwnerUserId } from "@/lib/shop-repo";

export default async function OwnerOnboardingPage() {
  // Only exists for a multi-tenant deployment — a single-café deployment
  // already has its one shop and has nowhere for a second one to go.
  if (!process.env.APP_ROOT_DOMAIN) {
    notFound();
  }

  const ownerUserId = await getOwnerUserId();
  if (!ownerUserId) {
    redirect("/owner/login");
  }

  const existingShop = await getShopByOwnerUserId(ownerUserId);
  if (existingShop) {
    redirect(`https://${existingShop.slug ?? ""}.${process.env.APP_ROOT_DOMAIN}/setup`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      <CreateShopForm />
    </main>
  );
}
