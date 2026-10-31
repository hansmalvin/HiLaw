const test = require("node:test");

const assert = require("node:assert/strict");

const { loadTS } = require("./load-ts.cjs");

const { initialCoinStore, applyConsultation } = loadTS(
  "src/store/coinLedger.ts",
);

const {
  normalizePlatform,
  syncUsers,
  transitionConsultation,
  appendMessage,
  saveLawyer,
  addReview,
  earnings,
  mayReadConsultation,
} = loadTS("src/store/platform.ts");

const now = "2026-10-30T05:00:00.000Z";

function fixture() {
  const store = normalizePlatform(initialCoinStore());
  const customer = store.platform.users.find((u) => u.id === "demo-customer");
  const lawyer = store.platform.users.find((u) => u.id === "demo-lawyer");
  const admin = store.platform.users.find((u) => u.role === "ADMIN");
  const other = store.platform.users.find((u) => u.id === "demo-lawyer-aditya");
  const profile = store.platform.lawyers.find((l) => l.id === "nadira");
  const booked = normalizePlatform(
    applyConsultation(store, {
      userId: customer.id,
      name: customer.name,
      lawyer: profile,
      brief: "Konsultasi mengenai dokumen keluarga saya.",
      requestId: "booking-e2e",
      id: "session-e2e",
      now,
    }),
  );

  return {
    store,
    booked,
    customer,
    lawyer,
    admin,
    other,
  };
}

test("full lifecycle shares one persisted conversation across Customer and owning Lawyer and pays 20/80 only on completion", () => {
  const { booked, customer, lawyer, admin } = fixture();
  const before = earnings(booked).gross;
  let s = transitionConsultation(
    booked,
    lawyer,
    "session-e2e",
    "Confirmed",
    now,
  );
  assert.equal(s.consultations[0].status, "Confirmed");
  s = transitionConsultation(s, lawyer, "session-e2e", "Ongoing", now);
  s = appendMessage(s, customer, {
    id: "m-1",
    consultationId: "session-e2e",
    text: "Halo, saya ingin berkonsultasi.",
    now,
  });
  s = appendMessage(s, lawyer, {
    id: "m-2",
    consultationId: "session-e2e",
    text: "Halo. Mari ceritakan kronologinya.",
    now,
  });
  s = normalizePlatform(JSON.parse(JSON.stringify(s)));
  assert.equal(
    s.platform.messages.filter((m) => m.consultationId === "session-e2e")
      .length,
    2,
  );
  assert.equal(mayReadConsultation(s, admin, "session-e2e"), true);
  assert.equal(earnings(s).gross, before);
  s = transitionConsultation(s, customer, "session-e2e", "Completed", now);
  assert.equal(earnings(s).gross, before + 50);
  assert.equal(earnings(s).platform, (before + 50) * 0.2);
  assert.equal(earnings(s).lawyer, (before + 50) * 0.8);
  assert.equal(s.balances[customer.id], 70);
  assert.throws(
    () =>
      appendMessage(s, customer, {
        id: "closed",
        consultationId: "session-e2e",
        text: "late message",
        now,
      }),
    /Ongoing/,
  );
  assert.throws(
    () => transitionConsultation(s, lawyer, "session-e2e", "Completed", now),
    /tidak diizinkan/,
  );
  s = addReview(s, customer, "session-e2e", 5, "Penjelasannya mudah dipahami.");
  assert.equal(s.platform.reviews.length, 1);
  assert.throws(
    () => addReview(s, customer, "session-e2e", 5, "Ulasan kedua."),
    /sudah diulas/,
  );
});

test("rejection refunds exactly once and removes the session from earnings", () => {
  const { booked, lawyer, customer } = fixture();
  const cancelled = transitionConsultation(
    booked,
    lawyer,
    "session-e2e",
    "Cancelled",
    now,
  );
  assert.equal(cancelled.balances[customer.id], 120);
  assert.equal(
    cancelled.transactions.filter((t) => t.type === "REFUND").length,
    1,
  );
  assert.equal(cancelled.transactions[0].consultationId, "session-e2e");
  assert.equal(earnings(cancelled).gross, earnings(initialCoinStore()).gross);
  assert.throws(
    () =>
      transitionConsultation(
        cancelled,
        lawyer,
        "session-e2e",
        "Cancelled",
        now,
      ),
    /tidak diizinkan/,
  );
  assert.equal(
    cancelled.transactions.filter((t) => t.type === "REFUND").length,
    1,
  );
});

