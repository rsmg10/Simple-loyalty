import type { Locale } from "./locale";

// Arabic counted nouns change form with the number: 1 and 2 have their own
// words, 3–10 take the plural, 11–99 take the singular accusative. Stamp
// counts here stay well under 100, but the rule is applied mod 100 anyway.
export function pluralStampsAr(count: number): string {
  if (count === 1) return "ختم واحد";
  if (count === 2) return "ختمان";
  const lastTwo = count % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return `${count} أختام`;
  if (lastTwo >= 11) return `${count} ختمًا`;
  return `${count} ختم`;
}

const en = {
  common: {
    // Label for the toggle — always names the *other* language.
    switchLanguage: "العربية",
  },
  meta: {
    titleSuffix: "Loyalty Card",
    description: "Your digital stamp card",
  },
  card: {
    eyebrow: "Digital Stamp Card",
    loading: "Loading your card…",
    loadError: "Couldn't load your card.",
    loadErrorHint: "Check your connection and try again.",
    retry: "Retry",
    rewardEarned: "🎉 Free coffee earned!",
    showToStaff: "Show this to staff to add a stamp",
    noCamera: "Camera not handy? Give staff this code:",
    qrLabel: "Your loyalty card QR code",
    progressLabel: (earned: number, required: number) => `${earned} of ${required} stamps earned`,
    replaceConfirm:
      "Replace the card on this phone with the one staff just shared? Your current card keeps its stamps.",
  },
  encouragement: {
    oneLeft: "So close! 1 more stamp and your next coffee is free.",
    start: (remaining: number) => `${remaining} stamps until your next coffee is free.`,
    halfway: (remaining: number) => `Halfway there! ${remaining} more stamps until your next coffee is free.`,
    more: (remaining: number) => `${remaining} more stamps until your next coffee is free.`,
  },
  install: {
    title: "Keep your card one tap away",
    native: "Add it to your home screen so it's easy to find next visit.",
    ios: "Tap the Share button, then “Add to Home Screen”.",
    androidManual: "Open your browser menu (⋮), then “Add to Home screen”.",
    inApp: "Open this page in Chrome or Safari to save it to your home screen.",
    add: "Add to home screen",
    dismiss: "Not now",
  },
  phone: {
    placeholder: "Phone number (optional)",
    hint: "So staff can find your card if you change phones. The café may also message you about rewards.",
    save: "Save",
    savedPrefix: "📱 Linked to",
    change: "Change",
    invalid: "Enter a valid mobile number.",
    taken: "That number is on another card. Ask staff to move it to this phone.",
    failed: "Couldn't save. Try again.",
  },
  email: {
    placeholder: "Email for a nudge (optional)",
    save: "Save",
    savedPrefix: "📧 We'll email",
    savedSuffix: "when you're 1 stamp away.",
    change: "Change",
  },
  wallet: {
    apple: "Add to Apple Wallet",
    google: "Add to Google Wallet",
    googleError: "Couldn't add to Google Wallet. Try again.",
  },
  staff: {
    pinEyebrow: "Staff Access",
    pinTitle: "Enter shop PIN",
    pinPlaceholder: "PIN",
    unlock: "Unlock",
    tooManyAttempts: "Too many incorrect attempts. Try again in a few minutes.",
    incorrectPin: "Incorrect PIN. Try again.",
    setupLink: "Shop setup",
    scanEyebrow: "Staff Scan",
    scanTitle: "Scan customer card",
    cameraUnavailable: "Camera unavailable — use manual entry below.",
    manualPrompt: "Or enter the customer's phone number or card code",
    manualPlaceholder: "Phone or card code",
    lookUp: "Look up",
    notFoundTitle: "Card not found",
    notFoundBody:
      "No card matches that number or code. Ask the customer to reopen their card and try again.",
    tryAgain: "Try again",
    confirmTitle: "Add a stamp?",
    cancel: "Cancel",
    stampCount: "Stamps for this purchase",
    fewerStamps: "One stamp fewer",
    moreStamps: "One stamp more",
    addStamps: (count: number) => (count === 1 ? "Add stamp" : `Add ${count} stamps`),
    stampsAdded: (count: number) => (count === 1 ? "Stamp added" : `${count} stamps added`),
    rewardRedeemed: "Free coffee redeemed!",
    giveRewards: (count: number) =>
      count === 1 ? "🎁 Give them a free coffee!" : `🎁 Give them ${count} free coffees!`,
    scanNext: "Scan next customer",
    moveCard: "Move card to customer's phone",
    moveCardHint: "Ask the customer to scan this with their phone camera.",
    moveCardDone: "Done",
  },
  signage: {
    fallbackName: "Loyalty Card",
    loading: "Loading…",
    title: "Scan to start collecting stamps",
    qrLabel: "Scan to join the loyalty card",
    reward: (stampsRequired: number) => `Free coffee after ${stampsRequired} stamps`,
    notConfigured: "NEXT_PUBLIC_APP_URL is not configured — set it to generate this QR code.",
  },
  setup: {
    statsEyebrow: "Shop Stats",
    cardsIssued: "Cards issued",
    stampsGiven: "Stamps given",
    redemptions: "Redemptions",
    returningCustomers: "Returning",
    returnRate: "Return rate",
    activeCustomers: "Active (30 days)",
    statsNote: "Returning customers have 2 or more stamps. Active means stamped in the last 30 days.",
    eyebrow: "Shop Setup",
    title: "Configure your shop",
    description:
      "Changes apply immediately to the customer card. New customer cards use the stamps count below — cards already in progress keep their original count.",
    shopName: "Shop name",
    stampsRequired: "Stamps required",
    newPin: "New staff PIN",
    newPinPlaceholder: "Leave blank to keep the current PIN",
    save: "Save",
    saved: "Saved.",
    nameEmpty: "Shop name can't be empty.",
    stampsRange: (min: number, max: number) => `Stamps required must be a whole number between ${min} and ${max}.`,
    pinTooShort: "Staff PIN must be at least 4 characters.",
    saveFailed: "Failed to save shop config.",
  },
  customers: {
    eyebrow: "Customers",
    title: (count: number) => `Message customers (${count})`,
    description: "Customers who added their phone number. Tap WhatsApp to open a chat.",
    messageLabel: "Message (optional)",
    messagePlaceholder: "e.g. Double stamps this Friday!",
    whatsApp: "WhatsApp",
    copyAll: "Copy all numbers",
    copied: "Copied",
    empty: "No customers have added a phone number yet.",
    loadError: "Couldn't load customers.",
    stamps: (lifetime: number) => (lifetime === 1 ? "1 stamp" : `${lifetime} stamps`),
    lastVisit: (date: string) => `last visit ${date}`,
    neverStamped: "no stamps yet",
  },
  owner: {
    accessEyebrow: "Owner Access",
    signInTitle: "Sign in to manage this shop",
    signIn: "Sign in",
    signOut: "Sign out",
  },
};

