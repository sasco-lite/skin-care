// Nikhar Skincare - Main Front-End JavaScript
// Bilingual Switcher, Dynamic Slots, Validation, WhatsApp Links, Analytics Tracking
// Zero emojis anywhere

(function () {
  "use strict";

  // Central Client Config & Bilingual Translation Dictionary
  const CLIENT_PHONE = "9033442501";
  const WA_BASE = "https://wa.me/919033442501";

  const I18N = {
    en: {
      metaTitle: "Nikhar Skincare by Hunaina Shethwala | Safe Herbal & Chemical-Free Skincare Ahmedabad",
      metaDesc: "Discover safe, steroid-free, handcrafted herbal skincare, body care, and hair care products by Hunaina Shethwala in Juhapura, Ahmedabad. Book a consultation or enquire on WhatsApp.",
      navBrand: "Nikhar Skincare",
      navAbout: "About",
      navProducts: "Products",
      navWhy: "Why Nikhar",
      navBooking: "Book Now",
      navLocation: "Location",
      navContact: "Contact",
      navAdmin: "Admin",
      heroEyebrow: "Pure Herbal Radiance By Hunaina Shethwala",
      heroHeading: "Gentle on Skin. Powerful by Nature.",
      heroLead: "Experience safe, handcrafted herbal formulations made without harmful chemicals or steroids. Dedicated to restoring your authentic, glowing skin and revitalized hair.",
      heroCtaBook: "Book Consultation",
      heroCtaWhatsapp: "Chat on WhatsApp",
      heroStat1Val: "100%",
      heroStat1Lbl: "Safe & Herbal",
      heroStat2Val: "30+",
      heroStat2Lbl: "Soap Flavours",
      heroStat3Val: "0%",
      heroStat3Lbl: "Steroids & Toxins",
      tagline: "Pure Herbal Radiance • 100% Chemical-Free & Steroid-Free Skincare",
      aboutEyebrow: "Meet The Maker",
      aboutHeading: "Hunaina Shethwala",
      aboutRole: "Founder & Herbal Formulator",
      aboutP1: "Welcome to Nikhar Skincare. I started this journey in Ahmedabad with one sacred mission: to offer genuinely safe, natural, chemical-free, and steroid-free formulations that nurture skin and hair back to lasting health.",
      aboutP2: "Every cream, soap, serum, and oil is crafted under personal care using time-tested herbs like Kashmiri saffron, avocado, fresh hibiscus, and pure henna. No harsh bleaches, no false promises—only authentic herbal care you can trust.",
      aboutBadge: "Handcrafted in Juhapura, Ahmedabad",
      productsEyebrow: "Natural Formulations",
      productsHeading: "Our Herbal Catalogue",
      productsSub: "Select a range to explore our safe botanical treatments. Every product is freshly prepared in small batches.",
      filterAll: "All Products",
      filterSkin: "Skin Care",
      filterBody: "Body Care",
      filterHair: "Hair Care",
      cardAskPrice: "Ask for price",
      cardEnquireBtn: "Enquire on WhatsApp",
      whyEyebrow: "Why Choose Us",
      whyHeading: "The Herbal Difference",
      whyPoint1Title: "Strictly Steroid & Chemical Free",
      whyPoint1Desc: "Unlike aggressive whitening treatments, our herbal creams and packs respect your skin barrier with zero harsh bleaches or steroids.",
      whyPoint2Title: "Small-Batch Freshness",
      whyPoint2Desc: "Each formulation is hand-blended in measured quantities to ensure the highest potency and freshness of herbal actives.",
      whyPoint3Title: "Transparent & Honest Advice",
      whyPoint3Desc: "Consult directly with Hunaina to select exactly what matches your skin and hair concerns without over-purchasing.",
      whyPoint4Title: "Accessible & Community Rooted",
      whyPoint4Desc: "Proudly based in Juhapura, Ahmedabad, offering warm in-person consultations and fast dispatch across India.",
      stepsEyebrow: "Simple 3-Step Process",
      stepsHeading: "How Booking Works",
      step1Title: "1. Select Service & Date",
      step1Desc: "Choose your desired consultation or product discussion and pick an available time slot.",
      step2Title: "2. Reserve Online",
      step2Desc: "Submit your basic details. Your booking reference is generated instantly with slot reservation.",
      step3Title: "3. Confirm on WhatsApp",
      step3Desc: "Connect directly with Hunaina on WhatsApp with a prefilled confirmation to finalize your slot.",
      bookingEyebrow: "Reserve Your Slot",
      bookingHeading: "Schedule an Appointment",
      bookingSub: "Book your personalized skin or hair consultation with Hunaina Shethwala at our studio.",
      formFullName: "Full Name",
      formFullNamePh: "e.g., Ayesha Patel",
      formPhone: "Mobile Number",
      formPhonePh: "10-digit Indian mobile number",
      formPhoneHelp: "We will message your appointment confirmation to this WhatsApp number.",
      formEmail: "Email Address (Optional)",
      formEmailPh: "yourname@example.com",
      formService: "Select Service",
      formServiceDefault: "-- Choose a consultation or enquiry --",
      formDate: "Preferred Date",
      formSlot: "Preferred Time Slot",
      formSlotDefault: "-- Choose a time slot --",
      formSlotLoading: "Checking slot availability...",
      formSlotFull: "Full",
      formSlotAvailable: "Available",
      formNotes: "Notes / Specific Concerns (Optional)",
      formNotesPh: "Tell us about your skin/hair type or what you are looking for...",
      formSubmitBtn: "Confirm Appointment",
      formSubmitting: "Securing your slot...",
      formPrivacy: "Your contact details are kept strictly private and used solely for appointment confirmation.",
      bookOfflineNotice: "Our automated booking system is temporarily offline for maintenance. You can still instantly book directly with Hunaina via WhatsApp or Phone call!",
      bookOfflineWaBtn: "Book via WhatsApp Now",
      bookOfflineCallBtn: "Call +91 9033442501",
      bookSuccessTitle: "Appointment Reserved!",
      bookSuccessSub: "Thank you for choosing Nikhar Skincare. Your booking reference is:",
      bookSuccessRefLabel: "Booking Reference",
      bookSuccessNext: "Next Step: Tap the button below to send your confirmation message directly to Hunaina on WhatsApp.",
      bookSuccessWaBtn: "Confirm on WhatsApp Now",
      bookSuccessNewBtn: "Book Another Appointment",
      locationEyebrow: "Visit Us",
      locationHeading: "Studio Location",
      locationSub: "Visit our Ahmedabad studio for personal consultations and direct product pickups.",
      addressTitle: "Studio Address",
      addressFullLabel: "Full Postal Address",
      shortAddress: "Nikhar Skincare by Hunaina Shethwala, Royal Park Society, near Raza E Mustufa Masjid, Juhapura, Ahmedabad, Gujarat 380055, India",
      workingHours: "10:00 AM - 07:00 PM (Mon - Sun)",
      hoursTitle: "Working Hours",
      phoneTitle: "Direct Phone & WhatsApp",
      emailTitle: "Official Email",
      btnGetDirections: "Get Directions",
      btnViewMaps: "Open in Google Maps",
      contactEyebrow: "Get In Touch",
      contactHeading: "Quick Connect",
      contactSub: "Have a question about our creams, soaps, or hair packs? Reach out to Hunaina directly.",
      quickCallTitle: "Call Us",
      quickCallBtn: "Call +91 9033442501",
      quickWaTitle: "WhatsApp",
      quickWaBtn: "Chat on WhatsApp",
      quickIgTitle: "Instagram",
      quickIgBtn: "Follow @nikhar_skincare",
      quickEmailTitle: "Email Us",
      quickEmailBtn: "Send Email",
      footerAbout: "Handcrafted, chemical-free and steroid-free skincare, body care, and hair care by Hunaina Shethwala.",
      footerQuickLinks: "Quick Links",
      footerContact: "Contact Studio",
      footerNotice: "All rights reserved. Safe herbal care without synthetic compromises.",
      mobileBarCall: "Call",
      mobileBarWa: "WhatsApp",
      mobileBarDirections: "Directions",
      mobileBarBook: "Book Slot",
      valNameRequired: "Please enter your full name (minimum 2 characters).",
      valPhoneInvalid: "Please enter a valid 10-digit Indian mobile number.",
      valServiceRequired: "Please choose a service from the list.",
      valDateRequired: "Please select an appointment date within the next 60 days.",
      valSlotRequired: "Please select an available time slot.",
      toastBookingSuccess: "Appointment reserved successfully!",
      toastBookingError: "Could not complete booking. Please try again or message via WhatsApp.",
      waPrefillGeneral: "Hello Hunaina, I would like to enquire about Nikhar Skincare herbal products.",
      waPrefillProduct: "Hello Hunaina, I would like to ask about the price and details for: ",
      waPrefillBooking: "Hello Hunaina, I have booked an appointment on Nikhar Skincare.\nRef: {REF}\nName: {NAME}\nService: {SERVICE}\nDate: {DATE}\nTime Slot: {SLOT}\nPhone: {PHONE}\nPlease confirm my slot. Thank you!"
    },
    hi: {
      metaTitle: "निखार स्किनकेयर द्वारा हुनैना शेठवाला | शुद्ध व सुरक्षित हर्बल स्किनकेयर अहमदाबाद",
      metaDesc: "हुनैना शेठवाला द्वारा जुहापुरा, अहमदाबाद में शुद्ध, सुरक्षित, केमिकल व स्टेरॉयड मुक्त हर्बल स्किनकेयर, बॉडी केयर व हेयर केयर उत्पाद। ऑनलाइन अपॉइंटमेंट बुक करें या व्हाट्सएप पर संपर्क करें।",
      navBrand: "निखार स्किनकेयर",
      navAbout: "परिचय",
      navProducts: "उत्पाद",
      navWhy: "विशेषताएं",
      navBooking: "अपॉइंटमेंट",
      navLocation: "पता व नक्शा",
      navContact: "संपर्क",
      navAdmin: "एडमिन",
      heroEyebrow: "हुनैना शेठवाला द्वारा शुद्ध हर्बल निखार",
      heroHeading: "त्वचा के लिए कोमल। प्रकृति से असरदार।",
      heroLead: "रसायनों और स्टेरॉयड से सर्वथा मुक्त, विशुद्ध प्राकृतिक जड़ी-बूटियों से बने हस्तनिर्मित उत्पाद। आपकी त्वचा के कुदरती निखार और बालों की सेहत के लिए समर्पित।",
      heroCtaBook: "अपॉइंटमेंट बुक करें",
      heroCtaWhatsapp: "व्हाट्सएप पर बात करें",
      heroStat1Val: "१००%",
      heroStat1Lbl: "सुरक्षित व हर्बल",
      heroStat2Val: "३०+",
      heroStat2Lbl: "साबुन के प्रकार",
      heroStat3Val: "०%",
      heroStat3Lbl: "केमिकल व स्टेरॉयड",
      tagline: "शुद्ध हर्बल निखार • १००% केमिकल व स्टेरॉयड मुक्त प्राकृतिक सौंदर्य",
      aboutEyebrow: "संस्थापक का संदेश",
      aboutHeading: "हुनैना शेठवाला",
      aboutRole: "संस्थापक व हर्बल फॉर्म्युलेटर",
      aboutP1: "निखार स्किनकेयर में आपका स्वागत है। मैंने अहमदाबाद में इस संकल्प के साथ शुरुआत की कि हर बहन और ग्राहक को ऐसे उत्पाद मिलें जो पूरी तरह सुरक्षित, प्राकृतिक, केमिकल-फ्री और स्टेरॉयड-फ्री हों।",
      aboutP2: "हमारी हर क्रीम, साबुन, सीरम और हेयर ऑयल कश्मीरी केसर, एवोकैडो, ताजे गुड़हल और शुद्ध हिना से व्यक्तिगत देखरेख में तैयार किए जाते हैं। कोई हानिकारक ब्लीच नहीं, कोई दिखावा नहीं—केवल सच्चा हर्बल भरोसा।",
      aboutBadge: "जुहापुरा, अहमदाबाद में हस्तनिर्मित",
      productsEyebrow: "प्राकृतिक उत्पाद",
      productsHeading: "हमारा हर्बल कैटलॉग",
      productsSub: "अपनी जरूरत के अनुसार श्रेणी चुनें। हमारे सभी उत्पाद ताजे व छोटे बैच में प्रेमपूर्वक तैयार किए जाते हैं।",
      filterAll: "सभी उत्पाद",
      filterSkin: "स्किन केयर",
      filterBody: "बॉडी केयर",
      filterHair: "हेयर केयर",
      cardAskPrice: "कीमत के लिए पूछें",
      cardEnquireBtn: "व्हाट्सएप पर पूछें",
      whyEyebrow: "हमारी पहचान",
      whyHeading: "निखार ही क्यों चुनें?",
      whyPoint1Title: "पूरी तरह स्टेरॉयड व केमिकल मुक्त",
      whyPoint1Desc: "कठोर ब्लीच या स्टेरॉयड के बिना, हमारी हर्बल क्रीम आपकी त्वचा की प्राकृतिक सुरक्षा बनाए रखती हैं।",
      whyPoint2Title: "ताजे छोटे बैच में निर्माण",
      whyPoint2Desc: "प्रत्येक उत्पाद सीमित मात्रा में हाथ से तैयार किया जाता है ताकि जड़ी-बूटियों की ताजगी व गुणवत्ता बनी रहे।",
      whyPoint3Title: "सच्ची व ईमानदार सलाह",
      whyPoint3Desc: "सीधे हुनैना से बात करके अपनी त्वचा व बालों की आवश्यकता अनुसार सही उत्पाद का चयन करें।",
      whyPoint4Title: "सुलभ व स्थानीय भरोसा",
      whyPoint4Desc: "जुहापुरा, अहमदाबाद में हमारा स्टूडियो स्थित है, जहां आप व्यक्तिगत रूप से मिल सकते हैं और पूरे भारत में डिलीवरी पा सकते हैं।",
      stepsEyebrow: "आसान ३ चरण",
      stepsHeading: "बुकिंग कैसे करें",
      step1Title: "१. सेवा व तारीख चुनें",
      step1Desc: "अपनी पसंद का परामर्श चुनें और उपलब्ध तारीख व समय का चयन करें।",
      step2Title: "२. ऑनलाइन विवरण भरें",
      step2Desc: "अपना नाम व मोबाइल नंबर दर्ज करें। तुरंत बुकिंग संदर्भ संख्या प्राप्त करें।",
      step3Title: "३. व्हाट्सएप पर पुष्टि करें",
      step3Desc: "एक क्लिक में हुनैना को व्हाट्सएप संदेश भेजकर अपनी अपॉइंटमेंट पक्की करें।",
      bookingEyebrow: "समय आरक्षित करें",
      bookingHeading: "अपॉइंटमेंट बुक करें",
      bookingSub: "हुनैना शेठवाला के साथ अपनी व्यक्तिगत त्वचा या बालों के परामर्श हेतु समय बुक करें।",
      formFullName: "पूरा नाम",
      formFullNamePh: "उदा. आयशा पटेल",
      formPhone: "मोबाइल नंबर",
      formPhonePh: "१० अंकों का भारतीय मोबाइल नंबर",
      formPhoneHelp: "हम इस व्हाट्सएप नंबर पर आपकी बुकिंग की पुष्टि भेजेंगे।",
      formEmail: "ईमेल पता (वैकल्पिक)",
      formEmailPh: "apka-naam@example.com",
      formService: "सेवा चुनें",
      formServiceDefault: "-- परामर्श या पूछताछ का प्रकार चुनें --",
      formDate: "तारीख चुनें",
      formSlot: "समय स्लॉट चुनें",
      formSlotDefault: "-- समय स्लॉट चुनें --",
      formSlotLoading: "स्लॉट उपलब्धता जांची जा रही है...",
      formSlotFull: "भरा हुआ",
      formSlotAvailable: "उपलब्ध",
      formNotes: "अतिरिक्त टिप्पणी / समस्या (वैकल्पिक)",
      formNotesPh: "अपनी त्वचा/बालों के बारे में या अपनी पसंद बताएं...",
      formSubmitBtn: "अपॉइंटमेंट पक्की करें",
      formSubmitting: "स्लॉट बुक हो रहा है...",
      formPrivacy: "आपका विवरण पूर्णतः गोपनीय रखा जाता है और केवल अपॉइंटमेंट हेतु उपयोग होता है।",
      bookOfflineNotice: "हमारा स्वचालित सिस्टम अभी रखरखाव में है। आप अभी भी सीधे हुनैना से व्हाट्सएप या फोन द्वारा अपॉइंटमेंट बुक कर सकते हैं!",
      bookOfflineWaBtn: "व्हाट्सएप पर तुरंत बुक करें",
      bookOfflineCallBtn: "कॉल करें: ९०३३४४२५०१",
      bookSuccessTitle: "अपॉइंटमेंट आरक्षित हो गई!",
      bookSuccessSub: "निखार स्किनकेयर चुनने के लिए धन्यवाद। आपकी बुकिंग संदर्भ संख्या:",
      bookSuccessRefLabel: "बुकिंग संदर्भ",
      bookSuccessNext: "अगला कदम: नीचे दिए गए बटन पर टैप करके हुनैना को व्हाट्सएप पर संदेश भेजें और समय पक्का करें।",
      bookSuccessWaBtn: "व्हाट्सएप पर पुष्टि संदेश भेजें",
      bookSuccessNewBtn: "नई अपॉइंटमेंट बुक करें",
      locationEyebrow: "हमसे मिलें",
      locationHeading: "स्टूडियो का पता",
      locationSub: "परामर्श व सीधे उत्पाद खरीदने के लिए अहमदाबाद स्थित हमारे स्टूडियो में पधारें।",
      addressTitle: "स्टूडियो पता",
      addressFullLabel: "विस्तृत डाक पता",
      shortAddress: "निखार स्किनकेयर द्वारा हुनैना शेठवाला, रॉयल पार्क सोसाइटी, रज़ा-ए-मुस्तफा मस्जिद के पास, जुहापुरा, अहमदाबाद, गुजरात ३८००५५, भारत",
      workingHours: "सुबह १०:०० - शाम ०७:०० (सोमवार - रविवार)",
      hoursTitle: "कार्य समय",
      phoneTitle: "सीधा फोन व व्हाट्सएप",
      emailTitle: "आधिकारिक ईमेल",
      btnGetDirections: "रास्ता देखें (दिशा-निर्देश)",
      btnViewMaps: "गूगल मैप्स में खोलें",
      contactEyebrow: "सीधा संपर्क",
      contactHeading: "हमसे जुड़ें",
      contactSub: "क्रीम, साबुन या हेयर पैक से जुड़ा कोई भी प्रश्न हो? बेझिझक हुनैना से बात करें।",
      quickCallTitle: "फोन करें",
      quickCallBtn: "कॉल: ९०३३४४२५०१",
      quickWaTitle: "व्हाट्सएप",
      quickWaBtn: "व्हाट्सएप पर संदेश भेजें",
      quickIgTitle: "इंस्टाग्राम",
      quickIgBtn: "@nikhar_skincare फॉलो करें",
      quickEmailTitle: "ईमेल करें",
      quickEmailBtn: "ईमेल भेजें",
      footerAbout: "हुनैना शेठवाला द्वारा विशुद्ध हस्तनिर्मित, केमिकल व स्टेरॉयड मुक्त प्राकृतिक स्किनकेयर, बॉडी केयर व हेयर केयर।",
      footerQuickLinks: "महत्वपूर्ण लिंक",
      footerContact: "स्टूडियो संपर्क",
      footerNotice: "सर्वाधिकार सुरक्षित। बिना किसी हानिकारक रसायन के शुद्ध हर्बल देखभाल।",
      mobileBarCall: "कॉल",
      mobileBarWa: "व्हाट्सएप",
      mobileBarDirections: "रास्ता",
      mobileBarBook: "बुकिंग",
      valNameRequired: "कृपया अपना पूरा नाम दर्ज करें (कम से कम २ अक्षर)।",
      valPhoneInvalid: "कृपया १० अंकों का सही भारतीय मोबाइल नंबर दर्ज करें।",
      valServiceRequired: "कृपया सूची से एक सेवा चुनें।",
      valDateRequired: "कृपया अगले ६० दिनों के भीतर की तारीख चुनें।",
      valSlotRequired: "कृपया उपलब्ध समय स्लॉट चुनें।",
      toastBookingSuccess: "आपकी अपॉइंटमेंट सफलतापूर्वक आरक्षित हो गई!",
      toastBookingError: "बुकिंग पूरी नहीं हो सकी। कृपया पुनः प्रयास करें या सीधे व्हाट्सएप करें।",
      waPrefillGeneral: "नमस्ते हुनैना जी, मुझे निखार स्किनकेयर के हर्बल उत्पादों के बारे में जानकारी चाहिए।",
      waPrefillProduct: "नमस्ते हुनैना जी, मुझे इस उत्पाद की कीमत और विवरण चाहिए: ",
      waPrefillBooking: "नमस्ते हुनैना जी, मैंने निखार स्किनकेयर पर अपॉइंटमेंट बुक की है।\nसंदर्भ: {REF}\nनाम: {NAME}\nसेवा: {SERVICE}\nतारीख: {DATE}\nसमय: {SLOT}\nफोन: {PHONE}\nकृपया इस समय की पुष्टि करें। धन्यवाद!"
    }
  };

  // State
  let currentLang = "en";
  try {
    const saved = localStorage.getItem("nikhar_lang");
    if (saved === "hi" || saved === "en") {
      currentLang = saved;
    }
  } catch (e) {
    // localStorage disabled or private browsing
  }

  // Toast Notification Helper
  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

  // Event Analytics Tracker
  function trackEvent(event, meta = "") {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, meta, lang: currentLang })
    }).catch(() => {});
  }

  // Set Language Function with Safe Cross-Fade Transition
  function setLanguage(lang, isUserSwitch = false) {
    if (lang !== "en" && lang !== "hi") return;
    currentLang = lang;

    try {
      localStorage.setItem("nikhar_lang", lang);
    } catch (e) {}

    document.documentElement.lang = lang;

    // Update active pill button state
    const btnEn = document.getElementById("langBtnEn");
    const btnHi = document.getElementById("langBtnHi");
    if (btnEn && btnHi) {
      if (lang === "en") {
        btnEn.classList.add("active");
        btnHi.classList.remove("active");
      } else {
        btnHi.classList.add("active");
        btnEn.classList.remove("active");
      }
    }

    const dict = I18N[lang] || I18N.en;

    const applyTranslations = () => {
      try {
        // 1. Simple data-i18n innerText
        document.querySelectorAll("[data-i18n]").forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (dict[key]) {
            el.textContent = dict[key];
          }
        });

        // 2. Placeholder attributes
        document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
          const key = el.getAttribute("data-i18n-ph");
          if (dict[key]) {
            el.setAttribute("placeholder", dict[key]);
          }
        });

        // 3. Document Title & Meta
        if (dict.metaTitle) document.title = dict.metaTitle;
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta && dict.metaDesc) descMeta.setAttribute("content", dict.metaDesc);

        // 4. Products: Name, Desc, Badge
        document.querySelectorAll(".product-card").forEach((card) => {
          const nameEl = card.querySelector(".product-name");
          const descEl = card.querySelector(".product-desc");
          const badgeEl = card.querySelector(".product-badge");
          const enquireBtn = card.querySelector(".btn-wa-enquire");

          if (nameEl) {
            nameEl.textContent = lang === "hi"
              ? nameEl.getAttribute("data-i18n-name-hi") || nameEl.getAttribute("data-i18n-name-en")
              : nameEl.getAttribute("data-i18n-name-en");
          }

          if (descEl) {
            descEl.textContent = lang === "hi"
              ? descEl.getAttribute("data-i18n-desc-hi") || descEl.getAttribute("data-i18n-desc-en")
              : descEl.getAttribute("data-i18n-desc-en");
          }

          if (badgeEl) {
            badgeEl.textContent = lang === "hi"
              ? badgeEl.getAttribute("data-i18n-badge-hi") || badgeEl.getAttribute("data-i18n-badge-en")
              : badgeEl.getAttribute("data-i18n-badge-en");
          }

          if (enquireBtn) {
            const prodName = lang === "hi"
              ? enquireBtn.getAttribute("data-product-name-hi") || enquireBtn.getAttribute("data-product-name-en")
              : enquireBtn.getAttribute("data-product-name-en");
            const msg = dict.waPrefillProduct + (prodName || "");
            enquireBtn.onclick = () => {
              trackEvent("whatsapp", "product_" + (enquireBtn.getAttribute("data-product-id") || "item"));
              window.open(`${WA_BASE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
            };
          }
        });

        // 5. Trust Badges
        document.querySelectorAll(".trust-badge-card").forEach((card) => {
          const titleEl = card.querySelector("[data-i18n-title-en]");
          const subEl = card.querySelector("[data-i18n-sub-en]");
          if (titleEl) {
            titleEl.textContent = lang === "hi"
              ? titleEl.getAttribute("data-i18n-title-hi")
              : titleEl.getAttribute("data-i18n-title-en");
          }
          if (subEl) {
            subEl.textContent = lang === "hi"
              ? subEl.getAttribute("data-i18n-sub-hi")
              : subEl.getAttribute("data-i18n-sub-en");
          }
        });

        // 6. Service Options in select
        const serviceSelect = document.getElementById("bookService");
        if (serviceSelect) {
          Array.from(serviceSelect.options).forEach((opt) => {
            if (opt.value === "") {
              opt.textContent = dict.formServiceDefault;
            } else {
              opt.textContent = lang === "hi"
                ? opt.getAttribute("data-name-hi") || opt.getAttribute("data-name-en")
                : opt.getAttribute("data-name-en");
            }
          });
        }

        // 7. General WhatsApp Links
        const generalWaMsg = encodeURIComponent(dict.waPrefillGeneral);
        const heroWaBtn = document.getElementById("heroWaBtn");
        if (heroWaBtn) heroWaBtn.href = `${WA_BASE}?text=${generalWaMsg}`;
        const floatingWaBtn = document.getElementById("floatingWaBtn");
        if (floatingWaBtn) floatingWaBtn.href = `${WA_BASE}?text=${generalWaMsg}`;
        const mobileBarWaBtn = document.getElementById("mobileBarWaBtn");
        if (mobileBarWaBtn) mobileBarWaBtn.href = `${WA_BASE}?text=${generalWaMsg}`;
      } catch (err) {
        console.warn("Translation update warning:", err);
      }
    };

    if (isUserSwitch) {
      const translatables = document.querySelectorAll("[data-i18n], [data-i18n-ph], [data-i18n-name-en], [data-i18n-title-en]");
      translatables.forEach((el) => el.classList.add("i18n-fading"));
      setTimeout(() => {
        applyTranslations();
        translatables.forEach((el) => el.classList.remove("i18n-fading"));
      }, 100);
    } else {
      applyTranslations();
    }
  }

  // Set date constraints (Today to 60 days in Asia/Kolkata timezone)
  function initDateConstraints() {
    const dateInput = document.getElementById("bookDate");
    if (!dateInput) return;

    const now = new Date();
    const minStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const maxStr = maxDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    dateInput.min = minStr;
    dateInput.max = maxStr;
    dateInput.value = minStr;

    // Refresh slot availability for default today date
    fetchSlotsForDate(minStr);

    dateInput.addEventListener("change", (e) => {
      if (e.target.value) {
        fetchSlotsForDate(e.target.value);
      }
    });
  }

  // Live Slot Availability Fetcher
  async function fetchSlotsForDate(dateStr) {
    const slotSelect = document.getElementById("bookSlot");
    if (!slotSelect) return;

    const dict = I18N[currentLang] || I18N.en;
    slotSelect.innerHTML = `<option value="">${dict.formSlotLoading}</option>`;
    slotSelect.disabled = true;

    try {
      const res = await fetch(`/api/slots?date=${encodeURIComponent(dateStr)}`);
      const data = await res.json();

      slotSelect.innerHTML = `<option value="">${dict.formSlotDefault}</option>`;
      slotSelect.disabled = false;

      if (data.ok && Array.isArray(data.slots)) {
        data.slots.forEach((item) => {
          const opt = document.createElement("option");
          opt.value = item.slot;
          if (item.available) {
            opt.textContent = `${item.slot} (${dict.formSlotAvailable})`;
          } else {
            opt.textContent = `${item.slot} (${dict.formSlotFull})`;
            opt.disabled = true;
          }
          slotSelect.appendChild(opt);
        });
      }
    } catch {
      slotSelect.disabled = false;
      slotSelect.innerHTML = `<option value="">${dict.formSlotDefault}</option>`;
      const defaultSlots = [
        "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00",
        "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00"
      ];
      defaultSlots.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        slotSelect.appendChild(opt);
      });
    }
  }

  // Product Filter Tabs
  function initProductTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    const cards = document.querySelectorAll(".product-card");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const filter = tab.getAttribute("data-filter");

        cards.forEach((card) => {
          const cat = card.getAttribute("data-category");
          if (filter === "all" || cat === filter) {
            card.classList.remove("hidden");
            card.style.opacity = "0";
            card.style.transform = "translateY(10px)";
            setTimeout(() => {
              card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            }, 50);
          } else {
            card.classList.add("hidden");
          }
        });
      });
    });
  }

  // Booking Form Submission and Validation
  function initBookingForm() {
    const form = document.getElementById("bookingForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dict = I18N[currentLang] || I18N.en;

      // Clear previous error messages
      ["errFullName", "errPhone", "errEmail", "errService", "errDate", "errSlot"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
      });

      const fullName = (form.fullName.value || "").trim();
      const phone = (form.phone.value || "").trim();
      const email = (form.email.value || "").trim();
      const service = (form.service.value || "").trim();
      const date = (form.date.value || "").trim();
      const slot = (form.slot.value || "").trim();
      const notes = (form.notes.value || "").trim();
      const website_hp = (form.website_hp ? form.website_hp.value : "");

      // Validation
      let hasError = false;

      if (!fullName || fullName.length < 2) {
        document.getElementById("errFullName").textContent = dict.valNameRequired;
        hasError = true;
      }

      const cleanPhone = phone.replace(/[^\d]/g, "");
      const isPhoneValid = (cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone)) ||
                           (cleanPhone.length === 12 && cleanPhone.startsWith("91") && /^[6-9]\d{9}$/.test(cleanPhone.slice(2)));
      if (!isPhoneValid) {
        document.getElementById("errPhone").textContent = dict.valPhoneInvalid;
        hasError = true;
      }

      if (!service) {
        document.getElementById("errService").textContent = dict.valServiceRequired;
        hasError = true;
      }

      if (!date) {
        document.getElementById("errDate").textContent = dict.valDateRequired;
        hasError = true;
      }

      if (!slot) {
        document.getElementById("errSlot").textContent = dict.valSlotRequired;
        hasError = true;
      }

      if (hasError) return;

      const submitBtn = document.getElementById("bookSubmitBtn");
      const submitText = submitBtn.querySelector(".btn-text");
      const originalText = submitText.textContent;

      submitBtn.disabled = true;
      submitText.textContent = dict.formSubmitting;

      try {
        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            phone,
            email,
            service,
            date,
            slot,
            notes,
            lang: currentLang,
            website_hp
          })
        });

        const data = await res.json();

        if (res.status === 503 || (data && data.code === "DB_OFFLINE")) {
          // Graceful DB Offline Fallback
          form.style.display = "none";
          const offlineCard = document.getElementById("bookingOfflineNotice");
          if (offlineCard) {
            offlineCard.style.display = "block";
            const offlineWaLink = document.getElementById("offlineWaLink");
            if (offlineWaLink) {
              const selectedServiceOpt = form.service.options[form.service.selectedIndex];
              const serviceName = selectedServiceOpt ? selectedServiceOpt.textContent : service;
              const offlineMsg = dict.waPrefillBooking
                .replace("{REF}", "DIRECT-REQUEST")
                .replace("{NAME}", fullName)
                .replace("{SERVICE}", serviceName)
                .replace("{DATE}", date)
                .replace("{SLOT}", slot)
                .replace("{PHONE}", phone);
              offlineWaLink.href = `${WA_BASE}?text=${encodeURIComponent(offlineMsg)}`;
            }
          }
          showToast(dict.bookOfflineNotice, "error");
          return;
        }

        if (data.ok && data.ref) {
          // Success State
          form.style.display = "none";
          const successCard = document.getElementById("bookingSuccessCard");
          const refCodeEl = document.getElementById("successRefCode");
          const successWaBtn = document.getElementById("successWaBtn");

          if (refCodeEl) refCodeEl.textContent = data.ref;

          const selectedServiceOpt = form.service.options[form.service.selectedIndex];
          const serviceName = selectedServiceOpt ? selectedServiceOpt.textContent : service;

          const waConfirmMsg = dict.waPrefillBooking
            .replace("{REF}", data.ref)
            .replace("{NAME}", fullName)
            .replace("{SERVICE}", serviceName)
            .replace("{DATE}", date)
            .replace("{SLOT}", slot)
            .replace("{PHONE}", phone);

          if (successWaBtn) {
            successWaBtn.href = `${WA_BASE}?text=${encodeURIComponent(waConfirmMsg)}`;
          }

          if (successCard) {
            successCard.style.display = "block";
            successCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }

          showToast(dict.toastBookingSuccess, "success");
        } else {
          showToast(data.error || dict.toastBookingError, "error");
          submitBtn.disabled = false;
          submitText.textContent = originalText;
        }
      } catch (err) {
        // Fallback on network failure
        form.style.display = "none";
        const offlineCard = document.getElementById("bookingOfflineNotice");
        if (offlineCard) offlineCard.style.display = "block";
        showToast(dict.toastBookingError, "error");
      }
    });

    // Book another button
    const bookAnotherBtn = document.getElementById("bookAnotherBtn");
    if (bookAnotherBtn) {
      bookAnotherBtn.addEventListener("click", () => {
        const successCard = document.getElementById("bookingSuccessCard");
        if (successCard) successCard.style.display = "none";
        form.reset();
        initDateConstraints();
        form.style.display = "block";
        const submitBtn = document.getElementById("bookSubmitBtn");
        if (submitBtn) {
          submitBtn.disabled = false;
          const dict = I18N[currentLang] || I18N.en;
          submitBtn.querySelector(".btn-text").textContent = dict.formSubmitBtn;
        }
      });
    }
  }

  // Quick Action Tracking Click Listener
  function initTracking() {
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-track]");
      if (target) {
        const eventType = target.getAttribute("data-track");
        trackEvent(eventType, target.id || target.className);
      }
    });
  }

  // Scroll Reveal Animations - Never hide content with opacity 0
  function initScrollReveal() {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px 50px 0px" }
      );

      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        el.classList.add("reveal-ready");
        observer.observe(el);
      });
    } else {
      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        el.classList.add("revealed");
      });
    }
  }

  // Active Navigation Anchor Highlight on Scroll
  function initNavHighlight() {
    const sections = document.querySelectorAll("header[id], section[id]");
    const navLinks = document.querySelectorAll(".nav-link:not(.nav-admin-link)");

    window.addEventListener("scroll", () => {
      let currentId = "";
      sections.forEach((sec) => {
        const top = sec.offsetTop - 120;
        if (window.scrollY >= top) {
          currentId = sec.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentId}`) {
          link.classList.add("active");
        }
      });
    });
  }

  // Preloader Dismissal
  function initPreloader() {
    const preloader = document.getElementById("sitePreloader");
    if (preloader) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          preloader.classList.add("fade-out");
        }, 200);
      });
      // Safety timeout in case load event already fired
      setTimeout(() => {
        preloader.classList.add("fade-out");
      }, 1500);
    }
  }

  // Initialization
  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initDateConstraints();
    initProductTabs();
    initBookingForm();
    initTracking();
    initScrollReveal();
    initNavHighlight();

    // Language switcher button listeners
    const btnEn = document.getElementById("langBtnEn");
    const btnHi = document.getElementById("langBtnHi");
    if (btnEn) btnEn.addEventListener("click", () => setLanguage("en", true));
    if (btnHi) btnHi.addEventListener("click", () => setLanguage("hi", true));

    // Apply initial saved or default language without fading animation
    setLanguage(currentLang, false);
  });
})();