test("foreign role, Customer, and Admin cannot impersonate Lawyer lifecycle or send messages", () => {
  const { booked, customer, lawyer, admin, other } = fixture();
  assert.equal(mayReadConsultation(booked, other, "session-e2e"), false);
  assert.throws(
    () =>
      transitionConsultation(booked, other, "session-e2e", "Confirmed", now),
    /diakses/,
  );
  assert.throws(
    () =>
      transitionConsultation(booked, customer, "session-e2e", "Confirmed", now),
    /tidak diizinkan/,
  );
  assert.throws(
    () =>
      transitionConsultation(booked, admin, "session-e2e", "Confirmed", now),
    /tidak diizinkan/,
  );
  const ongoing = transitionConsultation(
    transitionConsultation(booked, lawyer, "session-e2e", "Confirmed", now),
    lawyer,
    "session-e2e",
    "Ongoing",
    now,
  );
  assert.throws(
    () =>
      appendMessage(ongoing, admin, {
        id: "admin-msg",
        consultationId: "session-e2e",
        text: "hello",
        now,
      }),
    /bukan peserta/,
  );
  assert.throws(
    () =>
      appendMessage(ongoing, other, {
        id: "other-msg",
        consultationId: "session-e2e",
        text: "hello",
        now,
      }),
    /bukan peserta/,
  );
});

test("Admin verification and deactivation affect the same Lawyer record and block acceptance", () => {
  const { booked, admin, lawyer, customer } = fixture();
  const disabled = saveLawyer(booked, admin, "nadira", {
    active: false,
  });
  assert.equal(
    disabled.platform.lawyers.find((l) => l.id === "nadira").active,
    false,
  );
  assert.throws(
    () =>
      transitionConsultation(disabled, lawyer, "session-e2e", "Confirmed", now),
    /belum aktif/,
  );
  assert.throws(
    () =>
      saveLawyer(booked, customer, "nadira", {
        rate: 1,
      }),
    /tidak dapat diakses/,
  );
  const rejected = saveLawyer(booked, admin, "nadira", {
    verification: "Rejected",
  });
  assert.throws(
    () =>
      transitionConsultation(rejected, lawyer, "session-e2e", "Confirmed", now),
    /belum aktif/,
  );
  const refund = transitionConsultation(
    disabled,
    admin,
    "session-e2e",
    "Cancelled",
    now,
  );
  assert.equal(refund.balances[customer.id], 120);
});

test("Lawyer profile edits remain owned, preserve historical price and cannot self-verify", () => {
  const { booked, lawyer, other } = fixture();
  const edited = saveLawyer(booked, lawyer, "nadira", {
    rate: 75,
    bio: "Deskripsi baru untuk profil pengacara.",
    online: false,
    verification: "Verified",
    active: false,
  });
  const l = edited.platform.lawyers.find((l) => l.id === "nadira");
  assert.equal(l.rate, 75);
  assert.equal(l.active, true);
  assert.equal(l.online, false);
  assert.equal(edited.consultations[0].rate, 50);
  assert.throws(
    () =>
      saveLawyer(booked, other, "nadira", {
        rate: 20,
      }),
    /tidak dapat diakses/,
  );
  assert.throws(
    () =>
      saveLawyer(booked, lawyer, "nadira", {
        rate: -1,
      }),
    /Periksa/,
  );
  assert.throws(
    () =>
      saveLawyer(booked, lawyer, "nadira", {
        avatarUrl: "javascript:alert(1)",
      }),
    /Foto profil/,
  );
});