export type Messages = typeof en;

const ar: Messages = {
  common: {
    switchLanguage: "English",
  },
  meta: {
    titleSuffix: "بطاقة الولاء",
    description: "بطاقة الأختام الرقمية الخاصة بك",
  },
  card: {
    eyebrow: "بطاقة الأختام الرقمية",
    loading: "جارٍ تحميل بطاقتك…",
    loadError: "تعذّر تحميل بطاقتك.",
    loadErrorHint: "تحقّق من اتصالك وحاول مرة أخرى.",
    retry: "إعادة المحاولة",
    rewardEarned: "🎉 ربحت قهوة مجانية!",
    showToStaff: "اعرض هذا على الموظف لإضافة ختم",
    noCamera: "الكاميرا لا تعمل؟ أعطِ الموظف هذا الرمز:",
    qrLabel: "رمز QR لبطاقة الولاء",
    progressLabel: (earned, required) => `تم جمع ${earned} من أصل ${required}`,
    replaceConfirm:
      "هل تريد استبدال البطاقة على هذا الهاتف بالبطاقة التي أرسلها الموظف؟ ستحتفظ بطاقتك الحالية بأختامها.",
  },
  encouragement: {
    oneLeft: "اقتربت! ختم واحد فقط وتكون قهوتك القادمة مجانية.",
    start: (remaining) => `تبقّى ${pluralStampsAr(remaining)} على قهوتك المجانية القادمة.`,
    halfway: (remaining) => `وصلت إلى المنتصف! تبقّى ${pluralStampsAr(remaining)} على قهوتك المجانية القادمة.`,
    more: (remaining) => `تبقّى ${pluralStampsAr(remaining)} على قهوتك المجانية القادمة.`,
  },
  install: {
    title: "اجعل بطاقتك على بُعد لمسة",
    native: "أضِفها إلى الشاشة الرئيسية لتجدها بسهولة في زيارتك القادمة.",
    ios: "اضغط زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية».",
    androidManual: "افتح قائمة المتصفح (⋮)، ثم «إضافة إلى الشاشة الرئيسية».",
    inApp: "افتح هذه الصفحة في Chrome أو Safari لحفظها على الشاشة الرئيسية.",
    add: "أضِف إلى الشاشة الرئيسية",
    dismiss: "ليس الآن",
  },
  phone: {
    placeholder: "رقم الهاتف (اختياري)",
    hint: "ليجد الموظف بطاقتك إذا غيّرت هاتفك، وقد يراسلك المقهى بخصوص العروض والمكافآت.",
    save: "حفظ",
    savedPrefix: "📱 مرتبطة بالرقم",
    change: "تغيير",
    invalid: "أدخل رقم هاتف محمول صحيح.",
    taken: "هذا الرقم مرتبط ببطاقة أخرى. اطلب من الموظف نقلها إلى هذا الهاتف.",
    failed: "تعذّر الحفظ. حاول مرة أخرى.",
  },
  email: {
    placeholder: "البريد الإلكتروني للتذكير (اختياري)",
    save: "حفظ",
    savedPrefix: "📧 سنراسلك على",
    savedSuffix: "عندما يتبقّى لك ختم واحد.",
    change: "تغيير",
  },
  wallet: {
    apple: "أضِف إلى Apple Wallet",
    google: "أضِف إلى Google Wallet",
    googleError: "تعذّرت الإضافة إلى Google Wallet. حاول مرة أخرى.",
  },
  staff: {
    pinEyebrow: "دخول الموظفين",
    pinTitle: "أدخل الرقم السري للمقهى",
    pinPlaceholder: "الرقم السري",
    unlock: "دخول",
    tooManyAttempts: "محاولات خاطئة كثيرة. حاول بعد بضع دقائق.",
    incorrectPin: "رقم سري غير صحيح. حاول مرة أخرى.",
    setupLink: "إعدادات المقهى",
    scanEyebrow: "مسح الموظف",
    scanTitle: "امسح بطاقة الزبون",
    cameraUnavailable: "الكاميرا غير متاحة — استخدم الإدخال اليدوي بالأسفل.",
    manualPrompt: "أو أدخل رقم هاتف الزبون أو رمز البطاقة",
    manualPlaceholder: "الهاتف أو رمز البطاقة",
    lookUp: "بحث",
    notFoundTitle: "البطاقة غير موجودة",
    notFoundBody: "لا توجد بطاقة بهذا الرقم أو الرمز. اطلب من الزبون فتح بطاقته والمحاولة مرة أخرى.",
    tryAgain: "حاول مرة أخرى",
    confirmTitle: "إضافة ختم؟",
    cancel: "إلغاء",
    stampCount: "عدد الأختام لهذا الطلب",
    fewerStamps: "ختم أقل",
    moreStamps: "ختم أكثر",
    // After a verb the dual takes its accusative form (ختمين, not ختمان).
    addStamps: (count) =>
      count === 1 ? "أضِف ختمًا" : count === 2 ? "أضِف ختمين" : `أضِف ${pluralStampsAr(count)}`,
    stampsAdded: (count) =>
      count === 1 ? "تمت إضافة الختم" : count === 2 ? "تمت إضافة ختمين" : `تمت إضافة ${pluralStampsAr(count)}`,
    rewardRedeemed: "تم استبدال القهوة المجانية!",
    giveRewards: (count) =>
      count === 1
        ? "🎁 قدّم له قهوة مجانية!"
        : count === 2
          ? "🎁 قدّم له قهوتين مجانيتين!"
          : `🎁 قدّم له ${count} قهوات مجانية!`,
    scanNext: "الزبون التالي",
    moveCard: "انقل البطاقة إلى هاتف الزبون",
    moveCardHint: "اطلب من الزبون مسح هذا الرمز بكاميرا هاتفه.",
    moveCardDone: "تم",
  },
  signage: {
    fallbackName: "بطاقة الولاء",
    loading: "جارٍ التحميل…",
    title: "امسح الرمز وابدأ بجمع الأختام",
    qrLabel: "امسح للانضمام إلى بطاقة الولاء",
    reward: (stampsRequired) => `قهوة مجانية بعد ${pluralStampsAr(stampsRequired)}`,
    notConfigured: "لم يُضبط NEXT_PUBLIC_APP_URL — اضبطه لإنشاء رمز QR.",
  },
  setup: {
    statsEyebrow: "إحصائيات المقهى",
    cardsIssued: "البطاقات",
    stampsGiven: "الأختام",
    redemptions: "المكافآت",
    returningCustomers: "زبائن عائدون",
    returnRate: "نسبة العودة",
    activeCustomers: "نشطون (30 يومًا)",
    statsNote: "الزبون العائد لديه ختمان أو أكثر. النشط حصل على ختم خلال آخر 30 يومًا.",
    eyebrow: "إعدادات المقهى",
    title: "إعداد مقهاك",
    description:
      "تُطبَّق التغييرات فورًا على بطاقة الزبون. البطاقات الجديدة تستخدم عدد الأختام أدناه، أما البطاقات الجارية فتحتفظ بعددها الأصلي.",
    shopName: "اسم المقهى",
    stampsRequired: "عدد الأختام المطلوبة",
    newPin: "رقم سري جديد للموظفين",
    newPinPlaceholder: "اتركه فارغًا للإبقاء على الرقم الحالي",
    save: "حفظ",
    saved: "تم الحفظ.",
    nameEmpty: "اسم المقهى مطلوب.",
    stampsRange: (min, max) => `عدد الأختام يجب أن يكون رقمًا صحيحًا بين ${min} و${max}.`,
    pinTooShort: "الرقم السري يجب أن يتكوّن من 4 خانات على الأقل.",
    saveFailed: "تعذّر حفظ الإعدادات.",
  },
  customers: {
    eyebrow: "الزبائن",
    title: (count) => `مراسلة الزبائن (${count})`,
    description: "الزبائن الذين أضافوا رقم هاتفهم. اضغط واتساب لفتح محادثة.",
    messageLabel: "الرسالة (اختياري)",
    messagePlaceholder: "مثال: أختام مضاعفة يوم الجمعة!",
    whatsApp: "واتساب",
    copyAll: "نسخ كل الأرقام",
    copied: "تم النسخ",
    empty: "لم يُضف أي زبون رقم هاتفه بعد.",
    loadError: "تعذّر تحميل الزبائن.",
    stamps: (lifetime) => pluralStampsAr(lifetime),
    lastVisit: (date) => `آخر زيارة ${date}`,
    neverStamped: "لا أختام بعد",
  },
  owner: {
    accessEyebrow: "دخول المالك",
    signInTitle: "سجّل الدخول لإدارة هذا المقهى",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
  },
};

export const messages: Record<Locale, Messages> = { en, ar };
