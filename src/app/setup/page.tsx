import OwnerSignInPrompt from "@/components/OwnerSignInPrompt";
import OwnerSignOutButton from "@/components/OwnerSignOutButton";
import SetupPinFlow from "@/components/SetupPinFlow";
import ShopSetupForm from "@/components/ShopSetupForm";
import { getOwnerUserId } from "@/lib/owner-auth";
import { getShop } from "@/lib/shop-repo";

export default async function SetupPage() {
  const shop = await getShop();

  if (shop.ownerUserId) {
    const ownerUserId = await getOwnerUserId();
    const isOwner = ownerUserId === shop.ownerUserId;

    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
        {isOwner ? (
          <div className="w-full max-w-sm">
            <div className="mb-md flex justify-end">
              <OwnerSignOutButton />
            </div>
            <ShopSetupForm />
          </div>
        ) : (
          <OwnerSignInPrompt />
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      <SetupPinFlow />
    </main>
  );
}