test("legacy store preserves Coins and new Lawyer submits, resubmits, and waits for Admin approval", () => {
  const old = initialCoinStore(),
    s = normalizePlatform(old);
  assert.equal(s.balances["demo-customer"], 120);
  assert.equal(s.consultations.length, old.consultations.length);
  const user = {
    id: "new-lawyer",
    name: "Pengacara Baru",
    email: "baru@example.com",
    phone: "081234567890",
    role: "LAWYER",
  };
  const added = syncUsers(s, [user]);
  const profile = added.platform.lawyers.find((l) => l.userId === user.id);
  assert.equal(profile.verification, "Unsubmitted");
  assert.equal(profile.online, false);
  const legacyPending = {
    ...added,
    platform: { ...added.platform, lawyers: added.platform.lawyers.map((l) => l.id === profile.id ? { ...l, verification: "Pending" } : l) },
  };
  assert.equal(normalizePlatform(legacyPending).platform.lawyers.find((l) => l.id === profile.id).verification, "Unsubmitted");
  const edited = saveLawyer(added, user, profile.id, {
    verification: "Verified",
  });
  assert.equal(
    edited.platform.lawyers.find((l) => l.userId === user.id).verification,
    "Unsubmitted",
  );
  const admin = s.platform.users.find((u) => u.role === "ADMIN");
  assert.throws(() => saveLawyer(added, admin, profile.id, { verification: "Verified" }), /pending/);
  assert.throws(() => saveLawyer(added, user, profile.id, { verification: "Pending" }), /Lengkapi/);
  const application = {
    name: "Nama Pengacara Demo", licenseNumber: "DEMO-001", organization: "PERADI",
    specialty: profile.specialty, experience: 3, ktaFileName: "kta-demo.pdf", verification: "Pending",
  };
  const pending = normalizePlatform(JSON.parse(JSON.stringify(saveLawyer(added, user, profile.id, application))));
  assert.equal(pending.platform.lawyers.find((l) => l.id === profile.id).verification, "Pending");
  assert.throws(() => saveLawyer(pending, user, profile.id, application), /sedang menunggu/);
  const rejected = saveLawyer(pending, admin, profile.id, { verification: "Rejected" });
  const resubmitted = saveLawyer(rejected, user, profile.id, { ...application, licenseNumber: "DEMO-002" });
  const approved = saveLawyer(resubmitted, admin, profile.id, { verification: "Verified" });
  const result = approved.platform.lawyers.find((l) => l.id === profile.id);
  assert.equal(result.verification, "Verified");
  assert.equal(result.licenseNumber, "DEMO-002");
  assert.equal(result.ktaFileName, "kta-demo.pdf");
  assert.equal(result.name, application.name);
  assert.equal(result.active, true);
  assert.throws(() => saveLawyer(approved, user, profile.id, { specialty: "Hukum Pidana" }), /pengajuan ulang/);
  assert.throws(() => saveLawyer(approved, user, profile.id, { name: "Nama berbeda" }), /pengajuan ulang/);
  assert.throws(() => saveLawyer(approved, user, profile.id, { experience: 20 }), /pengajuan ulang/);
  const revised = saveLawyer(approved, user, profile.id, { ...application, experience: 4 });
  assert.equal(revised.platform.lawyers.find((l) => l.id === profile.id).verification, "Pending");
  assert.equal(revised.platform.lawyers.find((l) => l.id === profile.id).experience, 4);
  assert.throws(
    () =>
      normalizePlatform({
        ...s,
        platform: {
          ...s.platform,
          messages: [{}],
        },
      }),
    /tidak valid/,
  );
});

test("message retry is idempotent and an invalid lifecycle transition never mutates state", () => {
  const { booked, lawyer, customer } = fixture(),
    original = JSON.stringify(booked);
  assert.throws(
    () =>
      transitionConsultation(booked, lawyer, "session-e2e", "Completed", now),
    /tidak diizinkan/,
  );
  assert.equal(JSON.stringify(booked), original);
  let s = transitionConsultation(
    transitionConsultation(booked, lawyer, "session-e2e", "Confirmed", now),
    lawyer,
    "session-e2e",
    "Ongoing",
    now,
  );
  const input = {
    id: "retry-message",
    consultationId: "session-e2e",
    text: "Halo pengacara.",
    now,
  };
  s = appendMessage(s, customer, input);
  assert.equal(appendMessage(s, customer, input), s);
});
